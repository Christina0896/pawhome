import { getSupabaseAdminClient } from '../../../../../lib/supabaseAdmin';
import { requireSameOrigin } from '../../../../../lib/requireSameOrigin';
import { getStoragePathFromPublicUrl } from '../../../../../lib/storagePaths';
import { getAuthenticatedUser, removeStorageFiles } from '../../../../../lib/apiHelpers';
import { sendListingNotification } from '../../../../../lib/listingNotifications';
import {
  ALLOWED_ANIMAL_TYPES,
  ALLOWED_LISTING_TYPES,
  ALLOWED_SEXES,
  ALLOWED_YES_NO,
  cleanBoolean,
  cleanNullableText,
  cleanText,
  getImageExtension,
  validateImageFileContent,
  validateListingAgeAndDates,
} from '../../../../../lib/listingValidation';

export const dynamic = 'force-dynamic';

const LISTING_PHOTOS_BUCKET = 'listing-photos';

async function cleanupInsertedPhotos(supabaseAdmin, photoIds, uploadedPaths) {
  if (photoIds.length > 0) {
    await supabaseAdmin.from('listing_photos').delete().in('id', photoIds);
  }

  await removeStorageFiles(supabaseAdmin, LISTING_PHOTOS_BUCKET, uploadedPaths, 'Edit listing photo rollback');
}

