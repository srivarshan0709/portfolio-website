import nodemailer from 'nodemailer';

function buildTransport() {
  const hasSmtpConfig = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

  if (!hasSmtpConfig) {
    return nodemailer.createTransport({ jsonTransport: true });
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendContactMessage(request, response) {
  const name = String(request.body?.name || '').trim();
  const email = String(request.body?.email || '').trim();
  const message = String(request.body?.message || '').trim();

  if (!name || !email || !message) {
    return response.status(400).json({ ok: false, message: 'Name, email, and message are required.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return response.status(400).json({ ok: false, message: 'Please provide a valid email address.' });
  }

  try {
    const transporter = buildTransport();
    const previewTarget = process.env.CONTACT_TO_EMAIL || process.env.SMTP_USER || 'portfolio@localhost';

    const info = await transporter.sendMail({
      from: `Portfolio Contact <${previewTarget}>`,
      to: previewTarget,
      replyTo: email,
      subject: `New portfolio message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #e9eefc; background: #08101f; padding: 24px; border-radius: 18px;">
          <h2 style="margin-top: 0;">New portfolio message</h2>
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p style="white-space: pre-wrap; line-height: 1.6;">${escapeHtml(message)}</p>
        </div>
      `,
    });

    return response.json({
      ok: true,
      message: 'Message sent successfully.',
      transport: process.env.SMTP_HOST ? 'smtp' : 'json-demo',
      id: info?.messageId || null,
    });
  } catch (error) {
    return response.status(500).json({
      ok: false,
      message: 'Unable to send message right now.',
    });
  }
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
