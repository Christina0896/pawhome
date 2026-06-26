import { getSupabaseAdminClient } from '../../../../lib/supabaseAdmin';
import { requireSameOrigin } from '../../../../lib/requireSameOrigin';

export const dynamic = 'force-dynamic';

const REQUIRE_VERIFICATION_TO_POST = true;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const IMAGE_EXTENSION_BY_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const ALLOWED_LISTING_TYPES = ['For Sale', 'For Stud', 'For Adoption'];
const ALLOWED_ANIMAL_TYPES = ['Dogs', 'Cats', 'Other Pets'];
const ALLOWED_SEXES = ['Male', 'Female', 'Mixed Litter'];
const ALLOWED_YES_NO = ['Yes', 'No'];
const ALLOWED_SELLER_TYPES = ['Private Seller', 'Registered Breeder', 'Shelter / Rescue'];

function cleanText(value, maxLength = 120) {
  return String(value || '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLength);
}

function cleanPhone(value) {
  return String(value || '')
    .replace(/[^\d+\s()-]/g, '')
    .trim()
    .slice(0, 30);
}

function cleanNullableText(value, maxLength = 120) {
  const cleaned = cleanText(value, maxLength);
  return cleaned || null;
}

function cleanBoolean(value) {
  return String(value) === 'true';
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

async function removeUploadedStorageFiles(supabaseAdmin, paths = []) {
  const safePaths = [...new Set(paths)].filter(Boolean);

  if (safePaths.length === 0) return;

  const { error } = await supabaseAdmin.storage.from('listing-photos').remove(safePaths);

  if (error) {
    console.error('Listing create storage rollback failed:', {
      message: error?.message,
      code: error?.code,
    });
  }
}

async function deleteListingRows(supabaseAdmin, listingId) {
  if (!listingId) return;

  await supabaseAdmin.from('listing_photos').delete().eq('listing_id', listingId);
  await supabaseAdmin.from('favorites').delete().eq('listing_id', listingId);
  await supabaseAdmin.from('listing_reports').delete().eq('listing_id', listingId);
  await supabaseAdmin.from('listings').delete().eq('id', listingId);
}

export async function POST(request) {
  const sameOriginError = requireSameOrigin(request);

  if (sameOriginError) {
    return sameOriginError;
  }

  const supabaseAdmin = getSupabaseAdminClient();

  if (!supabaseAdmin) {
    return Response.json({ error: 'Listing service is not configured.' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();

  if (!token) {
    return Response.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token);

  if (userError || !user) {
    return Response.json({ error: 'Invalid session.' }, { status: 401 });
  }

  const isEmailVerified = Boolean(user.email_confirmed_at || user.confirmed_at);

  if (REQUIRE_VERIFICATION_TO_POST && !isEmailVerified) {
    return Response.json({ error: 'Please verify your email before posting an ad.' }, { status: 403 });
  }

  try {
    const body = await request.formData();

    const title = cleanText(body.get('title'), 80);
    const listingType = cleanText(body.get('listing_type'), 40);
    const animalType = cleanText(body.get('animal_type'), 40);
    const breed = cleanText(body.get('breed'), 80);
    const age = cleanText(body.get('age'), 40);
    const sex = cleanText(body.get('sex'), 40);
    const county = cleanText(body.get('county'), 80);
    const city = cleanText(body.get('city'), 80);
    const sellerType = cleanText(body.get('seller_type'), 80);
    const description = cleanText(body.get('description'), 800);

    const priceRaw = cleanText(body.get('price'), 20);
    const price = priceRaw === '' ? null : Number(priceRaw);

    const microchipped = cleanText(body.get('microchipped'), 20);
    const vaccinated = cleanNullableText(body.get('vaccinated'), 20);
    const wormed = cleanNullableText(body.get('wormed'), 20);
    const vetChecked = cleanNullableText(body.get('vet_checked'), 20);
    const spayedNeutered = cleanNullableText(body.get('spayed_neutered'), 20);
    const healthTested = cleanNullableText(body.get('health_tested'), 20);
    const kennelClubRegistered = cleanNullableText(body.get('kc_registered'), 20);

    const litterSize = cleanNullableText(body.get('litter_size'), 10);
    const availableLitterCount = cleanNullableText(body.get('available_litter_count'), 10);
    const maleCount = Number(cleanText(body.get('male_count'), 10) || 0);
    const femaleCount = Number(cleanText(body.get('female_count'), 10) || 0);

    const dateOfBirth = cleanNullableText(body.get('date_of_birth'), 20);
    const readyToLeave = cleanNullableText(body.get('ready_to_leave'), 20);
    const motherCanBeSeen = cleanNullableText(body.get('mother_can_be_seen'), 20);

    const registrationNumber = cleanNullableText(body.get('registrationNumber'), 120);
    const organisationName = cleanNullableText(body.get('organisationName'), 120);

    const priceNegotiable = cleanBoolean(body.get('price_negotiable'));

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

    if (!age) {
      return Response.json({ error: "Please enter the pet's age." }, { status: 400 });
    }

    if (!ALLOWED_SEXES.includes(sex)) {
      return Response.json({ error: 'Please select a valid sex.' }, { status: 400 });
    }

    if ((listingType === 'For Sale' || listingType === 'For Stud') && (!price || price <= 0)) {
      return Response.json({ error: 'Please enter a valid price.' }, { status: 400 });
    }

    if (!county) {
      return Response.json({ error: 'Please select a county.' }, { status: 400 });
    }

    if (!ALLOWED_SELLER_TYPES.includes(sellerType)) {
      return Response.json({ error: 'Please select a valid seller type.' }, { status: 400 });
    }

    if (animalType === 'Dogs' && !ALLOWED_YES_NO.includes(microchipped)) {
      return Response.json({ error: 'Please confirm if the dog is microchipped.' }, { status: 400 });
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
      const imageError = validateImageFile(photo);

      if (imageError) {
        return Response.json({ error: imageError }, { status: 400 });
      }
    }

    const isDogOrCat = ['dogs', 'cats'].includes(animalType.toLowerCase());
    const isMixedLitter = sex === 'Mixed Litter';

    if (isDogOrCat && isMixedLitter) {
      if (!litterSize || !availableLitterCount) {
        return Response.json({ error: 'Please enter complete litter information.' }, { status: 400 });
      }

      const litterSizeNumber = Number(litterSize);
      const availableLitterNumber = Number(availableLitterCount);

      if (availableLitterNumber > litterSizeNumber) {
        return Response.json({ error: 'Available cannot be higher than litter size.' }, { status: 400 });
      }

      if (maleCount + femaleCount !== availableLitterNumber) {
        return Response.json({ error: 'Boys and girls together must match the available count.' }, { status: 400 });
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

    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError || !profileData) {
      return Response.json(
        { error: 'Your profile could not be loaded. Please go to your profile and save your details.' },
        { status: 400 },
      );
    }

    const sellerName = cleanText(`${profileData?.first_name || ''} ${profileData?.last_name || ''}`, 120) || 'Seller';
    const contactPhone = cleanPhone(`${profileData?.phone_code || ''} ${profileData?.phone_number || ''}`);
    const sellerMemberSince = profileData.created_at || user.created_at;

    const { data: listingData, error: listingError } = await supabaseAdmin
      .from('listings')
      .insert({
        user_id: user.id,
        title,
        animal_type: animalType,
        listing_type: listingType,
        breed,
        age,
        sex,
        county,
        city,
        seller_name: sellerName,
        seller_type: sellerType,
        price,
        price_negotiable: priceNegotiable,
        microchipped: microchipped || null,
        vaccinated,
        wormed,
        vet_checked: vetChecked,
        spayed_neutered: spayedNeutered,
        health_tested: healthTested,
        kennel_club_registered: kennelClubRegistered,
        litter_size: litterSize,
        available_litter_count: availableLitterCount,
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
      })
      .select()
      .single();

    if (listingError) {
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

    for (let i = 0; i < photos.length; i++) {
      const file = photos[i];
      const fileExt = IMAGE_EXTENSION_BY_TYPE[file.type];
      const randomPart = crypto.randomUUID();
      const fileName = `${user.id}/${listingData.id}-${i}-${Date.now()}-${randomPart}.${fileExt}`;

      const { error: uploadError } = await supabaseAdmin.storage.from('listing-photos').upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

      if (uploadError) {
        console.error('Server photo upload failed:', {
          message: uploadError.message,
          code: uploadError.code,
        });

        await removeUploadedStorageFiles(supabaseAdmin, uploadedPaths);
        await deleteListingRows(supabaseAdmin, listingData.id);

        return Response.json({ error: 'Photo upload failed. Your listing was not created.' }, { status: 500 });
      }

      uploadedPaths.push(fileName);

      const { data: publicUrlData } = supabaseAdmin.storage.from('listing-photos').getPublicUrl(fileName);

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

      await removeUploadedStorageFiles(supabaseAdmin, uploadedPaths);
      await deleteListingRows(supabaseAdmin, listingData.id);

      return Response.json(
        { error: 'Photo records could not be saved. Your listing was not created.' },
        { status: 500 },
      );
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
