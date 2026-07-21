import { getSupabaseAdminClient } from '../../../lib/supabaseAdmin';
import { getStoragePathFromPublicUrl } from '../../../lib/storagePaths';
import { requireSameOrigin } from '../../../lib/requireSameOrigin';

export const dynamic = 'force-dynamic';

async function removeStorageFiles(supabaseAdmin, bucketName, paths = []) {
  const safePaths = [...new Set(paths)].filter(Boolean);
  if (safePaths.length === 0) return null;

  const { error } = await supabaseAdmin.storage.from(bucketName).remove(safePaths);

  if (error) {
    console.error(`${bucketName} storage cleanup error:`, {
      message: error?.message,
      code: error?.code,
    });
  }

  return error || null;
}

export async function DELETE(request) {
  const sameOriginError = requireSameOrigin(request);
  if (sameOriginError) return sameOriginError;

  const supabaseAdmin = getSupabaseAdminClient();

  if (!supabaseAdmin) {
    return Response.json({ error: 'Server delete profile is not configured.' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();

  if (!token) return Response.json({ error: 'Unauthorized.' }, { status: 401 });

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token);

  if (userError || !user) return Response.json({ error: 'Unauthorized.' }, { status: 401 });

  const userId = user.id;

  try {
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('avatar_url')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError) {
      return Response.json({ error: 'Profile could not be checked.' }, { status: 500 });
    }

    const { data: userListings, error: listingsError } = await supabaseAdmin
      .from('listings')
      .select('id')
      .eq('user_id', userId);

    if (listingsError) {
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
        return Response.json({ error: 'Listing photos could not be checked.' }, { status: 500 });
      }

      listingPhotoPaths = (photos || [])
        .map((photo) => getStoragePathFromPublicUrl(photo.image_url, 'listing-photos'))
        .filter(Boolean);
    }

    const avatarPath = getStoragePathFromPublicUrl(profile?.avatar_url, 'avatars');

    const { data: cleanupJob, error: cleanupJobError } = await supabaseAdmin
      .from('account_deletion_jobs')
      .insert({
        user_id: userId,
        user_email: user.email || null,
        listing_photo_paths: [...new Set(listingPhotoPaths)],
        avatar_path: avatarPath || null,
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (cleanupJobError) {
      console.error('Account deletion job creation failed:', {
        message: cleanupJobError.message,
        code: cleanupJobError.code,
      });
      return Response.json(
        { error: 'Account deletion storage is not configured. Run the latest Supabase migration first.' },
        { status: 500 },
      );
    }

    // Remove every listing from public results before invalidating the account.
    const { error: hideListingsError } = await supabaseAdmin
      .from('listings')
      .update({ status: 'rejected', contact_phone: null })
      .eq('user_id', userId);

    if (hideListingsError) {
      await supabaseAdmin
        .from('account_deletion_jobs')
        .update({ status: 'failed', last_error: hideListingsError.message, updated_at: new Date().toISOString() })
        .eq('id', cleanupJob.id);

      return Response.json({ error: 'Listings could not be secured before deleting the account.' }, { status: 500 });
    }

    // Delete Auth first. A later cleanup problem can leave private/orphaned data,
    // but it can no longer leave a usable login whose application data vanished.
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      await supabaseAdmin
        .from('account_deletion_jobs')
        .update({ status: 'failed', last_error: deleteUserError.message, updated_at: new Date().toISOString() })
        .eq('id', cleanupJob.id);

      return Response.json({ error: 'Account could not be deleted.' }, { status: 500 });
    }

    const cleanupErrors = [];

    const { error: appDataDeleteError } = await supabaseAdmin.rpc('delete_user_owned_data', {
      p_user_id: userId,
    });

    if (appDataDeleteError) {
      cleanupErrors.push(`Database cleanup: ${appDataDeleteError.message}`);
      console.error('User app data delete transaction failed:', {
        message: appDataDeleteError?.message,
        code: appDataDeleteError?.code,
        details: appDataDeleteError?.details,
      });
    }

    const listingStorageError = await removeStorageFiles(supabaseAdmin, 'listing-photos', listingPhotoPaths);
    if (listingStorageError) cleanupErrors.push(`Listing storage: ${listingStorageError.message}`);

    if (avatarPath) {
      const avatarStorageError = await removeStorageFiles(supabaseAdmin, 'avatars', [avatarPath]);
      if (avatarStorageError) cleanupErrors.push(`Avatar storage: ${avatarStorageError.message}`);
    }

    const cleanupPending = cleanupErrors.length > 0;

    await supabaseAdmin
      .from('account_deletion_jobs')
      .update({
        status: cleanupPending ? 'failed' : 'completed',
        last_error: cleanupPending ? cleanupErrors.join('; ').slice(0, 2000) : null,
        completed_at: cleanupPending ? null : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', cleanupJob.id);

    return Response.json(
      {
        success: true,
        cleanupPending,
        message: cleanupPending
          ? 'Your login was deleted. Some private cleanup remains queued for PawHome.'
          : 'Your account and associated data were deleted.',
      },
      { status: cleanupPending ? 202 : 200 },
    );
  } catch (error) {
    console.error('Delete profile route error:', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
    });

    return Response.json({ error: 'Profile could not be deleted.' }, { status: 500 });
  }
}
