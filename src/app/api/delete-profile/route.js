import { getSupabaseAdminClient } from '../../../lib/supabaseAdmin';
import { getStoragePathFromPublicUrl } from '../../../lib/storagePaths';
import { requireSameOrigin } from '../../../lib/requireSameOrigin';

export const dynamic = 'force-dynamic';

async function removeStorageFiles(supabaseAdmin, bucketName, paths = []) {
  const safePaths = [...new Set(paths)].filter(Boolean);

  if (safePaths.length === 0) return;

  const { error } = await supabaseAdmin.storage.from(bucketName).remove(safePaths);

  if (error) {
    console.error(`${bucketName} storage cleanup error:`, {
      message: error?.message,
      code: error?.code,
    });
  }
}

export async function DELETE(request) {
  const sameOriginError = requireSameOrigin(request);

  if (sameOriginError) {
    return sameOriginError;
  }

  const supabaseAdmin = getSupabaseAdminClient();

  if (!supabaseAdmin) {
    return Response.json({ error: 'Server delete profile is not configured.' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();

  if (!token) {
    return Response.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token);

  if (userError || !user) {
    return Response.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const userId = user.id;

  try {
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('avatar_url')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('Profile avatar lookup error:', {
        message: profileError?.message,
        code: profileError?.code,
      });

      return Response.json({ error: 'Profile could not be checked.' }, { status: 500 });
    }

    const { data: userListings, error: listingsError } = await supabaseAdmin
      .from('listings')
      .select('id')
      .eq('user_id', userId);

    if (listingsError) {
      console.error('User listings lookup error:', {
        message: listingsError?.message,
        code: listingsError?.code,
      });

      return Response.json({ error: 'Listings could not be checked.' }, { status: 500 });
    }

    const listingIds = (userListings || []).map((listing) => listing.id);

    let listingPhotoPaths = [];

    if (listingIds.length > 0) {
      const { data: photos, error: photosError } = await supabaseAdmin
        .from('listing_photos')
        .select('image_url')
        .in('listing_id', listingIds);

      if (photosError) {
        console.error('Listing photos lookup error:', {
          message: photosError?.message,
          code: photosError?.code,
        });

        return Response.json({ error: 'Listing photos could not be checked.' }, { status: 500 });
      }

      listingPhotoPaths = (photos || [])
        .map((photo) => getStoragePathFromPublicUrl(photo.image_url, 'listing-photos'))
        .filter(Boolean);
    }

    const avatarPath = getStoragePathFromPublicUrl(profile?.avatar_url, 'avatars');

    const { error: appDataDeleteError } = await supabaseAdmin.rpc('delete_user_owned_data', {
      p_user_id: userId,
    });

    if (appDataDeleteError) {
      console.error('User app data delete transaction failed:', {
        message: appDataDeleteError?.message,
        code: appDataDeleteError?.code,
        details: appDataDeleteError?.details,
      });

      return Response.json({ error: 'Profile data could not be deleted.' }, { status: 500 });
    }

    await removeStorageFiles(supabaseAdmin, 'listing-photos', listingPhotoPaths);

    if (avatarPath) {
      await removeStorageFiles(supabaseAdmin, 'avatars', [avatarPath]);
    }

    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      console.error('Auth user delete error:', {
        message: deleteUserError?.message,
        code: deleteUserError?.code,
      });

      return Response.json({ error: 'Account could not be deleted.' }, { status: 500 });
    }

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Delete profile route error:', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
    });

    return Response.json({ error: 'Profile could not be deleted.' }, { status: 500 });
  }
}
