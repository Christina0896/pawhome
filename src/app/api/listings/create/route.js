import { getSupabaseAdminClient } from '../../../../lib/supabaseAdmin';
import { requireSameOrigin } from '../../../../lib/requireSameOrigin';
import { getAuthenticatedUser, removeStorageFiles } from '../../../../lib/apiHelpers';
import { isTrueFlag } from '../../../../lib/booleanFlags';
import { sendListingNotification } from '../../../../lib/listingNotifications';
import {
  ALLOWED_ANIMAL_TYPES,
  ALLOWED_LISTING_TYPES,
  ALLOWED_SEXES,
  ALLOWED_YES_NO,
  buildAgeLabel,
  cleanBoolean,
  cleanNullableText,
  cleanPhone,
  cleanText,
  getImageExtension,
  validateImageFileContent,
  validateListingAgeAndDates,
} from '../../../../lib/listingValidation';
import { formatPhoneForVerification } from '../../../../lib/phoneVerification';
import { getSellerTrustSnapshot } from '../../../../lib/sellerTrust';

export const dynamic = 'force-dynamic';

const REQUIRE_EMAIL_VERIFICATION_TO_POST = true;
const REQUIRE_PHONE_VERIFICATION_TO_POST = true;
const LISTING_PHOTOS_BUCKET = 'listing-photos';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function deleteListingRows(supabaseAdmin, listingId) {
  if (!listingId) return;

  await supabaseAdmin.from('listing_photos').delete().eq('listing_id', listingId);
  await supabaseAdmin.from('favorites').delete().eq('listing_id', listingId);
  await supabaseAdmin.from('listing_reports').delete().eq('listing_id', listingId);
  await supabaseAdmin.from('listings').delete().eq('id', listingId);
}

async function findExistingSubmission(supabaseAdmin, userId, submissionKey) {
  const { data, error } = await supabaseAdmin
    .from('listings')
    .select('id, status')
    .eq('user_id', userId)
    .eq('submission_key', submissionKey)
    .maybeSingle();

  return { listing: data || null, error: error || null };
}

