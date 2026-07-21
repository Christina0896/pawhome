import { requireAdmin } from '../../../../../lib/requireAdmin';
import { isTrueFlag } from '../../../../../lib/booleanFlags';
import { formatPhoneForVerification } from '../../../../../lib/phoneVerification';
import { getSellerTrustSnapshot } from '../../../../../lib/sellerTrust';
import { getStoragePathFromPublicUrl } from '../../../../../lib/storagePaths';
import { requireSameOrigin } from '../../../../../lib/requireSameOrigin';

const ALLOWED_STATUSES = ['pending', 'approved', 'rejected'];

export async function PATCH(request, { params }) {
  const sameOriginError = requireSameOrigin(request);
  if (sameOriginError) return sameOriginError;

  const admin = await requireAdmin(request);
  if (admin.error) return admin.error;

  const { supabaseAdmin } = admin;
  const { id: rawListingId } = await params;
  const listingId = Number(rawListingId);

  if (!Number.isInteger(listingId) || listingId < 1) {
    return Response.json({ error: 'Missing listing ID.' }, { status: 400 });
  }

  try {
    const { status } = await request.json();

    if (!ALLOWED_STATUSES.includes(status)) {
      return Response.json({ error: 'Invalid listing status.' }, { status: 400 });
    }

    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select('id, user_id')
      .eq('id', listingId)
      .maybeSingle();

    if (listingError) {
      console.error('Admin listing lookup error:', {
        message: listingError.message,
        code: listingError.code,
      });
      return Response.json({ error: 'Could not check listing.' }, { status: 500 });
    }

    if (!listing) return Response.json({ error: 'Listing not found.' }, { status: 404 });

    const updatePayload = { status };

    if (status === 'approved') {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select(
          'phone_code, phone_number, phone_verified, verified_phone_e164, seller_verification_status, seller_verified_type, seller_verified_at',
        )
        .eq('user_id', listing.user_id)
        .maybeSingle();

      if (profileError || !profile) {
        return Response.json({ error: 'The seller profile could not be checked.' }, { status: 500 });
      }

      const currentPhone = formatPhoneForVerification(profile.phone_code, profile.phone_number);
      const phoneVerified =
        isTrueFlag(profile.phone_verified) &&
        Boolean(profile.verified_phone_e164) &&
        profile.verified_phone_e164 === currentPhone;

      if (!phoneVerified) {
        return Response.json(
          { error: 'This listing cannot be approved until the seller verifies the current phone number.' },
          { status: 409 },
        );
      }

      const sellerTrust = getSellerTrustSnapshot(profile);
      updatePayload.seller_type = sellerTrust.sellerType;
      updatePayload.seller_verified = sellerTrust.sellerVerified;
      updatePayload.seller_verified_at = sellerTrust.sellerVerifiedAt;
    }

    const { data: updatedListing, error } = await supabaseAdmin
      .from('listings')
      .update(updatePayload)
      .eq('id', listingId)
      .select('id, status, seller_type, seller_verified')
      .maybeSingle();

    if (error) {
      console.error('Admin listing status update error:', {
        message: error.message,
        code: error.code,
        details: error.details,
      });

      return Response.json({ error: 'Could not update listing.' }, { status: 500 });
    }

    if (!updatedListing) return Response.json({ error: 'Listing not found.' }, { status: 404 });

    return Response.json({ success: true, listing: updatedListing }, { status: 200 });
  } catch (error) {
    console.error('Admin listing PATCH route error:', { message: error?.message });
    return Response.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const sameOriginError = requireSameOrigin(request);
  if (sameOriginError) return sameOriginError;

  const admin = await requireAdmin(request);
  if (admin.error) return admin.error;

  const { supabaseAdmin } = admin;
  const { id: rawListingId } = await params;
  const listingId = Number(rawListingId);

  if (!Number.isInteger(listingId) || listingId < 1) {
    return Response.json({ error: 'Missing listing ID.' }, { status: 400 });
  }

  try {
    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select('id')
      .eq('id', listingId)
      .maybeSingle();

    if (listingError) {
      console.error('Admin listing lookup error:', {
        message: listingError.message,
        code: listingError.code,
        details: listingError.details,
      });
      return Response.json({ error: 'Could not check listing.' }, { status: 500 });
    }

    if (!listing) return Response.json({ error: 'Listing not found.' }, { status: 404 });

    const { data: photos, error: photosError } = await supabaseAdmin
      .from('listing_photos')
      .select('image_url')
      .eq('listing_id', listingId);

    if (photosError) {
      return Response.json({ error: 'Could not check listing photos.' }, { status: 500 });
    }

    const photoPaths = [
      ...new Set(
        (photos || []).map((photo) => getStoragePathFromPublicUrl(photo.image_url, 'listing-photos')).filter(Boolean),
      ),
    ];

    const { data: deleted, error: deleteError } = await supabaseAdmin.rpc('delete_listing_with_dependencies', {
      p_listing_id: listingId,
      p_owner_id: null,
    });

    if (deleteError) {
      console.error('Admin listing database delete error:', {
        message: deleteError.message,
        code: deleteError.code,
      });
      return Response.json({ error: 'Could not delete listing.' }, { status: 500 });
    }

    if (!deleted) return Response.json({ error: 'Listing not found.' }, { status: 404 });

    let cleanupWarning = '';

    if (photoPaths.length > 0) {
      const { error: storageError } = await supabaseAdmin.storage.from('listing-photos').remove(photoPaths);

      if (storageError) {
        console.error('Admin listing storage cleanup error:', {
          message: storageError?.message,
          code: storageError?.code,
        });
        cleanupWarning = 'The listing was deleted, but some storage files require cleanup.';
      }
    }

    return Response.json({ success: true, warning: cleanupWarning || undefined }, { status: 200 });
  } catch (error) {
    console.error('Admin listing DELETE route error:', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
    });

    return Response.json({ error: 'Could not delete listing.' }, { status: 500 });
  }
}
