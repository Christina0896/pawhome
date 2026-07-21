import { Resend } from 'resend';
import { escapeHtml } from './formatters';

const EVENT_SUBJECTS = {
  new_listing: 'New PawHome ad pending',
  listing_review: 'PawHome ad updated for review',
};

export async function queueListingNotification(supabaseAdmin, listingId, eventType = 'new_listing') {
  const { error } = await supabaseAdmin
    .from('listing_notification_outbox')
    .upsert(
      {
        listing_id: listingId,
        event_type: eventType,
        status: 'pending',
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'listing_id,event_type',
        ignoreDuplicates: true,
      },
    );

  return { error: error || null };
}

export async function sendListingNotification({ supabaseAdmin, listingId, eventType = 'new_listing' }) {
  const queued = await queueListingNotification(supabaseAdmin, listingId, eventType);
  if (queued.error) return { sent: false, error: queued.error };

  const { data: outbox, error: outboxError } = await supabaseAdmin
    .from('listing_notification_outbox')
    .select('id, status, attempts')
    .eq('listing_id', listingId)
    .eq('event_type', eventType)
    .maybeSingle();

  if (outboxError || !outbox) return { sent: false, error: outboxError || new Error('Notification outbox row missing.') };
  if (outbox.status === 'sent' || outbox.status === 'sending') return { sent: outbox.status === 'sent', error: null };

  const { data: claimed, error: claimError } = await supabaseAdmin
    .from('listing_notification_outbox')
    .update({
      status: 'sending',
      attempts: (outbox.attempts || 0) + 1,
      last_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', outbox.id)
    .in('status', ['pending', 'failed'])
    .select('id')
    .maybeSingle();

  if (claimError) return { sent: false, error: claimError };
  if (!claimed) return { sent: false, error: null };

  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.CONTACT_FROM_EMAIL;
  const toEmail = process.env.CONTACT_TO_EMAIL;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!resendApiKey || !fromEmail || !toEmail || !siteUrl) {
    const error = new Error('Notification service is not configured.');
    await supabaseAdmin
      .from('listing_notification_outbox')
      .update({ status: 'failed', last_error: error.message, updated_at: new Date().toISOString() })
      .eq('id', outbox.id);
    return { sent: false, error };
  }

  const { data: listing, error: listingError } = await supabaseAdmin
    .from('listings')
    .select('id, title, animal_type, breed, listing_type, county, city, price, seller_name, status, created_at')
    .eq('id', listingId)
    .maybeSingle();

  if (listingError || !listing) {
    const error = listingError || new Error('Listing not found.');
    await supabaseAdmin
      .from('listing_notification_outbox')
      .update({ status: 'failed', last_error: error.message, updated_at: new Date().toISOString() })
      .eq('id', outbox.id);
    return { sent: false, error };
  }

  const resend = new Resend(resendApiKey);
  const subjectPrefix = EVENT_SUBJECTS[eventType] || EVENT_SUBJECTS.new_listing;
  const adminUrl = `${siteUrl}/admin`;

  const { error: emailError } = await resend.emails.send({
    from: fromEmail,
    to: toEmail,
    subject: `${subjectPrefix}: ${listing.title || listing.breed || 'Listing'}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>${escapeHtml(subjectPrefix)}</h2>
        <p><strong>Title:</strong> ${escapeHtml(listing.title)}</p>
        <p><strong>Animal:</strong> ${escapeHtml(listing.animal_type)}</p>
        <p><strong>Breed:</strong> ${escapeHtml(listing.breed)}</p>
        <p><strong>Type:</strong> ${escapeHtml(listing.listing_type)}</p>
        <p><strong>County:</strong> ${escapeHtml(listing.county)}</p>
        <p><strong>City:</strong> ${escapeHtml(listing.city)}</p>
        <p><strong>Price:</strong> ${listing.price !== null && listing.price !== undefined ? `€${escapeHtml(listing.price)}` : '-'}</p>
        <p><strong>Seller:</strong> ${escapeHtml(listing.seller_name)}</p>
        <p><strong>Status:</strong> ${escapeHtml(listing.status)}</p>
        <hr />
        <p><a href="${escapeHtml(adminUrl)}">Open admin dashboard</a></p>
      </div>
    `,
  });

  if (emailError) {
    await supabaseAdmin
      .from('listing_notification_outbox')
      .update({
        status: 'failed',
        last_error: emailError?.message || 'Email delivery failed.',
        updated_at: new Date().toISOString(),
      })
      .eq('id', outbox.id);

    return { sent: false, error: emailError };
  }

  await supabaseAdmin
    .from('listing_notification_outbox')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      last_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', outbox.id);

  return { sent: true, error: null };
}