export async function POST(request) {
  const sameOriginError = requireSameOrigin(request);
  if (sameOriginError) return sameOriginError;

  const supabaseAdmin = getSupabaseAdminClient();

  if (!supabaseAdmin) {
    return Response.json({ error: 'Listing service is not configured.' }, { status: 500 });
  }

  const { user, error: authError } = await getAuthenticatedUser(supabaseAdmin, request);
  if (authError) return authError;

  const isEmailVerified = Boolean(user.email_confirmed_at || user.confirmed_at);

  if (REQUIRE_EMAIL_VERIFICATION_TO_POST && !isEmailVerified) {
    return Response.json({ error: 'Please verify your email before posting an ad.' }, { status: 403 });
  }

  try {
    const body = await request.formData();
    const submissionKey = cleanText(body.get('submission_key'), 50);

    if (!UUID_PATTERN.test(submissionKey)) {
      return Response.json({ error: 'Invalid submission key. Refresh the form and try again.' }, { status: 400 });
    }

    const existingSubmission = await findExistingSubmission(supabaseAdmin, user.id, submissionKey);

    if (existingSubmission.error) {
      console.error('Listing idempotency lookup failed:', existingSubmission.error);
      return Response.json({ error: 'Could not check the listing submission.' }, { status: 500 });
    }

    if (existingSubmission.listing) {
      return Response.json(
        { success: true, listing: existingSubmission.listing, deduplicated: true },
        { status: 200 },
      );
    }

    const title = cleanText(body.get('title'), 80);
    const listingType = cleanText(body.get('listing_type'), 40);
    const animalType = cleanText(body.get('animal_type'), 40);
    const breed = cleanText(body.get('breed'), 80);
    const age =
      buildAgeLabel(body.get('age_value') || body.get('age'), body.get('age_unit')) || cleanText(body.get('age'), 40);
    const sex = cleanText(body.get('sex'), 40);
    const county = cleanText(body.get('county'), 80);
    const city = cleanText(body.get('city'), 80);
    const description = cleanText(body.get('description'), 800);

    const priceRaw = cleanText(body.get('price'), 20);
    const price = priceRaw === '' ? null : Number(priceRaw);

    const microchipped = cleanText(body.get('microchipped'), 20);
    const vaccinated = cleanNullableText(body.get('vaccinated'), 20);
    const wormed = cleanNullableText(body.get('wormed'), 20);
    const vetChecked = cleanNullableText(body.get('vet_checked'), 20);
    const spayedNeutered = cleanNullableText(body.get('spayed_neutered'), 20);
    const healthTested = cleanNullableText(body.get('health_tested'), 20);
    const kennelClubRegistered =
      animalType === 'Dogs' ? cleanNullableText(body.get('kc_registered'), 20) : null;

    const litterSize = cleanNullableText(body.get('litter_size'), 10);
    const availableLitterCount = cleanNullableText(body.get('available_litter_count'), 10);
    const maleCount = Number(cleanText(body.get('male_count'), 10) || 0);
    const femaleCount = Number(cleanText(body.get('female_count'), 10) || 0);

    const dateOfBirth = cleanNullableText(body.get('date_of_birth'), 20);
    const readyToLeave = cleanNullableText(body.get('ready_to_leave'), 20);
    const motherCanBeSeen = cleanNullableText(body.get('mother_can_be_seen'), 20);

    const registrationNumber = cleanNullableText(body.get('registrationNumber'), 120);
    const organisationName = cleanNullableText(body.get('organisationName'), 120);
    const provenStud = listingType === 'For Stud' ? cleanNullableText(body.get('proven_stud'), 20) : null;
    const studTerms = listingType === 'For Stud' ? cleanNullableText(body.get('stud_terms'), 800) : null;

    const priceNegotiable = listingType === 'For Adoption' ? false : cleanBoolean(body.get('price_negotiable'));
    const photos = body.getAll('photos');

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

    if (!county) {
      return Response.json({ error: 'Please select a county.' }, { status: 400 });
    }

    if (animalType === 'Dogs' && !ALLOWED_YES_NO.includes(microchipped)) {
      return Response.json({ error: 'Please confirm if the dog is microchipped.' }, { status: 400 });
    }

    if (listingType === 'For Stud' && provenStud && !ALLOWED_YES_NO.includes(provenStud)) {
      return Response.json({ error: 'Please select a valid proven-stud option.' }, { status: 400 });
    }

    if (description.length < 80) {
      return Response.json({ error: 'Description must be at least 80 characters.' }, { status: 400 });
    }

    if (photos.length === 0) {
      return Response.json({ error: 'Please upload at least one photo.' }, { status: 400 });
    }

    if (photos.length > 6) {
      return Response.json({ error: 'You can upload a maximum of 6 photos.' }, { status: 400 });
    }

    for (const photo of photos) {
      const imageError = await validateImageFileContent(photo);
      if (imageError) return Response.json({ error: imageError }, { status: 400 });
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
      if (!litterSize || !availableLitterCount) {
        return Response.json({ error: 'Please enter complete litter information.' }, { status: 400 });
      }

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

    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select(
        'user_id, first_name, last_name, phone_code, phone_number, phone_verified, verified_phone_e164, created_at, seller_verification_status, seller_verified_type, seller_verified_at',
      )
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError || !profileData) {
      return Response.json(
        { error: 'Your profile could not be loaded. Please go to your profile and save your details.' },
        { status: 400 },
      );
    }

    if (!profileData.phone_number) {
      return Response.json({ error: 'Please add a phone number to your profile before posting an ad.' }, { status: 403 });
    }

    const canonicalSavedPhone = formatPhoneForVerification(profileData.phone_code, profileData.phone_number);

    if (
      REQUIRE_PHONE_VERIFICATION_TO_POST &&
      (!isTrueFlag(profileData.phone_verified) ||
        !profileData.verified_phone_e164 ||
        profileData.verified_phone_e164 !== canonicalSavedPhone)
    ) {
      return Response.json(
        { error: 'Please verify your current phone number by automated call before posting an ad.' },
        { status: 403 },
      );
    }

    const sellerName =
      cleanText(`${profileData.first_name || ''} ${profileData.last_name || ''}`, 120) || 'Seller';
    const contactPhone = cleanPhone(`${profileData.phone_code || ''} ${profileData.phone_number || ''}`);
    const sellerMemberSince = profileData.created_at || user.created_at;
    const sellerTrust = getSellerTrustSnapshot(profileData);

    const insertPayload = {
      user_id: user.id,
      submission_key: submissionKey,
      title,
      animal_type: animalType,
      listing_type: listingType,
      breed,
      age,
      sex,
      county,
      city,
      seller_name: sellerName,
      seller_type: sellerTrust.sellerType,
      seller_verified: sellerTrust.sellerVerified,
      seller_verified_at: sellerTrust.sellerVerifiedAt,
      price,
      price_negotiable: priceNegotiable,
      microchipped: microchipped || null,
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
      mother_can_be_seen: motherCanBeSeen,
      registration_number: registrationNumber,
      organisation_name: organisationName,
      seller_member_since: sellerMemberSince,
      contact_phone: contactPhone,
      description,
      status: 'pending',
    };

    const { data: listingData, error: listingError } = await supabaseAdmin
      .from('listings')
      .insert(insertPayload)
      .select()
      .single();

    if (listingError) {
      if (listingError.code === '23505') {
        const duplicate = await findExistingSubmission(supabaseAdmin, user.id, submissionKey);
        if (duplicate.listing) {
          return Response.json(
            { success: true, listing: duplicate.listing, deduplicated: true },
            { status: 200 },
          );
        }
      }

      console.error('Server listing insert failed:', {
        message: listingError.message,
        code: listingError.code,
        details: listingError.details,
      });

      return Response.json(
        { error: 'Could not submit listing. Please check your details and try again.' },
        { status: 500 },
      );
    }

    const photoRows = [];
    const uploadedPaths = [];

    for (let i = 0; i < photos.length; i += 1) {
      const file = photos[i];
      const fileExt = getImageExtension(file);
      const fileName = `${user.id}/${listingData.id}-${i}-${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabaseAdmin.storage.from(LISTING_PHOTOS_BUCKET).upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

      if (uploadError) {
        console.error('Server photo upload failed:', {
          message: uploadError.message,
          code: uploadError.code,
        });

        await removeStorageFiles(supabaseAdmin, LISTING_PHOTOS_BUCKET, uploadedPaths, 'Listing create storage rollback');
        await deleteListingRows(supabaseAdmin, listingData.id);

        return Response.json({ error: 'Photo upload failed. Your listing was not created.' }, { status: 500 });
      }

      uploadedPaths.push(fileName);

      const { data: publicUrlData } = supabaseAdmin.storage.from(LISTING_PHOTOS_BUCKET).getPublicUrl(fileName);
      photoRows.push({
        listing_id: listingData.id,
        image_url: publicUrlData.publicUrl,
        sort_order: i,
      });
    }

    const { error: photoDbError } = await supabaseAdmin.from('listing_photos').insert(photoRows);

    if (photoDbError) {
      console.error('Server photo DB insert failed:', {
        message: photoDbError.message,
        code: photoDbError.code,
      });

      await removeStorageFiles(supabaseAdmin, LISTING_PHOTOS_BUCKET, uploadedPaths, 'Listing create storage rollback');
      await deleteListingRows(supabaseAdmin, listingData.id);

      return Response.json(
        { error: 'Photo records could not be saved. Your listing was not created.' },
        { status: 500 },
      );
    }

    const notification = await sendListingNotification({
      supabaseAdmin,
      listingId: listingData.id,
      eventType: 'new_listing',
    });

    if (notification.error) {
      console.warn('New listing notification queued for retry:', {
        message: notification.error?.message,
      });
    }

    return Response.json({ success: true, listing: listingData }, { status: 201 });
  } catch (error) {
    console.error('Create listing route error:', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
    });

    return Response.json({ error: 'Something went wrong while creating the listing.' }, { status: 500 });
  }
}
