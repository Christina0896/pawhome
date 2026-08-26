import { Resend } from 'resend';
import { getSupabaseAdminClient } from '../../../lib/supabaseAdmin';
import { requireSameOrigin } from '../../../lib/requireSameOrigin';
import { escapeHtml } from '../../../lib/formatters';
import { getAuthenticatedUser } from '../../../lib/apiHelpers';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const sameOriginError = requireSameOrigin(request);

  if (sameOriginError) {
    return sameOriginError;
  }

  const supabaseAdmin = getSupabaseAdminClient();
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.CONTACT_FROM_EMAIL;
  const toEmail = process.env.CONTACT_TO_EMAIL;

  if (!supabaseAdmin || !resendApiKey || !fromEmail || !toEmail) {
    return Response.json({ error: 'Notification service is not configured.' }, { status: 500 });
  }

  try {
    const { user, error: authError } = await getAuthenticatedUser(supabaseAdmin, request, 'Unauthorized.');

    if (authError) {
      return authError;
    }

    const { listingId } = await request.json();

    if (!listingId) {
      return Response.json({ error: 'Missing listing ID.' }, { status: 400 });
    }

    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select(
        `
          id,
          title,
          animal_type,
          breed,
          listing_type,
          county,
          city,
          price,
          seller_name,
          status,
          created_at
        `,
      )
      .eq('id', listingId)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle();

    if (listingError || !listing) {
      return Response.json({ error: 'Listing not found.' }, { status: 404 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    if (!siteUrl) {
      return Response.json({ error: 'Site URL is not configured.' }, { status: 500 });
    }

    const adminUrl = `${siteUrl}/admin`;
    const resend = new Resend(resendApiKey);

    const { error: emailError } = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: `New PawHome ad pending: ${listing.title || listing.breed || 'New listing'}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>New ad submitted on PawHome</h2>

          <p><strong>Title:</strong> ${escapeHtml(listing.title)}</p>
          <p><strong>Animal:</strong> ${escapeHtml(listing.animal_type)}</p>
          <p><strong>Breed:</strong> ${escapeHtml(listing.breed)}</p>
          <p><strong>Type:</strong> ${escapeHtml(listing.listing_type)}</p>
          <p><strong>County:</strong> ${escapeHtml(listing.county)}</p>
          <p><strong>City:</strong> ${escapeHtml(listing.city)}</p>
          <p><strong>Price:</strong> ${listing.price ? `€${escapeHtml(listing.price)}` : '-'}</p>
          <p><strong>Seller:</strong> ${escapeHtml(listing.seller_name)}</p>

          <hr />

          <p>
            <a href="${adminUrl}">Open admin dashboard</a>
          </p>
        </div>
      `,
    });

    if (emailError) {
      console.error('New listing notification email failed:', {
        message: emailError?.message,
      });

      return Response.json({ error: 'Notification email could not be sent.' }, { status: 500 });
    }

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('New listing notification route error:', {
      message: error?.message,
    });

    return Response.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
