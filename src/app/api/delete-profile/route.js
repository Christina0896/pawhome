import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

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
    console.error(`${label} delete error:`, error);
    throw error;
  }
}

export async function DELETE(request) {
  const supabaseAdmin = getSupabaseAdminClient();

  if (!supabaseAdmin) {
    return Response.json({ error: 'Server delete profile is not configured.' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return Response.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(token);

  if (userError || !user) {
    return Response.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const userId = user.id;

  try {
    const { data: userListings, error: listingsError } = await supabaseAdmin
      .from('listings')
      .select('id')
      .eq('user_id', userId);

    if (listingsError) throw listingsError;

    const listingIds = (userListings || []).map((listing) => listing.id);

    if (listingIds.length > 0) {
      const { data: photos, error: photosError } = await supabaseAdmin
        .from('listing_photos')
        .select('image_url')
        .in('listing_id', listingIds);

      if (photosError) throw photosError;

      const photoPaths = (photos || [])
        .map((photo) => getStoragePathFromPublicUrl(photo.image_url, 'listing-photos'))
        .filter(Boolean);

      if (photoPaths.length > 0) {
        const { error: storageError } = await supabaseAdmin.storage.from('listing-photos').remove(photoPaths);

        if (storageError) {
          console.error('Listing photo storage delete error:', storageError);
        }
      }

      await safeDelete(
        supabaseAdmin.from('favorites').delete().in('listing_id', listingIds),
        'favorites for user listings',
      );

      await safeDelete(
        supabaseAdmin.from('listing_reports').delete().in('listing_id', listingIds),
        'reports for user listings',
      );

      await safeDelete(
        supabaseAdmin.from('listing_photos').delete().in('listing_id', listingIds),
        'listing photos rows',
      );

      await safeDelete(supabaseAdmin.from('listings').delete().eq('user_id', userId), 'user listings');
    }

    await safeDelete(supabaseAdmin.from('favorites').delete().eq('user_id', userId), 'user favourites');

    await safeDelete(
      supabaseAdmin.from('listing_reports').delete().eq('reporter_user_id', userId),
      'reports made by user',
    );

    const avatarUrl = user.user_metadata?.avatar_url;

    if (avatarUrl) {
      const avatarPath = getStoragePathFromPublicUrl(avatarUrl, 'avatars');

      if (avatarPath) {
        const { error: avatarDeleteError } = await supabaseAdmin.storage.from('avatars').remove([avatarPath]);

        if (avatarDeleteError) {
          console.error('Avatar storage delete error:', avatarDeleteError);
        }
      }
    }

    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteUserError) throw deleteUserError;

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Delete profile route error:', error);

    return Response.json(
      {
        error: error.message || 'Profile could not be deleted.',
      },
      { status: 500 },
    );
  }
}
