import { getSupabaseAdminClient } from '../../../../../lib/supabaseAdmin';
import { requireSameOrigin } from '../../../../../lib/requireSameOrigin';
import { getStoragePathFromPublicUrl } from '../../../../../lib/storagePaths';

export const dynamic = 'force-dynamic';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const IMAGE_EXTENSION_BY_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const ALLOWED_LISTING_TYPES = ['For Sale', 'For Stud', 'For Adoption'];
const ALLOWED_ANIMAL_TYPES = ['Dogs', 'Cats', 'Other Pets'];
const ALLOWED_SEXES = ['Male', 'Female', 'Mixed Litter'];
const ALLOWED_YES_NO = ['Yes', 'No'];

function cleanText(value, maxLength = 120) {
  return String(value || '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength);
}

function cleanNullableText(value, maxLength = 120) {
  const cleaned = cleanText(value, maxLength);
  return cleaned || null;
}

function cleanBoolean(value) {
  return String(value) === 'true';
}

function normalizeSellerType(value) {
  const cleaned = cleanText(value, 80);

  if (cleaned === 'Registered Breeder' || cleaned === 'Breeder') {
    return 'Registered Breeder';
  }

  if (cleaned === 'Private Seller' || cleaned === 'Seller') {
    return 'Private Seller';
  }

  if (cleaned === 'Shelter / Rescue') {
    return 'Shelter / Rescue';
  }

  return '';
}

function validateImageFile(file) {
  if (!file || typeof file === 'string') {
    return 'Invalid image file.';
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Only JPG, PNG, and WebP images are allowed.';
  }

  if (file.name?.toLowerCase().endsWith('.svg')) {
    return 'SVG images are not allowed.';
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return 'Each photo must be 5 MB or smaller.';
  }

  return '';
}

 function getMinimumLegalAgeWeeks(animalType, breed) {
  const cleanAnimalType = String(animalType || '')
    .trim()
    .toLowerCase();
  const cleanBreed = String(breed || '')
    .trim()
    .toLowerCase();

  if (cleanAnimalType === 'dogs' || cleanAnimalType === 'cats') return 8;
  if (cleanBreed.includes('rabbit')) return 6;

  if (
    cleanBreed.includes('guinea pig') ||
    cleanBreed.includes('gerbil') ||
    cleanBreed.includes('hamster') ||
    cleanBreed.includes('mouse') ||
    cleanBreed.includes('mice') ||
    cleanBreed.includes('rat')
  ) {
    return 4;
  }

  if (cleanBreed.includes('ferret')) return 8;

  return null;
}

function addWeeksToDate(dateString, weeks) {
  if (!dateString || !weeks) return null;

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return null;

  date.setDate(date.getDate() + weeks * 7);

  return date;
}

async function getAuthenticatedUser(supabaseAdmin, request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();

  if (!token) {
    return { error: Response.json({ error: 'Not authenticated.' }, { status: 401 }) };
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token);

  if (userError || !user) {
    return { error: Response.json({ error: 'Invalid session.' }, { status: 401 }) };
  }

  return { user };
}

async function safeDelete(query, label) {
  const { error } = await query;

  if (error) {
    console.error(`${label} delete error:`, {
      message: error?.message,
      code: error?.code,
      details: error?.details,
    });

    throw error;
  }
}

async function removeStorageFiles(supabaseAdmin, paths = []) {
  const safePaths = [...new Set(paths)].filter(Boolean);

  if (safePaths.length === 0) return;

  const { error } = await supabaseAdmin.storage.from('listing-photos').remove(safePaths);

  if (error) {
    console.error('Listing photo storage cleanup error:', {
      message: error?.message,
      code: error?.code,
    });
  }
}

export async function PATCH(request, { params }) {
  const sameOriginError = requireSameOrigin(request);

  if (sameOriginError) {
    return sameOriginError;
  }

  const supabaseAdmin = getSupabaseAdminClient();

  if (!supabaseAdmin) {
    return Response.json({ error: 'Edit listing service is not configured.' }, { status: 500 });
  }

  const { id } = await params;
  const listingId = Number(id);

  if (!listingId) {
    return Response.json({ error: 'Missing listing ID.' }, { status: 400 });
  }

  const { user, error: authError } = await getAuthenticatedUser(supabaseAdmin, request);

  if (authError) {
    return authError;
  }

  try {
    const { data: existingListing, error: existingListingError } = await supabaseAdmin
      .from('listings')
      .select('id, user_id')
      .eq('id', listingId)
      .maybeSingle();

    if (existingListingError) {
      console.error('Edit listing lookup failed:', {
        message: existingListingError.message,
        code: existingListingError.code,
      });

      return Response.json({ error: 'Could not check listing.' }, { status: 500 });
    }

    if (!existingListing) {
      return Response.json({ error: 'Listing not found.' }, { status: 404 });
    }

    if (existingListing.user_id !== user.id) {
      return Response.json({ error: 'Not allowed.' }, { status: 403 });
    }

    const body = await request.formData();

    const title = cleanText(body.get('title'), 80);
    const listingType = cleanText(body.get('listing_type'), 40);
    const animalType = cleanText(body.get('animal_type'), 40);
    const breed = cleanText(body.get('breed'), 80);
    const age = cleanText(body.get('age'), 40);
    const sex = cleanText(body.get('sex'), 40);
    const county = cleanText(body.get('county'), 80);
    const city = cleanText(body.get('city'), 80);
    const sellerType = normalizeSellerType(body.get('seller_type'));
    const description = cleanText(body.get('description'), 800);

    const priceRaw = cleanText(body.get('price'), 20);
    const price = priceRaw === '' ? null : Number(priceRaw);

    const priceNegotiable = cleanBoolean(body.get('price_negotiable'));

    const microchipped = cleanText(body.get('microchipped'), 20);
    const vaccinated = cleanNullableText(body.get('vaccinated'), 20);
    const wormed = cleanNullableText(body.get('wormed'), 20);
    const vetChecked = cleanNullableText(body.get('vet_checked'), 20);
    const spayedNeutered = cleanNullableText(body.get('spayed_neutered'), 20);
    const healthTested = cleanNullableText(body.get('health_tested'), 20);
    const kennelClubRegistered = cleanNullableText(body.get('kennel_club_registered'), 20);

    const litterSize = cleanNullableText(body.get('litter_size'), 10);
    const availableLitterCount = cleanNullableText(body.get('available_litter_count'), 10);
    const dateOfBirth = cleanNullableText(body.get('date_of_birth'), 20);
    const readyToLeave = cleanNullableText(body.get('ready_to_leave'), 20);
    const motherCanBeSeen = cleanNullableText(body.get('mother_can_be_seen'), 20);

    const registrationNumber = cleanNullableText(body.get('registration_number'), 120);
    const organisationName = cleanNullableText(body.get('organisation_name'), 120);

    const photoDeleteIds = [
      ...new Set(
        body
          .getAll('photosToDelete')
          .map((value) => String(value || '').trim())
          .filter(Boolean),
      ),
    ];

    const newPhotos = body.getAll('newPhotos').filter((file) => file && typeof file !== 'string' && file.size > 0);

    if (title.length < 5) {
      return Response.json({ error: 'Please enter a listing title with at least 5 characters.' }, { status: 400 });
    }

    if (!ALLOWED_LISTING_TYPES.includes(listingType)) {
      return Response.json({ error: 'Please select a valid ad type.' }, { status: 400 });
    }

    if (!ALLOWED_ANIMAL_TYPES.includes(animalType)) {
      return Response.json({ error: 'Please select a valid animal type.' }, { status: 400 });
    }

    if (breed.length < 2) {
      return Response.json({ error: 'Please enter a breed or pet type.' }, { status: 400 });
    }

    if (!age) {
      return Response.json({ error: "Please enter the pet's age." }, { status: 400 });
    }

    if (!ALLOWED_SEXES.includes(sex)) {
      return Response.json({ error: 'Please select a valid sex.' }, { status: 400 });
    }

    if ((listingType === 'For Sale' || listingType === 'For Stud') && (!price || price <= 0)) {
      return Response.json({ error: 'Please enter a valid price.' }, { status: 400 });
    }

    if (price !== null && !Number.isFinite(price)) {
      return Response.json({ error: 'Please enter a valid price.' }, { status: 400 });
    }

    if (!county) {
      return Response.json({ error: 'Please select a county.' }, { status: 400 });
    }

    if (!sellerType) {
      return Response.json({ error: 'Please select a valid seller type.' }, { status: 400 });
    }

    if (animalType === 'Dogs' && !ALLOWED_YES_NO.includes(microchipped)) {
      return Response.json({ error: 'Please confirm if the dog is microchipped.' }, { status: 400 });
    }

    if (description.length < 80) {
      return Response.json({ error: 'Description must be at least 80 characters.' }, { status: 400 });
    }

    const isDogOrCat = ['dogs', 'cats'].includes(animalType.toLowerCase());
    const isMixedLitter = sex === 'Mixed Litter';

    if (isDogOrCat && isMixedLitter) {
      if (!litterSize || !availableLitterCount) {
        return Response.json({ error: 'Please enter complete litter information.' }, { status: 400 });
      }

      const litterSizeNumber = Number(litterSize);
      const availableLitterNumber = Number(availableLitterCount);

      if (!Number.isFinite(litterSizeNumber) || !Number.isFinite(availableLitterNumber)) {
        return Response.json({ error: 'Please enter valid litter numbers.' }, { status: 400 });
      }

      if (availableLitterNumber > litterSizeNumber) {
        return Response.json({ error: 'Available cannot be higher than litter size.' }, { status: 400 });
      }

      if (!dateOfBirth || !readyToLeave) {
        return Response.json({ error: 'Please enter litter date of birth and ready-to-leave date.' }, { status: 400 });
      }

      const minimumWeeks = getMinimumLegalAgeWeeks(animalType, breed);
      const minimumReadyDate = addWeeksToDate(dateOfBirth, minimumWeeks);
      const readyDate = new Date(readyToLeave);

      if (minimumReadyDate && readyDate < minimumReadyDate) {
        return Response.json(
          { error: `This litter is too young to leave. Minimum age is ${minimumWeeks} weeks.` },
          { status: 400 },
        );
      }
    }

    for (const photo of newPhotos) {
      const imageError = validateImageFile(photo);

      if (imageError) {
        return Response.json({ error: imageError }, { status: 400 });
      }
    }

    const { data: currentPhotos, error: currentPhotosError } = await supabaseAdmin
      .from('listing_photos')
      .select('id, image_url, sort_order')
      .eq('listing_id', listingId);

    if (currentPhotosError) {
      console.error('Edit listing photo lookup failed:', {
        message: currentPhotosError.message,
        code: currentPhotosError.code,
      });

      return Response.json({ error: 'Could not check listing photos.' }, { status: 500 });
    }

    let photosToDelete = [];

    if (photoDeleteIds.length > 0) {
      const { data: deleteRows, error: deleteLookupError } = await supabaseAdmin
        .from('listing_photos')
        .select('id, image_url')
        .eq('listing_id', listingId)
        .in('id', photoDeleteIds);

      if (deleteLookupError) {
        console.error('Edit listing photo delete lookup failed:', {
          message: deleteLookupError.message,
          code: deleteLookupError.code,
        });

        return Response.json({ error: 'Could not check photos to delete.' }, { status: 500 });
      }

      photosToDelete = deleteRows || [];
    }

    const remainingExistingPhotoCount = (currentPhotos || []).length - photosToDelete.length;
    const finalPhotoCount = remainingExistingPhotoCount + newPhotos.length;

    if (finalPhotoCount < 1) {
      return Response.json({ error: 'Please keep at least one photo.' }, { status: 400 });
    }

    if (finalPhotoCount > 6) {
      return Response.json({ error: 'You can upload a maximum of 6 photos.' }, { status: 400 });
    }

    const uploadedPaths = [];
    const newPhotoRows = [];

    for (let i = 0; i < newPhotos.length; i++) {
      const file = newPhotos[i];
      const fileExt = IMAGE_EXTENSION_BY_TYPE[file.type];

      if (!fileExt) {
        await removeStorageFiles(supabaseAdmin, uploadedPaths);

        return Response.json({ error: 'Only JPG, PNG, and WebP images are allowed.' }, { status: 400 });
      }

      const fileName = `${user.id}/${listingId}-edit-${Date.now()}-${i}.${fileExt}`;

      const { error: uploadError } = await supabaseAdmin.storage.from('listing-photos').upload(fileName, file, {
        upsert: false,
        contentType: file.type,
      });

      if (uploadError) {
        console.error('Edit listing photo upload failed:', {
          message: uploadError.message,
          code: uploadError.code,
        });

        await removeStorageFiles(supabaseAdmin, uploadedPaths);

        return Response.json({ error: 'Photo upload failed.' }, { status: 500 });
      }

      uploadedPaths.push(fileName);

      const { data: publicUrlData } = supabaseAdmin.storage.from('listing-photos').getPublicUrl(fileName);

      newPhotoRows.push({
        listing_id: listingId,
        image_url: publicUrlData.publicUrl,
        sort_order: remainingExistingPhotoCount + i,
      });
    }

    const { data: updatedListing, error: updateError } = await supabaseAdmin
      .from('listings')
      .update({
        title,
        listing_type: listingType,
        animal_type: animalType,
        breed,
        age,
        sex,
        price,
        price_negotiable: priceNegotiable,
        county,
        city,
        seller_type: sellerType,
        microchipped: animalType === 'Dogs' ? microchipped : null,
        vaccinated,
        wormed,
        vet_checked: vetChecked,
        spayed_neutered: spayedNeutered,
        health_tested: healthTested,
        kennel_club_registered: kennelClubRegistered,
        litter_size: isMixedLitter ? litterSize : null,
        available_litter_count: isMixedLitter ? availableLitterCount : null,
        date_of_birth: dateOfBirth,
        ready_to_leave: readyToLeave,
        mother_can_be_seen: motherCanBeSeen,
        registration_number: registrationNumber,
        organisation_name: organisationName,
        description,
        status: 'pending',
      })
      .eq('id', listingId)
      .eq('user_id', user.id)
      .select('id, status')
      .maybeSingle();

    if (updateError || !updatedListing) {
      console.error('Server listing edit failed:', {
        message: updateError?.message,
        code: updateError?.code,
      });

      await removeStorageFiles(supabaseAdmin, uploadedPaths);

      return Response.json({ error: 'Could not save listing.' }, { status: 500 });
    }

    if (photosToDelete.length > 0) {
      const idsToDelete = photosToDelete.map((photo) => photo.id);

      const { error: photoDeleteError } = await supabaseAdmin
        .from('listing_photos')
        .delete()
        .eq('listing_id', listingId)
        .in('id', idsToDelete);

      if (photoDeleteError) {
        console.error('Edit listing photo row delete failed:', {
          message: photoDeleteError.message,
          code: photoDeleteError.code,
        });

        await removeStorageFiles(supabaseAdmin, uploadedPaths);

        return Response.json({ error: 'Could not delete old photo rows.' }, { status: 500 });
      }

      const pathsToDelete = photosToDelete
        .map((photo) => getStoragePathFromPublicUrl(photo.image_url, 'listing-photos'))
        .filter(Boolean);

      await removeStorageFiles(supabaseAdmin, pathsToDelete);
    }

    if (newPhotoRows.length > 0) {
      const { error: photoInsertError } = await supabaseAdmin.from('listing_photos').insert(newPhotoRows);

      if (photoInsertError) {
        console.error('Edit listing photo row insert failed:', {
          message: photoInsertError.message,
          code: photoInsertError.code,
        });

        await removeStorageFiles(supabaseAdmin, uploadedPaths);

        return Response.json({ error: 'Could not save new photos.' }, { status: 500 });
      }
    }

    return Response.json({ success: true, listing: updatedListing }, { status: 200 });
  } catch (error) {
    console.error('Edit listing route error:', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
    });

    return Response.json({ error: 'Listing could not be saved.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const sameOriginError = requireSameOrigin(request);

  if (sameOriginError) {
    return sameOriginError;
  }

  const supabaseAdmin = getSupabaseAdminClient();

  if (!supabaseAdmin) {
    return Response.json({ error: 'Delete listing service is not configured.' }, { status: 500 });
  }

  const { id } = await params;
  const listingId = Number(id);

  if (!listingId) {
    return Response.json({ error: 'Missing listing ID.' }, { status: 400 });
  }

  const { user, error: authError } = await getAuthenticatedUser(supabaseAdmin, request);

  if (authError) {
    return authError;
  }

  try {
    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select('id, user_id')
      .eq('id', listingId)
      .maybeSingle();

    if (listingError) {
      console.error('Delete listing lookup failed:', {
        message: listingError.message,
        code: listingError.code,
      });

      return Response.json({ error: 'Could not check listing.' }, { status: 500 });
    }

    if (!listing) {
      return Response.json({ success: true, alreadyDeleted: true }, { status: 200 });
    }

    if (listing.user_id !== user.id) {
      return Response.json({ error: 'Not allowed.' }, { status: 403 });
    }

    const { data: photos, error: photosError } = await supabaseAdmin
      .from('listing_photos')
      .select('image_url')
      .eq('listing_id', listingId);

    if (photosError) {
      console.error('Listing photo lookup failed:', {
        message: photosError.message,
        code: photosError.code,
      });

      return Response.json({ error: 'Could not check listing photos.' }, { status: 500 });
    }

    const photoPaths = [
      ...new Set(
        (photos || []).map((photo) => getStoragePathFromPublicUrl(photo.image_url, 'listing-photos')).filter(Boolean),
      ),
    ];

    await safeDelete(supabaseAdmin.from('favorites').delete().eq('listing_id', listingId), 'listing favourites');
    await safeDelete(supabaseAdmin.from('listing_reports').delete().eq('listing_id', listingId), 'listing reports');
    await safeDelete(supabaseAdmin.from('listing_photos').delete().eq('listing_id', listingId), 'listing photo rows');
    await safeDelete(supabaseAdmin.from('listings').delete().eq('id', listingId).eq('user_id', user.id), 'listing');

    await removeStorageFiles(supabaseAdmin, photoPaths);

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Delete listing route error:', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
    });

    return Response.json({ error: 'Listing could not be deleted.' }, { status: 500 });
  }
}
