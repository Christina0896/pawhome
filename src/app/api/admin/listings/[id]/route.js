import { requireAdmin } from '../../../../../lib/requireAdmin';

const ALLOWED_STATUSES = ['pending', 'approved', 'rejected'];

function getStoragePathFromPublicUrl(url, bucketName) {
  if (!url) return null;

  const marker = `/object/public/${bucketName}/`;
  const index = url.indexOf(marker);

  if (index === -1) return null;

  return decodeURIComponent(url.slice(index + marker.length).split('?')[0]);
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

export async function PATCH(request, { params }) {
  const admin = await requireAdmin(request);

  if (admin.error) {
    return admin.error;
  }

  const { supabaseAdmin } = admin;
  const { id: listingId } = await params;

  if (!listingId) {
    return Response.json({ error: 'Missing listing ID.' }, { status: 400 });
  }

  try {
    const { status } = await request.json();

    if (!ALLOWED_STATUSES.includes(status)) {
      return Response.json({ error: 'Invalid listing status.' }, { status: 400 });
    }

    const { data: updatedListing, error } = await supabaseAdmin
      .from('listings')
      .update({
        status,
      })
      .eq('id', listingId)
      .select('id, status')
      .maybeSingle();

    if (error) {
      console.error('Admin listing status update error:', {
        message: error.message,
        code: error.code,
        details: error.details,
      });

      return Response.json({ error: 'Could not update listing.' }, { status: 500 });
    }

    if (!updatedListing) {
      return Response.json({ error: 'Listing not found.' }, { status: 404 });
    }

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Admin listing PATCH route error:', {
      message: error?.message,
    });

    return Response.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const admin = await requireAdmin(request);

  if (admin.error) {
    return admin.error;
  }

  const { supabaseAdmin } = admin;
  const { id: listingId } = await params;

  if (!listingId) {
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

    if (!listing) {
      return Response.json({ error: 'Listing not found.' }, { status: 404 });
    }

    const { data: photos, error: photosError } = await supabaseAdmin
      .from('listing_photos')
      .select('image_url')
      .eq('listing_id', listingId);

    if (photosError) {
      console.error('Admin listing photo lookup error:', {
        message: photosError.message,
        code: photosError.code,
        details: photosError.details,
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
        console.error('Admin listing storage delete error:', {
          message: storageError?.message,
          code: storageError?.code,
        });

        return Response.json({ error: 'Could not delete listing photos.' }, { status: 500 });
      }
    }

    await safeDelete(supabaseAdmin.from('favorites').delete().eq('listing_id', listingId), 'listing favourites');

    await safeDelete(supabaseAdmin.from('listing_reports').delete().eq('listing_id', listingId), 'listing reports');

    await safeDelete(supabaseAdmin.from('listing_photos').delete().eq('listing_id', listingId), 'listing photo rows');

    await safeDelete(supabaseAdmin.from('listings').delete().eq('id', listingId), 'listing');

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Admin listing DELETE route error:', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
    });

    return Response.json({ error: 'Could not delete listing.' }, { status: 500 });
  }
}
