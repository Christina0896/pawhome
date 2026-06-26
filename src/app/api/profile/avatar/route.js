import { getSupabaseAdminClient } from '../../../../lib/supabaseAdmin';
import { getStoragePathFromPublicUrl } from '../../../lib/storagePaths';
import { requireSameOrigin } from '../../../../lib/requireSameOrigin';

export const dynamic = 'force-dynamic';

const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

const AVATAR_EXTENSION_BY_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

async function getAuthenticatedUser(request, supabaseAdmin) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();

  if (!token) {
    return {
      error: Response.json({ error: 'Not authenticated.' }, { status: 401 }),
    };
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return {
      error: Response.json({ error: 'Invalid session.' }, { status: 401 }),
    };
  }

  return { user };
}

async function getExistingProfile(supabaseAdmin, userId) {
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('user_id, avatar_url')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return profile;
}

async function deleteAvatarFile(supabaseAdmin, avatarUrl, userId) {
  const avatarPath = getStoragePathFromPublicUrl(avatarUrl, 'avatars');

  if (!avatarPath) return;

  if (!avatarPath.startsWith(`${userId}/`)) {
    console.warn('Skipped avatar delete because path does not belong to user:', avatarPath);
    return;
  }

  const { error } = await supabaseAdmin.storage.from('avatars').remove([avatarPath]);

  if (error) {
    console.error('Avatar storage delete error:', {
      message: error?.message,
      code: error?.code,
    });
  }
}

export async function POST(request) {
  const sameOriginError = requireSameOrigin(request);

  if (sameOriginError) {
    return sameOriginError;
  }

  const supabaseAdmin = getSupabaseAdminClient();

  if (!supabaseAdmin) {
    return Response.json({ error: 'Avatar service is not configured.' }, { status: 500 });
  }

  const auth = await getAuthenticatedUser(request, supabaseAdmin);

  if (auth.error) {
    return auth.error;
  }

  const { user } = auth;

  try {
    const formData = await request.formData();
    const file = formData.get('avatar');

    if (!file || typeof file === 'string') {
      return Response.json({ error: 'Missing avatar file.' }, { status: 400 });
    }

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      return Response.json({ error: 'Please upload a JPG, PNG, or WEBP image.' }, { status: 400 });
    }

    if (file.size > MAX_AVATAR_SIZE) {
      return Response.json({ error: 'Profile picture must be 2 MB or smaller.' }, { status: 400 });
    }

    const existingProfile = await getExistingProfile(supabaseAdmin, user.id);
    const previousAvatarUrl = existingProfile?.avatar_url || null;

    const fileExt = AVATAR_EXTENSION_BY_TYPE[file.type];
    const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabaseAdmin.storage.from('avatars').upload(fileName, file, {
      upsert: false,
      contentType: file.type,
    });

    if (uploadError) {
      console.error('Avatar upload error:', {
        message: uploadError?.message,
        code: uploadError?.code,
      });

      return Response.json({ error: 'Could not upload profile picture.' }, { status: 500 });
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from('avatars').getPublicUrl(fileName);
    const avatarUrl = publicUrlData.publicUrl;

    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          user_id: user.id,
          avatar_url: avatarUrl,
        },
        {
          onConflict: 'user_id',
        },
      )
      .select()
      .single();

    if (updateError) {
      console.error('Avatar profile update error:', {
        message: updateError?.message,
        code: updateError?.code,
      });

      await supabaseAdmin.storage.from('avatars').remove([fileName]);

      return Response.json({ error: 'Could not update profile picture.' }, { status: 500 });
    }

    if (previousAvatarUrl) {
      await deleteAvatarFile(supabaseAdmin, previousAvatarUrl, user.id);
    }

    return Response.json({ success: true, profile: updatedProfile }, { status: 200 });
  } catch (error) {
    console.error('Avatar POST route error:', {
      message: error?.message,
      code: error?.code,
    });

    return Response.json({ error: 'Could not update profile picture.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  const sameOriginError = requireSameOrigin(request);

  if (sameOriginError) {
    return sameOriginError;
  }
  const supabaseAdmin = getSupabaseAdminClient();

  if (!supabaseAdmin) {
    return Response.json({ error: 'Avatar service is not configured.' }, { status: 500 });
  }

  const auth = await getAuthenticatedUser(request, supabaseAdmin);

  if (auth.error) {
    return auth.error;
  }

  const { user } = auth;

  try {
    const existingProfile = await getExistingProfile(supabaseAdmin, user.id);
    const previousAvatarUrl = existingProfile?.avatar_url || null;

    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          user_id: user.id,
          avatar_url: null,
        },
        {
          onConflict: 'user_id',
        },
      )
      .select()
      .single();

    if (updateError) {
      console.error('Avatar remove profile update error:', {
        message: updateError?.message,
        code: updateError?.code,
      });

      return Response.json({ error: 'Could not remove profile picture.' }, { status: 500 });
    }

    if (previousAvatarUrl) {
      await deleteAvatarFile(supabaseAdmin, previousAvatarUrl, user.id);
    }

    return Response.json({ success: true, profile: updatedProfile }, { status: 200 });
  } catch (error) {
    console.error('Avatar DELETE route error:', {
      message: error?.message,
      code: error?.code,
    });

    return Response.json({ error: 'Could not remove profile picture.' }, { status: 500 });
  }
}
