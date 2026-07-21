async function removeStorageFiles(supabaseAdmin, bucketName, paths = []) {
  const safePaths = [...new Set(paths || [])].filter(Boolean);
  if (safePaths.length === 0) return null;

  const { error } = await supabaseAdmin.storage.from(bucketName).remove(safePaths);
  return error || null;
}

export async function retryAccountDeletionJobs(supabaseAdmin, limit = 2) {
  const { data: jobs, error } = await supabaseAdmin
    .from('account_deletion_jobs')
    .select('id, user_id, listing_photo_paths, avatar_path')
    .in('status', ['pending', 'failed'])
    .order('created_at', { ascending: true })
    .limit(Math.max(Math.min(limit, 5), 1));

  if (error) return { attempted: 0, error };

  let attempted = 0;

  for (const job of jobs || []) {
    attempted += 1;
    const errors = [];

    const { error: dataError } = await supabaseAdmin.rpc('delete_user_owned_data', {
      p_user_id: job.user_id,
    });

    if (dataError) errors.push(`Database cleanup: ${dataError.message}`);

    const listingStorageError = await removeStorageFiles(
      supabaseAdmin,
      'listing-photos',
      job.listing_photo_paths || [],
    );

    if (listingStorageError) errors.push(`Listing storage: ${listingStorageError.message}`);

    if (job.avatar_path) {
      const avatarStorageError = await removeStorageFiles(supabaseAdmin, 'avatars', [job.avatar_path]);
      if (avatarStorageError) errors.push(`Avatar storage: ${avatarStorageError.message}`);
    }

    const completed = errors.length === 0;

    await supabaseAdmin
      .from('account_deletion_jobs')
      .update({
        status: completed ? 'completed' : 'failed',
        last_error: completed ? null : errors.join('; ').slice(0, 2000),
        completed_at: completed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', job.id);
  }

  return { attempted, error: null };
}
