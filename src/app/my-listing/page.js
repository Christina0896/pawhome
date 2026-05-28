const { data, error } = await supabase
  .from('listings')
  .select(
    `
    *,
    listing_photos (
      image_url,
      sort_order
    )
  `,
  )
  .eq('user_id', user.id)
  .order('created_at', { ascending: false });
console.log('Logged in user id:', user.id);
console.log('My listings:', data);
console.log('My listings error:', error);
