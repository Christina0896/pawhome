import { getSupabaseAdminClient } from '../../../../../lib/supabaseAdmin';
import { requireSameOrigin } from '../../../lib/requireSameOrigin';

export const dynamic = 'force-dynamic';

export async function DELETE(request, { params }) {
  const sameOriginError = requireSameOrigin(request);

  if (sameOriginError) {
    return sameOriginError;
  }
  const supabaseAdmin = getSupabaseAdminClient();

  if (!supabaseAdmin) {
    return Response.json({ error: 'Rollback service is not configured.' }, { status: 500 });
  }

  const { id: listingId } = await params;

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

  let uploadedPaths = [];

  try {
    const body = await request.json();
    uploadedPaths = Array.isArray(body.uploadedPaths) ? body.uploadedPaths : [];
  } catch {
    uploadedPaths = [];
  }

  const { data: listing, error: listingError } = await supabaseAdmin
    .from('listings')
    .select('id, user_id, status')
    .eq('id', listingId)
    .maybeSingle();

  if (listingError) {
    console.error('Rollback listing lookup failed:', {
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

  if (listing.status !== 'pending') {
    return Response.json({ error: 'Only pending listings can be rolled back.' }, { status: 400 });
  }

  const safeUploadedPaths = uploadedPaths.filter((path) => {
    if (typeof path !== 'string') return false;

    return path.startsWith(`${user.id}/`) && path.includes(`${listingId}-`);
  });

  if (safeUploadedPaths.length > 0) {
    const { error: storageError } = await supabaseAdmin.storage.from('listing-photos').remove(safeUploadedPaths);

    if (storageError) {
      console.error('Rollback storage cleanup failed:', {
        message: storageError.message,
        statusCode: storageError.statusCode,
      });
    }
  }

  const { error: photosDeleteError } = await supabaseAdmin.from('listing_photos').delete().eq('listing_id', listingId);

  if (photosDeleteError) {
    console.error('Rollback photo rows cleanup failed:', {
      message: photosDeleteError.message,
      code: photosDeleteError.code,
    });

    return Response.json({ error: 'Could not clean photo rows.' }, { status: 500 });
  }

  const { error: listingDeleteError } = await supabaseAdmin
    .from('listings')
    .delete()
    .eq('id', listingId)
    .eq('user_id', user.id)
    .eq('status', 'pending');

  if (listingDeleteError) {
    console.error('Rollback listing delete failed:', {
      message: listingDeleteError.message,
      code: listingDeleteError.code,
    });

    return Response.json({ error: 'Could not delete failed listing.' }, { status: 500 });
  }

  return Response.json({ success: true }, { status: 200 });
}