export async function PATCH(request, { params }) {
  const sameOriginError = requireSameOrigin(request);
  if (sameOriginError) return sameOriginError;

  const supabaseAdmin = getSupabaseAdminClient();

  if (!supabaseAdmin) {
    return Response.json({ error: 'Edit listing service is not configured.' }, { status: 500 });
  }

  const { id } = await params;
  const listingId = Number(id);

  if (!Number.isInteger(listingId) || listingId < 1) {
    return Response.json({ error: 'Missing listing ID.' }, { status: 400 });
  }

  const { user, error: authError } = await getAuthenticatedUser(supabaseAdmin, request);
  if (authError) return authError;

  try {
    const { data: existingListing, error: existingListingError } = await supabaseAdmin
      .from('listings')
      .select('id, user_id, seller_type, seller_verified, seller_verified_at')
      .eq('id', listingId)
      .maybeSingle();

    if (existingListingError) {
      console.error('Edit listing lookup failed:', {
        message: existingListingError.message,
        code: existingListingError.code,
      });

      return Response.json({ error: 'Could not check listing.' }, { status: 500 });
    }

    if (!existingListing) return Response.json({ error: 'Listing not found.' }, { status: 404 });
    if (existingListing.user_id !== user.id) return Response.json({ error: 'Not allowed.' }, { status: 403 });

    const body = await request.formData();

    const title = cleanText(body.get('title'), 80);
    const listingType = cleanText(body.get('listing_type'), 40);
    const animalType = cleanText(body.get('animal_type'), 40);
    const breed = cleanText(body.get('breed'), 80);
    const age = cleanText(body.get('age'), 40);
    const sex = cleanText(body.get('sex'), 40);
    const county = cleanText(body.get('county'), 80);
    const city = cleanText(body.get('city'), 80);
    const description = cleanText(body.get('description'), 800);

    const priceRaw = cleanText(body.get('price'), 20);
    const price = priceRaw === '' ? null : Number(priceRaw);
    const priceNegotiable = listingType === 'For Adoption' ? false : cleanBoolean(body.get('price_negotiable'));

    const microchipped = cleanText(body.get('microchipped'), 20);
    const vaccinated = cleanNullableText(body.get('vaccinated'), 20);
    const wormed = cleanNullableText(body.get('wormed'), 20);
    const vetChecked = cleanNullableText(body.get('vet_checked'), 20);
    const spayedNeutered = cleanNullableText(body.get('spayed_neutered'), 20);
    const healthTested = cleanNullableText(body.get('health_tested'), 20);
    const kennelClubRegistered = animalType === 'Dogs' ? cleanNullableText(body.get('kennel_club_registered'), 20) : null;

    const litterSize = cleanNullableText(body.get('litter_size'), 10);
    const availableLitterCount = cleanNullableText(body.get('available_litter_count'), 10);
    const maleCount = Number(cleanText(body.get('male_count'), 10) || 0);
    const femaleCount = Number(cleanText(body.get('female_count'), 10) || 0);
    const dateOfBirth = cleanNullableText(body.get('date_of_birth'), 20);
    const readyToLeave = cleanNullableText(body.get('ready_to_leave'), 20);
    const motherCanBeSeen = cleanNullableText(body.get('mother_can_be_seen'), 20);

    const registrationNumber = cleanNullableText(body.get('registration_number'), 120);
    const organisationName = cleanNullableText(body.get('organisation_name'), 120);
    const provenStud = listingType === 'For Stud' ? cleanNullableText(body.get('proven_stud'), 20) : null;
    const studTerms = listingType === 'For Stud' ? cleanNullableText(body.get('stud_terms'), 800) : null;

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
    if (!ALLOWED_SEXES.includes(sex)) {
      return Response.json({ error: 'Please select a valid sex.' }, { status: 400 });
    }
    if ((listingType === 'For Sale' || listingType === 'For Stud') && (!price || price <= 0)) {
      return Response.json({ error: 'Please enter a valid price.' }, { status: 400 });
    }
    if (price !== null && !Number.isFinite(price)) {
      return Response.json({ error: 'Please enter a valid price.' }, { status: 400 });
    }
    if (!county) return Response.json({ error: 'Please select a county.' }, { status: 400 });
    if (animalType === 'Dogs' && !ALLOWED_YES_NO.includes(microchipped)) {
      return Response.json({ error: 'Please confirm if the dog is microchipped.' }, { status: 400 });
    }
    if (listingType === 'For Stud' && provenStud && !ALLOWED_YES_NO.includes(provenStud)) {
      return Response.json({ error: 'Please select a valid proven-stud option.' }, { status: 400 });
    }
    if (description.length < 80) {
      return Response.json({ error: 'Description must be at least 80 characters.' }, { status: 400 });
    }

    const isDogOrCat = ['dogs', 'cats'].includes(animalType.toLowerCase());
    const isMixedLitter = sex === 'Mixed Litter';
    const ageError = validateListingAgeAndDates({
      animalType,
      breed,
      age,
      dateOfBirth,
      readyToLeave,
      requireDates: isDogOrCat && isMixedLitter,
    });

    if (ageError) return Response.json({ error: ageError }, { status: 400 });

    if (isDogOrCat && isMixedLitter) {
      const litterSizeNumber = Number(litterSize);
      const availableLitterNumber = Number(availableLitterCount);

      if (!Number.isInteger(litterSizeNumber) || litterSizeNumber < 1) {
        return Response.json({ error: 'Litter size must be at least 1.' }, { status: 400 });
      }
      if (!Number.isInteger(availableLitterNumber) || availableLitterNumber < 1) {
        return Response.json({ error: 'Available count must be at least 1.' }, { status: 400 });
      }
      if (!Number.isInteger(maleCount) || maleCount < 0 || !Number.isInteger(femaleCount) || femaleCount < 0) {
        return Response.json({ error: 'Boys and girls must be valid numbers.' }, { status: 400 });
      }
      if (availableLitterNumber > litterSizeNumber) {
        return Response.json({ error: 'Available cannot be higher than litter size.' }, { status: 400 });
      }
      if (maleCount + femaleCount !== availableLitterNumber) {
        return Response.json({ error: 'Boys and girls together must match the available count.' }, { status: 400 });
      }
    }

    for (const photo of newPhotos) {
      const imageError = await validateImageFileContent(photo);
      if (imageError) return Response.json({ error: imageError }, { status: 400 });
    }

    const { data: currentPhotos, error: currentPhotosError } = await supabaseAdmin
      .from('listing_photos')
      .select('id, image_url, sort_order')
      .eq('listing_id', listingId)
      .order('sort_order', { ascending: true });

    if (currentPhotosError) {
      console.error('Edit listing photo lookup failed:', {
        message: currentPhotosError.message,
        code: currentPhotosError.code,
      });

      return Response.json({ error: 'Could not load the current photos. No changes were saved.' }, { status: 500 });
    }

    let photosToDelete = [];

    if (photoDeleteIds.length > 0) {
      const { data: deleteRows, error: deleteLookupError } = await supabaseAdmin
        .from('listing_photos')
        .select('id, image_url, sort_order')
        .eq('listing_id', listingId)
        .in('id', photoDeleteIds);

      if (deleteLookupError) {
        return Response.json({ error: 'Could not check photos to delete.' }, { status: 500 });
      }

      photosToDelete = deleteRows || [];
    }

    const deleteIdSet = new Set(photosToDelete.map((photo) => String(photo.id)));
    const remainingPhotos = (currentPhotos || []).filter((photo) => !deleteIdSet.has(String(photo.id)));
    const finalPhotoCount = remainingPhotos.length + newPhotos.length;

    if (finalPhotoCount < 1) return Response.json({ error: 'Please keep at least one photo.' }, { status: 400 });
    if (finalPhotoCount > 6) {
      return Response.json({ error: 'You can upload a maximum of 6 photos.' }, { status: 400 });
    }

    const nextSortOrder = remainingPhotos.reduce((max, photo) => Math.max(max, Number(photo.sort_order) || 0), -1) + 1;
    const uploadedPaths = [];
    const newPhotoRows = [];

    for (let i = 0; i < newPhotos.length; i += 1) {
      const file = newPhotos[i];
      const fileExt = getImageExtension(file);
      const fileName = `${user.id}/${listingId}-edit-${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabaseAdmin.storage.from(LISTING_PHOTOS_BUCKET).upload(fileName, file, {
        upsert: false,
        contentType: file.type,
      });

      if (uploadError) {
        await removeStorageFiles(supabaseAdmin, LISTING_PHOTOS_BUCKET, uploadedPaths, 'Edit listing photo cleanup');
        return Response.json({ error: 'Photo upload failed. No listing changes were saved.' }, { status: 500 });
      }

      uploadedPaths.push(fileName);
      const { data: publicUrlData } = supabaseAdmin.storage.from(LISTING_PHOTOS_BUCKET).getPublicUrl(fileName);
      newPhotoRows.push({
        listing_id: listingId,
        image_url: publicUrlData.publicUrl,
        sort_order: nextSortOrder + i,
      });
    }

    let insertedPhotoRows = [];

    if (newPhotoRows.length > 0) {
      const { data, error: photoInsertError } = await supabaseAdmin
        .from('listing_photos')
        .insert(newPhotoRows)
        .select('id');

      if (photoInsertError) {
        await removeStorageFiles(supabaseAdmin, LISTING_PHOTOS_BUCKET, uploadedPaths, 'Edit listing photo cleanup');
        return Response.json({ error: 'Could not save new photos. No listing changes were saved.' }, { status: 500 });
      }

      insertedPhotoRows = data || [];
    }

    const updatePayload = {
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
      microchipped: animalType === 'Dogs' ? microchipped : null,
      vaccinated,
      wormed,
      vet_checked: vetChecked,
      spayed_neutered: spayedNeutered,
      health_tested: healthTested,
      kennel_club_registered: kennelClubRegistered,
      proven_stud: provenStud,
      stud_terms: studTerms,
      litter_size: isMixedLitter ? litterSize : null,
      available_litter_count: isMixedLitter ? availableLitterCount : null,
      male_count: isMixedLitter ? maleCount : 0,
      female_count: isMixedLitter ? femaleCount : 0,
      date_of_birth: dateOfBirth,
      ready_to_leave: readyToLeave,
      mother_can_be_seen: isMixedLitter ? motherCanBeSeen : null,
      registration_number: registrationNumber,
      organisation_name: organisationName,
      description,
      status: 'pending',
    };

    const { data: updatedListing, error: updateError } = await supabaseAdmin
      .from('listings')
      .update(updatePayload)
      .eq('id', listingId)
      .eq('user_id', user.id)
      .select('id, status')
      .maybeSingle();

    if (updateError || !updatedListing) {
      await cleanupInsertedPhotos(
        supabaseAdmin,
        insertedPhotoRows.map((row) => row.id),
        uploadedPaths,
      );

      return Response.json({ error: 'Could not save listing. No existing photos were removed.' }, { status: 500 });
    }

    let cleanupWarning = '';

    if (photosToDelete.length > 0) {
      const idsToDelete = photosToDelete.map((photo) => photo.id);
      const { error: photoDeleteError } = await supabaseAdmin
        .from('listing_photos')
        .delete()
        .eq('listing_id', listingId)
        .in('id', idsToDelete);

      if (photoDeleteError) {
        console.error('Edit listing old photo cleanup failed:', {
          message: photoDeleteError.message,
          code: photoDeleteError.code,
        });
        cleanupWarning = 'The listing was saved, but some old photos could not be removed. PawHome will retry cleanup.';
      } else {
        const pathsToDelete = photosToDelete
          .map((photo) => getStoragePathFromPublicUrl(photo.image_url, LISTING_PHOTOS_BUCKET))
          .filter(Boolean);
        await removeStorageFiles(supabaseAdmin, LISTING_PHOTOS_BUCKET, pathsToDelete, 'Edit listing old photo cleanup');
      }
    }

    const notification = await sendListingNotification({
      supabaseAdmin,
      listingId,
      eventType: 'listing_review',
    });

    if (notification.error) {
      console.warn('Listing review notification queued for retry:', { message: notification.error?.message });
    }

    return Response.json(
      { success: true, listing: updatedListing, warning: cleanupWarning || undefined },
      { status: 200 },
    );
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
  if (sameOriginError) return sameOriginError;

  const supabaseAdmin = getSupabaseAdminClient();

  if (!supabaseAdmin) {
    return Response.json({ error: 'Delete listing service is not configured.' }, { status: 500 });
  }

  const { id } = await params;
  const listingId = Number(id);

  if (!Number.isInteger(listingId) || listingId < 1) {
    return Response.json({ error: 'Missing listing ID.' }, { status: 400 });
  }

  const { user, error: authError } = await getAuthenticatedUser(supabaseAdmin, request);
  if (authError) return authError;

  try {
    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select('id, user_id')
      .eq('id', listingId)
      .maybeSingle();

    if (listingError) return Response.json({ error: 'Could not check listing.' }, { status: 500 });
    if (!listing) return Response.json({ success: true, alreadyDeleted: true }, { status: 200 });
    if (listing.user_id !== user.id) return Response.json({ error: 'Not allowed.' }, { status: 403 });

    const { data: photos, error: photosError } = await supabaseAdmin
      .from('listing_photos')
      .select('image_url')
      .eq('listing_id', listingId);

    if (photosError) return Response.json({ error: 'Could not check listing photos.' }, { status: 500 });

    const photoPaths = [
      ...new Set(
        (photos || []).map((photo) => getStoragePathFromPublicUrl(photo.image_url, LISTING_PHOTOS_BUCKET)).filter(Boolean),
      ),
    ];

    const { data: deleted, error: deleteError } = await supabaseAdmin.rpc('delete_listing_with_dependencies', {
      p_listing_id: listingId,
      p_owner_id: user.id,
    });

    if (deleteError) {
      console.error('Listing database deletion failed:', {
        message: deleteError.message,
        code: deleteError.code,
      });
      return Response.json({ error: 'Listing could not be deleted.' }, { status: 500 });
    }

    if (!deleted) return Response.json({ error: 'Listing not found or not allowed.' }, { status: 404 });

    await removeStorageFiles(supabaseAdmin, LISTING_PHOTOS_BUCKET, photoPaths, 'Listing photo storage cleanup');

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
