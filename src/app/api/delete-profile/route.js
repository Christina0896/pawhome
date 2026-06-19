import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

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
  if (!supabaseUrl || !serviceRoleKey) {
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

      const storagePaths = (photos || [])
        .map((photo) => getStoragePathFromPublicUrl(photo.image_url, 'listing-images'))
        .filter(Boolean);

      if (storagePaths.length > 0) {
        const { error: storageError } = await supabaseAdmin.storage.from('listing-images').remove(storagePaths);

        if (storageError) {
          console.error('Storage delete error:', storageError);
        }
      }

      await safeDelete(supabaseAdmin.from('favorites').delete().in('listing_id', listingIds), 'listing favorites');

      await safeDelete(supabaseAdmin.from('listing_reports').delete().in('listing_id', listingIds), 'listing reports');

      await safeDelete(supabaseAdmin.from('listing_photos').delete().in('listing_id', listingIds), 'listing photos');

      await safeDelete(supabaseAdmin.from('listings').delete().eq('user_id', userId), 'listings');
    }

    await safeDelete(supabaseAdmin.from('favorites').delete().eq('user_id', userId), 'user favorites');

    await safeDelete(supabaseAdmin.from('listing_reports').delete().eq('reporter_id', userId), 'user reports');

    await safeDelete(supabaseAdmin.from('profiles').delete().eq('id', userId), 'profile');

    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteUserError) throw deleteUserError;

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Delete profile route error:', error);

    return Response.json({ error: 'Profile could not be deleted.' }, { status: 500 });
  }
}
