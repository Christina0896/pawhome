import { getSupabaseAdminClient } from '../../../lib/supabaseAdmin';
import { requireSameOrigin } from '../../../lib/requireSameOrigin';

export const dynamic = 'force-dynamic';

const ALLOWED_ACCOUNT_TYPES = ['Buyer', 'Private Seller', 'Breeder', 'Shelter / Rescue'];
const ALLOWED_PHONE_CODES = ['+353', '+44', '+49', '+351', '+33', '+34'];

const MAX_NAME_LENGTH = 80;
const MAX_PHONE_LENGTH = 30;
const MAX_COUNTY_LENGTH = 80;

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeAccountType(value) {
  const accountType = cleanText(value) || 'Buyer';

  if (accountType === 'Private Owner') {
    return 'Private Seller';
  }

  return accountType;
}

export async function PATCH(request) {
  const sameOriginError = requireSameOrigin(request);

  if (sameOriginError) {
    return sameOriginError;
  }
  const supabaseAdmin = getSupabaseAdminClient();

  if (!supabaseAdmin) {
    return Response.json({ error: 'Profile service is not configured.' }, { status: 500 });
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

  try {
    const body = await request.json();

    const firstName = cleanText(body.first_name);
    const lastName = cleanText(body.last_name);
    const accountType = normalizeAccountType(body.account_type);
    const phoneCode = cleanText(body.phone_code) || '+353';
    const phoneNumber = cleanText(body.phone_number);
    const county = cleanText(body.county);

    if (!firstName || !lastName) {
      return Response.json({ error: 'First name and last name are required.' }, { status: 400 });
    }

    if (firstName.length > MAX_NAME_LENGTH || lastName.length > MAX_NAME_LENGTH) {
      return Response.json({ error: 'Name is too long.' }, { status: 400 });
    }

    if (!ALLOWED_ACCOUNT_TYPES.includes(accountType)) {
      return Response.json({ error: 'Invalid account type.' }, { status: 400 });
    }

    if (!ALLOWED_PHONE_CODES.includes(phoneCode)) {
      return Response.json({ error: 'Invalid phone code.' }, { status: 400 });
    }

    if (phoneNumber.length > MAX_PHONE_LENGTH) {
      return Response.json({ error: 'Phone number is too long.' }, { status: 400 });
    }

    if (phoneNumber && !/^[0-9\s\-()+]+$/.test(phoneNumber)) {
      return Response.json({ error: 'Invalid phone number.' }, { status: 400 });
    }

    if (county.length > MAX_COUNTY_LENGTH) {
      return Response.json({ error: 'County is too long.' }, { status: 400 });
    }

    const { data: existingProfile, error: existingError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, phone_code, phone_number')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingError) {
      console.error('Profile lookup failed:', {
        message: existingError.message,
        code: existingError.code,
      });

      return Response.json({ error: 'Could not check profile.' }, { status: 500 });
    }

    const phoneChanged =
      existingProfile && (existingProfile.phone_code !== phoneCode || existingProfile.phone_number !== phoneNumber);

    const profilePayload = {
      user_id: user.id,
      first_name: firstName,
      last_name: lastName,
      account_type: accountType,
      phone_code: phoneCode,
      phone_number: phoneNumber,
      county,
    };

    if (!existingProfile || phoneChanged) {
      profilePayload.phone_verified = false;
    }

    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .upsert(profilePayload, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (updateError) {
      console.error('Profile update failed:', {
        message: updateError.message,
        code: updateError.code,
      });

      return Response.json({ error: 'Could not save profile.' }, { status: 500 });
    }

    return Response.json({ success: true, profile: updatedProfile }, { status: 200 });
  } catch (error) {
    console.error('Profile route error:', {
      message: error?.message,
    });

    return Response.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
