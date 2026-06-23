import { getSupabaseAdminClient } from '../../../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

const ALLOWED_REASONS = [
  'Scam or suspicious',
  'Animal welfare concern',
  'Wrong category',
  'Misleading information',
  'Duplicate listing',
  'Other',
];
const MAX_REPORT_DETAILS_LENGTH = 1000;

export async function POST(request, { params }) {
  const supabaseAdmin = getSupabaseAdminClient();

  if (!supabaseAdmin) {
    return Response.json({ error: 'Report service is not configured.' }, { status: 500 });
  }

  const { id } = await params;
  const listingId = Number(id);

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

  try {
    const { reason, details } = await request.json();

    const cleanDetails = typeof details === 'string' ? details.trim() : '';

    if (!reason) {
      return Response.json({ error: 'Please select a reason.' }, { status: 400 });
    }

    if (cleanDetails.length > MAX_REPORT_DETAILS_LENGTH) {
      return Response.json(
        { error: `Report details must be ${MAX_REPORT_DETAILS_LENGTH} characters or less.` },
        { status: 400 },
      );
    }

    if (!ALLOWED_REASONS.includes(reason)) {
      return Response.json({ error: 'Invalid report reason.' }, { status: 400 });
    }

    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select('id, status')
      .eq('id', listingId)
      .maybeSingle();

    if (listingError) {
      console.error('Report listing lookup failed:', {
        message: listingError.message,
        code: listingError.code,
      });

      return Response.json({ error: 'Could not check listing.' }, { status: 500 });
    }

    if (!listing || listing.status !== 'approved') {
      return Response.json({ error: 'Listing is not available.' }, { status: 404 });
    }

    const { data: existingReport, error: existingError } = await supabaseAdmin
      .from('listing_reports')
      .select('id')
      .eq('listing_id', listingId)
      .eq('reporter_user_id', user.id)
      .eq('status', 'open')
      .maybeSingle();

    if (existingError) {
      console.error('Existing report check failed:', {
        message: existingError.message,
        code: existingError.code,
      });

      return Response.json({ error: 'Could not check report.' }, { status: 500 });
    }

    if (existingReport) {
      return Response.json(
        {
          success: true,
          alreadyReported: true,
        },
        { status: 200 },
      );
    }

    const { error: insertError } = await supabaseAdmin.from('listing_reports').insert({
      listing_id: listingId,
      reporter_user_id: user.id,
      reason,
      details: cleanDetails,
      status: 'open',
    });

    if (insertError) {
      if (insertError.code === '23505') {
        return Response.json(
          {
            success: true,
            alreadyReported: true,
          },
          { status: 200 },
        );
      }

      console.error('Report insert failed:', {
        message: insertError.message,
        code: insertError.code,
      });

      return Response.json({ error: 'Could not submit report.' }, { status: 500 });
    }

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Report route error:', {
      message: error?.message,
    });

    return Response.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
