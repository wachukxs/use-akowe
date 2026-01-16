import nodemailer from 'nodemailer';

type TransporterOrNull = ReturnType<typeof nodemailer.createTransport> | null;

function buildTransporter(): TransporterOrNull {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465; // 587 is for TLS, 465 is for SSL
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn('Email transport is not configured - missing SMTP credentials');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

const transporter = buildTransporter();
const defaultFrom = process.env.SMTP_FROM || process.env.EMAIL_FROM || 'no-reply@useakowe.come';

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
  expiresAt: Date
) {
  if (!transporter) {
    throw new Error('Email transport not configured');
  }

  const expiresAtLocal = expiresAt.toLocaleString();

  await transporter.sendMail({
    from: defaultFrom,
    to,
    subject: 'Reset your Akọ̀wé password',
    text: [
      'You requested to reset your Akọ̀wé password.',
      'If you did not make this request, you can ignore this email.',
      '',
      `Reset link (valid for 30 minutes): ${resetUrl}`,
      '',
      `Expires: ${expiresAtLocal}`,
    ].join('\n'),
    html: `
      <p>You requested to reset your Akọ̀wé password.</p>
      <p>If you did not make this request, you can ignore this email.</p>
      <p><a href="${resetUrl}" target="_blank" rel="noopener noreferrer" style="padding: 10px 16px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 6px; display: inline-block;">Reset password</a></p>
      <p>Or copy and paste this link into your browser:<br /><a href="${resetUrl}">${resetUrl}</a></p>
      <p>This link expires in 30 minutes (by ${expiresAtLocal}).</p>
    `,
  });
}
