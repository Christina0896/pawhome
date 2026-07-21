import { getAuthenticatedUser } from '../../../lib/apiHelpers';
import { isTrueFlag, normalizePhoneVerified } from '../../../lib/booleanFlags';
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

function cleanPhone(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeAccountType(value) {
  const accountType = cleanText(value);
  const lowerAccountType = accountType.toLowerCase();

  if (!accountType || lowerAccountType === 'buyer') return 'Buyer';

  if (
    lowerAccountType === 'private owner' ||
    lowerAccountType === 'private seller' ||
    lowerAccountType === 'owner' ||
    lowerAccountType === 'seller'
  ) {
    return 'Private Seller';
  }

  if (lowerAccountType === 'breeder') return 'Breeder';

  if (
    lowerAccountType === 'shelter / rescue' ||
    lowerAccountType === 'shelter' ||
    lowerAccountType === 'rescue'
  ) {
    return 'Shelter / Rescue';
  }

  return 'Buyer';
}

export async function PATCH(request) {
  const sameOriginError = requireSameOrigin(request);
  if (sameOriginError) return sameOriginError;

  const supabaseAdmin = getSupabaseAdminClient();

  if (!supabaseAdmin) {
    return Response.json({ error: 'Profile service is not configured.' }, { status: 500 });
  }

  const authResult = await getAuthenticatedUser(supabaseAdmin, request);
  if (authResult.error) return authResult.error;

  const { user } = authResult;

  try {
    const body = await request.json();

    const firstName = cleanText(body.first_name);
    const lastName = cleanText(body.last_name);
    const accountType = normalizeAccountType(body.account_type);
    let phoneCode = cleanText(body.phone_code) || '+353';
    let phoneNumber = cleanText(body.phone_number);
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

    if (phoneNumber && !/^[0-9\s()+-]+$/.test(phoneNumber)) {
      return Response.json({ error: 'Invalid phone number.' }, { status: 400 });
    }

    if (county.length > MAX_COUNTY_LENGTH) {
      return Response.json({ error: 'County is too long.' }, { status: 400 });
    }

    const { data: existingProfile, error: existingError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, phone_code, phone_number, phone_verified, verified_phone_e164')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingError) {
      console.error('Profile lookup failed:', {
        message: existingError.message,
        code: existingError.code,
      });

      return Response.json({ error: 'Could not check profile.' }, { status: 500 });
    }

    const existingPhoneVerified = isTrueFlag(existingProfile?.phone_verified);
    const phoneChanged =
      Boolean(existingProfile) &&
      (existingProfile.phone_code !== phoneCode || existingProfile.phone_number !== phoneNumber);

    // A verified number can only be replaced through a dedicated support/admin flow.
    if (existingPhoneVerified && phoneChanged) {
      phoneCode = existingProfile.phone_code || '+353';
      phoneNumber = existingProfile.phone_number || '';
    }

    const profilePayload = {
      user_id: user.id,
      first_name: firstName,
      last_name: lastName,
      account_type: accountType,
      phone_code: phoneCode,
      phone_number: phoneNumber,
      county,
    };

    // Merely saving a number does not reserve or verify it. Uniqueness is enforced
    // atomically only when the provider confirms possession of the number.
    if (!existingProfile || (!existingPhoneVerified && phoneChanged)) {
      profilePayload.phone_verified = false;
      profilePayload.verified_phone_e164 = null;
    }

    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'user_id' })
      .select()
      .single();

    if (updateError) {
      console.error('Profile update failed:', {
        message: updateError.message,
        code: updateError.code,
      });

      return Response.json({ error: 'Could not save profile.' }, { status: 500 });
    }

    const sellerName = cleanText(`${firstName} ${lastName}`) || 'Seller';
    const contactPhone = phoneNumber ? cleanPhone(`${phoneCode} ${phoneNumber}`) : '';

    // Trust-sensitive fields on approved listings are immutable from the profile.
    // Pending/rejected listings may receive ordinary contact/name corrections, but
    // seller_type and seller_verified remain admin-controlled snapshots.
    const { error: listingSyncError } = await supabaseAdmin
      .from('listings')
      .update({ seller_name: sellerName, contact_phone: contactPhone })
      .eq('user_id', user.id)
      .in('status', ['pending', 'rejected']);

    if (listingSyncError) {
      console.error('Listing seller sync failed:', {
        message: listingSyncError.message,
        code: listingSyncError.code,
      });
    }

    return Response.json({ success: true, profile: normalizePhoneVerified(updatedProfile) }, { status: 200 });
  } catch (error) {
    console.error('Profile route error:', { message: error?.message });
    return Response.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
