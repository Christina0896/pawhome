import { getSupabaseAdminClient } from '../../../../../../lib/supabaseAdmin';
import { requireSameOrigin } from '../../../../../../lib/requireSameOrigin';
import { getAuthenticatedUser, removeStorageFiles } from '../../../../../../lib/apiHelpers';
import { getStoragePathFromPublicUrl } from '../../../../../../lib/storagePaths';
import { getImageExtension, validateImageFileContent } from '../../../../../../lib/listingValidation';
import {
  ALLOWED_LITTER_ANIMAL_STATUSES,
  getLitterCounts,
  parseLitterAnimalsPayload,
} from '../../../../../../lib/litterAnimals';

export const dynamic = 'force-dynamic';

const LISTING_PHOTOS_BUCKET = 'listing-photos';

function isMissingLitterTable(error) {
  return ['42P01', 'PGRST205'].includes(error?.code);
}

async function getOwnedLitter(supabaseAdmin, listingId, userId) {
  const { data, error } = await supabaseAdmin
    .from('listings')
    .select('id, user_id, title, animal_type, breed, sex, price, litter_size, status')
    .eq('id', listingId)
    .maybeSingle();

  if (error) return { error: Response.json({ error: 'Could not load the listing.' }, { status: 500 }) };
  if (!data) return { error: Response.json({ error: 'Listing not found.' }, { status: 404 }) };
  if (data.user_id !== userId) return { error: Response.json({ error: 'Not allowed.' }, { status: 403 }) };

  if (data.sex !== 'Mixed Litter' || !['Dogs', 'Cats'].includes(data.animal_type)) {
    return { error: Response.json({ error: 'This listing is not a dog or cat litter.' }, { status: 400 }) };
  }

  return { listing: data };
}

async function loadAnimals(supabaseAdmin, listingId) {
  return supabaseAdmin
    .from('litter_animals')
    .select('id, listing_id, name, sex, colour, price, status, description, image_url, sort_order, created_at, updated_at')
    .eq('listing_id', listingId)
    .order('sort_order', { ascending: true });
}

async function updateListingCounts(supabaseAdmin, listingId, animals, extraFields = {}) {
  const counts = getLitterCounts(animals);

  return supabaseAdmin
    .from('listings')
    .update({
      available_litter_count: counts.available,
      male_count: counts.males,
      female_count: counts.females,
      ...extraFields,
    })
    .eq('id', listingId);
}

export async function GET(request, { params }) {
  const supabaseAdmin = getSupabaseAdminClient();
  if (!supabaseAdmin) return Response.json({ error: 'Litter manager is not configured.' }, { status: 500 });

  const { id } = await params;
  const listingId = Number(id);
  if (!listingId) return Response.json({ error: 'Missing listing ID.' }, { status: 400 });

  const { user, error: authError } = await getAuthenticatedUser(supabaseAdmin, request);
  if (authError) return authError;

  const owned = await getOwnedLitter(supabaseAdmin, listingId, user.id);
  if (owned.error) return owned.error;

  const { data: animals, error } = await loadAnimals(supabaseAdmin, listingId);

  if (error) {
    if (isMissingLitterTable(error)) {
      return Response.json({ error: 'The litter manager database migration has not been applied yet.' }, { status: 503 });
    }

    return Response.json({ error: 'Could not load litter animals.' }, { status: 500 });
  }

  return Response.json({ listing: owned.listing, animals: animals || [] }, { status: 200 });
}

