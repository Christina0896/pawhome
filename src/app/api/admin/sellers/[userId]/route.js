import { requireAdmin } from '../../../../../lib/requireAdmin';
import { requireSameOrigin } from '../../../../../lib/requireSameOrigin';
import { getSellerTrustSnapshot, VERIFIED_SELLER_TYPES } from '../../../../../lib/sellerTrust';

const ALLOWED_STATUSES = ['unverified', 'verified', 'rejected'];

export async function PATCH(request, { params }) {
  const sameOriginError = requireSameOrigin(request);
  if (sameOriginError) return sameOriginError;

  const admin = await requireAdmin(request);
  if (admin.error) return admin.error;

  const { supabaseAdmin, user: adminUser } = admin;
  const { userId } = await params;

  if (!userId) return Response.json({ error: 'Missing seller ID.' }, { status: 400 });

  try {
    const { status, sellerType } = await request.json();
    const normalizedStatus = String(status || '').trim().toLowerCase();
    const normalizedType = String(sellerType || '').trim();

    if (!ALLOWED_STATUSES.includes(normalizedStatus)) {
      return Response.json({ error: 'Invalid seller verification status.' }, { status: 400 });
    }

    if (normalizedStatus === 'verified' && !VERIFIED_SELLER_TYPES.includes(normalizedType)) {
      return Response.json({ error: 'Select Registered Breeder or Shelter / Rescue.' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const profilePayload = {
      seller_verification_status: normalizedStatus,
      seller_verified_type: normalizedStatus === 'verified' ? normalizedType : null,
      seller_verified_at: normalizedStatus === 'verified' ? now : null,
      seller_verified_by: normalizedStatus === 'verified' ? adminUser.id : null,
    };

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update(profilePayload)
      .eq('user_id', userId)
      .select(
        'user_id, account_type, phone_verified, seller_verification_status, seller_verified_type, seller_verified_at',
      )
      .maybeSingle();

    if (profileError) {
      console.error('Admin seller verification update failed:', {
        message: profileError.message,
        code: profileError.code,
      });
      return Response.json({ error: 'Could not update seller verification.' }, { status: 500 });
    }

    if (!profile) return Response.json({ error: 'Seller profile not found.' }, { status: 404 });

    const trust = getSellerTrustSnapshot(profile);

    const { error: listingError } = await supabaseAdmin
      .from('listings')
      .update({
        seller_type: trust.sellerType,
        seller_verified: trust.sellerVerified,
        seller_verified_at: trust.sellerVerifiedAt,
      })
      .eq('user_id', userId);

    if (listingError) {
      console.error('Seller verification listing snapshot update failed:', {
        message: listingError.message,
        code: listingError.code,
      });
      return Response.json(
        { error: 'Seller verification was saved, but listing snapshots could not be updated.' },
        { status: 500 },
      );
    }

    return Response.json(
      {
        success: true,
        profile,
        sellerType: trust.sellerType,
        sellerVerified: trust.sellerVerified,
        sellerVerifiedAt: trust.sellerVerifiedAt,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Admin seller verification route error:', { message: error?.message });
    return Response.json({ error: 'Could not update seller verification.' }, { status: 500 });
  }
}
