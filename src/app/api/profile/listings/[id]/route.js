import { getSupabaseAdminClient } from '../../../../../lib/supabaseAdmin';
import { requireSameOrigin } from '../../../../../lib/requireSameOrigin';
import { getStoragePathFromPublicUrl } from '../../../../../lib/storagePaths';

export const dynamic = 'force-dynamic';



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

    if (photoPaths.length > 0) {
      const { error: storageError } = await supabaseAdmin.storage.from('listing-photos').remove(photoPaths);

      if (storageError) {
        console.error('Listing photo storage delete error:', {
          message: storageError?.message,
          code: storageError?.code,
        });

        return Response.json({ error: 'Could not delete listing photos.' }, { status: 500 });
      }
    }

    await safeDelete(supabaseAdmin.from('favorites').delete().eq('listing_id', listingId), 'listing favourites');

    await safeDelete(supabaseAdmin.from('listing_reports').delete().eq('listing_id', listingId), 'listing reports');

    await safeDelete(supabaseAdmin.from('listing_photos').delete().eq('listing_id', listingId), 'listing photo rows');

    await safeDelete(supabaseAdmin.from('listings').delete().eq('id', listingId).eq('user_id', user.id), 'listing');

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
