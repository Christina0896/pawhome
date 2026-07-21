import { getSupabaseAdminClient } from '../../../lib/supabaseAdmin';
import { requireSameOrigin } from '../../../lib/requireSameOrigin';
import { getAuthenticatedUser } from '../../../lib/apiHelpers';
import { sendListingNotification } from '../../../lib/listingNotifications';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const sameOriginError = requireSameOrigin(request);
  if (sameOriginError) return sameOriginError;

  const supabaseAdmin = getSupabaseAdminClient();
  if (!supabaseAdmin) return Response.json({ error: 'Notification service is not configured.' }, { status: 500 });

  try {
    const { user, error: authError } = await getAuthenticatedUser(supabaseAdmin, request, 'Unauthorized.');
    if (authError) return authError;

    const { listingId } = await request.json();
    const numericListingId = Number(listingId);

    if (!Number.isInteger(numericListingId) || numericListingId < 1) {
      return Response.json({ error: 'Missing listing ID.' }, { status: 400 });
    }

    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select('id')
      .eq('id', numericListingId)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle();

    if (listingError || !listing) {
      return Response.json({ error: 'Listing not found or not pending review.' }, { status: 404 });
    }

    const result = await sendListingNotification({
      supabaseAdmin,
      listingId: numericListingId,
      eventType: 'listing_review',
    });

    if (result.error) {
      return Response.json({ error: 'Notification is queued for retry.' }, { status: 202 });
    }

    return Response.json({ success: true, sent: result.sent }, { status: 200 });
  } catch (error) {
    console.error('Listing review notification route error:', { message: error?.message });
    return Response.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
