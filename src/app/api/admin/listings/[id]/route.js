import { requireAdmin } from '../../../../../lib/requireAdmin';

const ALLOWED_STATUSES = ['pending', 'approved', 'rejected'];

export async function PATCH(request, { params }) {
  const admin = await requireAdmin(request);

  if (admin.error) {
    return admin.error;
  }

  const { supabaseAdmin } = admin;
  const listingId = params.id;

  try {
    const { status } = await request.json();

    if (!ALLOWED_STATUSES.includes(status)) {
      return Response.json({ error: 'Invalid listing status.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('listings')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', listingId);

    if (error) {
      console.error('Admin listing status update error:', {
        message: error.message,
        code: error.code,
        details: error.details,
      });

      return Response.json({ error: 'Could not update listing.' }, { status: 500 });
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
  const listingId = params.id;

  try {
    const { data: photos, error: photosError } = await supabaseAdmin
      .from('listing_photos')
      .select('image_url')
      .eq('listing_id', listingId);

    if (photosError) {
      throw photosError;
    }

    const photoPaths = (photos || [])
      .map((photo) => {
        const marker = '/object/public/listing-photos/';
        const index = photo.image_url?.indexOf(marker);

        if (index === -1 || index === undefined) {
          return null;
        }

        return decodeURIComponent(photo.image_url.slice(index + marker.length).split('?')[0]);
      })
      .filter(Boolean);

    if (photoPaths.length > 0) {
      const { error: storageError } = await supabaseAdmin.storage.from('listing-photos').remove(photoPaths);

      if (storageError) {
        console.error('Admin listing storage delete error:', storageError);
      }
    }

    await supabaseAdmin.from('favorites').delete().eq('listing_id', listingId);

    await supabaseAdmin.from('listing_reports').delete().eq('listing_id', listingId);

    await supabaseAdmin.from('listing_photos').delete().eq('listing_id', listingId);

    const { error } = await supabaseAdmin.from('listings').delete().eq('id', listingId);

    if (error) {
      console.error('Admin listing delete error:', {
        message: error.message,
        code: error.code,
        details: error.details,
      });

      return Response.json({ error: 'Could not delete listing.' }, { status: 500 });
    }

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Admin listing DELETE route error:', {
      message: error?.message,
    });

    return Response.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
