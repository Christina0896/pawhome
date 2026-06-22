import { Resend } from 'resend';

const contactRateLimit = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const maxRequests = 5;

  const current = contactRateLimit.get(ip) || [];
  const recent = current.filter((timestamp) => now - timestamp < windowMs);

  if (recent.length >= maxRequests) {
    contactRateLimit.set(ip, recent);
    return true;
  }

  recent.push(now);
  contactRateLimit.set(ip, recent);
  return false;
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export async function POST(request) {
  const resendApiKey = process.env.RESEND_API_KEY;

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';

  if (isRateLimited(ip)) {
    return Response.json({ error: 'Too many messages. Please try again later.' }, { status: 429 });
  }

  const fromEmail = process.env.CONTACT_FROM_EMAIL;

  const toEmail = process.env.CONTACT_TO_EMAIL;

  if (!resendApiKey || !fromEmail || !toEmail) {
    return Response.json({ error: 'Email service is not configured.' }, { status: 500 });
  }

  const resend = new Resend(resendApiKey);

  try {
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !subject || !message) {
      return Response.json({ error: 'All fields are required.' }, { status: 400 });
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
      console.error('Resend error:', error);

      return Response.json({ error: 'Failed to send message.' }, { status: 500 });
    }

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Contact route error:', error);

    return Response.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