export async function PUT(request, { params }) {
  const sameOriginError = requireSameOrigin(request);
  if (sameOriginError) return sameOriginError;

  const supabaseAdmin = getSupabaseAdminClient();
  if (!supabaseAdmin) return Response.json({ error: 'Litter manager is not configured.' }, { status: 500 });

  const { id } = await params;
  const listingId = Number(id);
  if (!listingId) return Response.json({ error: 'Missing listing ID.' }, { status: 400 });

  const { user, error: authError } = await getAuthenticatedUser(supabaseAdmin, request);
  if (authError) return authError;

  const owned = await getOwnedLitter(supabaseAdmin, listingId, user.id);
  if (owned.error) return owned.error;

  const body = await request.formData();
  const parsed = parseLitterAnimalsPayload(body.get('litter_animals'), { allowIds: true });
  if (parsed.error) return Response.json({ error: parsed.error }, { status: 400 });

  const animals = parsed.animals;
  const litterSize = Number(owned.listing.litter_size || 0);

  if (litterSize > 0 && animals.length > litterSize) {
    return Response.json({ error: 'Individual animal cards cannot exceed the litter size.' }, { status: 400 });
  }

  const { data: existingAnimals, error: existingError } = await loadAnimals(supabaseAdmin, listingId);

  if (existingError) {
    if (isMissingLitterTable(existingError)) {
      return Response.json({ error: 'The litter manager database migration has not been applied yet.' }, { status: 503 });
    }

    return Response.json({ error: 'Could not load current litter animals.' }, { status: 500 });
  }

  const existingById = new Map((existingAnimals || []).map((animal) => [String(animal.id), animal]));

  for (const animal of animals) {
    if (animal.id && !existingById.has(String(animal.id))) {
      return Response.json({ error: 'One submitted animal does not belong to this litter.' }, { status: 403 });
    }

    const photo = body.get(`litter_photo_${animal.client_key}`);
    const hasNewPhoto = photo && typeof photo !== 'string' && photo.size > 0;

    if (!animal.id && !hasNewPhoto) {
      return Response.json({ error: `Please add an individual photo for ${animal.name}.` }, { status: 400 });
    }

    if (hasNewPhoto) {
      const imageError = await validateImageFileContent(photo);
      if (imageError) return Response.json({ error: `${animal.name}: ${imageError}` }, { status: 400 });
    }
  }

  const uploadedPaths = [];
  const oldUrlsToRemove = [];
  const savedIds = new Set();
  const insertedIds = [];
  const updatedOriginals = [];

  const rollbackAnimalRows = async () => {
    for (const original of updatedOriginals) {
      await supabaseAdmin
        .from('litter_animals')
        .update({
          name: original.name,
          sex: original.sex,
          colour: original.colour,
          price: original.price,
          status: original.status,
          description: original.description,
          image_url: original.image_url,
          sort_order: original.sort_order,
          updated_at: original.updated_at,
        })
        .eq('id', original.id)
        .eq('listing_id', listingId);
    }

    if (insertedIds.length > 0) {
      await supabaseAdmin.from('litter_animals').delete().eq('listing_id', listingId).in('id', insertedIds);
    }

    await removeStorageFiles(supabaseAdmin, LISTING_PHOTOS_BUCKET, uploadedPaths, 'Litter manager upload rollback');
  };

  for (const animal of animals) {
    const existing = animal.id ? existingById.get(String(animal.id)) : null;
    const photo = body.get(`litter_photo_${animal.client_key}`);
    const hasNewPhoto = photo && typeof photo !== 'string' && photo.size > 0;
    let imageUrl = existing?.image_url || '';

    if (hasNewPhoto) {
      const fileExt = getImageExtension(photo);
      const fileName = `${user.id}/${listingId}-litter-${animal.sort_order}-${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
      const { error: uploadError } = await supabaseAdmin.storage.from(LISTING_PHOTOS_BUCKET).upload(fileName, photo, {
        cacheControl: '3600',
        upsert: false,
        contentType: photo.type,
      });

      if (uploadError) {
        await removeStorageFiles(supabaseAdmin, LISTING_PHOTOS_BUCKET, uploadedPaths, 'Litter manager upload rollback');
        return Response.json({ error: `Could not upload the photo for ${animal.name}.` }, { status: 500 });
      }

      uploadedPaths.push(fileName);
      const { data: publicUrlData } = supabaseAdmin.storage.from(LISTING_PHOTOS_BUCKET).getPublicUrl(fileName);
      imageUrl = publicUrlData.publicUrl;
      if (existing?.image_url) oldUrlsToRemove.push(existing.image_url);
    }

    const row = {
      listing_id: listingId,
      name: animal.name,
      sex: animal.sex,
      colour: animal.colour,
      price: animal.price,
      status: animal.status,
      description: animal.description,
      image_url: imageUrl,
      sort_order: animal.sort_order,
      updated_at: new Date().toISOString(),
    };

    const query = existing
      ? supabaseAdmin.from('litter_animals').update(row).eq('id', existing.id).eq('listing_id', listingId).select('id').single()
      : supabaseAdmin.from('litter_animals').insert(row).select('id').single();

    const { data: savedAnimal, error: saveError } = await query;

    if (saveError || !savedAnimal) {
      await rollbackAnimalRows();
      return Response.json({ error: `Could not save ${animal.name}.` }, { status: 500 });
    }

    savedIds.add(String(savedAnimal.id));
    if (existing) updatedOriginals.push(existing);
    else insertedIds.push(savedAnimal.id);
  }

  const removedAnimals = (existingAnimals || []).filter((animal) => !savedIds.has(String(animal.id)));

  if (removedAnimals.length > 0) {
    const { error: deleteError } = await supabaseAdmin
      .from('litter_animals')
      .delete()
      .eq('listing_id', listingId)
      .in('id', removedAnimals.map((animal) => animal.id));

    if (deleteError) {
      await rollbackAnimalRows();
      return Response.json({ error: 'Could not remove deleted litter animals.' }, { status: 500 });
    }
    oldUrlsToRemove.push(...removedAnimals.map((animal) => animal.image_url));
  }

  const { error: countError } = await updateListingCounts(supabaseAdmin, listingId, animals, { status: 'pending' });
  if (countError) return Response.json({ error: 'Animals were saved, but litter totals could not be updated.' }, { status: 500 });

  const oldPaths = oldUrlsToRemove
    .map((url) => getStoragePathFromPublicUrl(url, LISTING_PHOTOS_BUCKET))
    .filter(Boolean);
  await removeStorageFiles(supabaseAdmin, LISTING_PHOTOS_BUCKET, oldPaths, 'Litter manager old photo cleanup');

  const { data: refreshedAnimals } = await loadAnimals(supabaseAdmin, listingId);
  return Response.json({ success: true, status: 'pending', animals: refreshedAnimals || [] }, { status: 200 });
}

export async function PATCH(request, { params }) {
  const sameOriginError = requireSameOrigin(request);
  if (sameOriginError) return sameOriginError;

  const supabaseAdmin = getSupabaseAdminClient();
  if (!supabaseAdmin) return Response.json({ error: 'Litter manager is not configured.' }, { status: 500 });

  const { id } = await params;
  const listingId = Number(id);
  if (!listingId) return Response.json({ error: 'Missing listing ID.' }, { status: 400 });

  const { user, error: authError } = await getAuthenticatedUser(supabaseAdmin, request);
  if (authError) return authError;

  const owned = await getOwnedLitter(supabaseAdmin, listingId, user.id);
  if (owned.error) return owned.error;

  const payload = await request.json().catch(() => ({}));
  const animalId = String(payload.animalId || '').trim();
  const status = String(payload.status || '').trim().toLowerCase();

  if (!animalId || !ALLOWED_LITTER_ANIMAL_STATUSES.includes(status)) {
    return Response.json({ error: 'Please select a valid animal and status.' }, { status: 400 });
  }

  const { data: updatedAnimal, error: updateError } = await supabaseAdmin
    .from('litter_animals')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', animalId)
    .eq('listing_id', listingId)
    .select('id')
    .maybeSingle();

  if (updateError || !updatedAnimal) {
    if (isMissingLitterTable(updateError)) {
      return Response.json({ error: 'The litter manager database migration has not been applied yet.' }, { status: 503 });
    }

    return Response.json({ error: 'Could not update this animal.' }, { status: 500 });
  }

  const { data: animals, error: animalsError } = await loadAnimals(supabaseAdmin, listingId);
  if (animalsError) return Response.json({ error: 'Status changed, but litter totals could not be loaded.' }, { status: 500 });

  const { error: countError } = await updateListingCounts(supabaseAdmin, listingId, animals || []);
  if (countError) return Response.json({ error: 'Status changed, but litter totals could not be updated.' }, { status: 500 });

  return Response.json({ success: true, animals: animals || [] }, { status: 200 });
}
