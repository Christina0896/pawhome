import { Resend } from 'resend';

export async function POST(request) {
  const resendApiKey = process.env.RESEND_API_KEY;
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

    const { error } = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      replyTo: email,
      subject: `PawHome: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>New PawHome Message</h2>

          <p><strong>Type:</strong> ${subject}</p>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>

          <hr />

          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, '<br />')}</p>
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
