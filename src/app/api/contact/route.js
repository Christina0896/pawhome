import { Resend } from 'resend';
import { getSupabaseAdminClient } from '../../../lib/supabaseAdmin';
import { requireSameOrigin } from '../../../lib/requireSameOrigin';
import { getRequestIp } from '../../../lib/apiHelpers';
import { escapeHtml } from '../../../lib/formatters';
import { getIpHash, isIpRateLimited } from '../../../lib/rateLimiter';

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_CLEANUP_MS = 24 * 60 * 60 * 1000;

export async function POST(request) {
  const sameOriginError = requireSameOrigin(request);

  if (sameOriginError) {
    return sameOriginError;
  }
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.CONTACT_FROM_EMAIL;
  const toEmail = process.env.CONTACT_TO_EMAIL;

  if (!resendApiKey || !fromEmail || !toEmail) {
    return Response.json({ error: 'Email service is not configured.' }, { status: 500 });
  }

  const supabaseAdmin = getSupabaseAdminClient();

  if (!supabaseAdmin) {
    return Response.json({ error: 'Contact form is temporarily unavailable.' }, { status: 500 });
  }

  const ipHash = getIpHash(getRequestIp(request), 'CONTACT_RATE_LIMIT_SECRET');

  if (!ipHash) {
    return Response.json({ error: 'Contact form is temporarily unavailable.' }, { status: 500 });
  }

  try {
    const limited = await isIpRateLimited({
      supabaseAdmin,
      tableName: 'contact_rate_limits',
      ipHash,
      maxHits: RATE_LIMIT_MAX_REQUESTS,
      windowMs: RATE_LIMIT_WINDOW_MS,
      cleanupMs: RATE_LIMIT_CLEANUP_MS,
    });

    if (limited) {
      return Response.json({ error: 'Too many messages. Please try again later.' }, { status: 429 });
    }
  } catch (error) {
    console.error('Contact rate limit error:', {
      message: error?.message,
      code: error?.code,
    });

    return Response.json({ error: 'Contact form is temporarily unavailable.' }, { status: 500 });
  }

  const resend = new Resend(resendApiKey);

  try {
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !subject || !message) {
      return Response.json({ error: 'All fields are required.' }, { status: 400 });
    }

    if (name.length > 120 || email.length > 180 || subject.length > 160 || message.length > 5000) {
      return Response.json({ error: 'Message is too long.' }, { status: 400 });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return Response.json({ error: 'Invalid email address.' }, { status: 400 });
    }

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(subject);
    const safeMessage = escapeHtml(message).replace(/\n/g, '<br />');

    const { error } = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      replyTo: email,
      subject: `PawHome: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>New PawHome Message</h2>

          <p><strong>Type:</strong> ${safeSubject}</p>
          <p><strong>Name:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>

          <hr />

          <p><strong>Message:</strong></p>
          <p>${safeMessage}</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', {
        message: error.message,
      });

      return Response.json({ error: 'Failed to send message.' }, { status: 500 });
    }

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Contact route error:', {
      message: error?.message,
    });

    return Response.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
