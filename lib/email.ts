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

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    verify: () => {
      return new Promise((resolve, reject) => {
        transporter.verify((error, success) => {
          if (error) {
            reject(error);
          } else {
            resolve(success);
          }
        });
      });
    },
  });

  console.info('[email] Transporter created', {
    host,
    port,
    secure: port === 465,
    from: process.env.SMTP_FROM || process.env.EMAIL_FROM,
    verified: transporter.verify(),
  });

  return transporter;
}

const transporter = buildTransporter();
const defaultFrom = process.env.SMTP_FROM || process.env.EMAIL_FROM || 'no-reply@useakowe.come';

function getBaseUrl() {
  const base =
    process.env.NEXTAUTH_URL ||
    process.env.APP_BASE_URL ||
    process.env.VERCEL_URL ||
    'http://localhost:3000';
  return base.startsWith('http') ? base : `https://${base}`;
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
  expiresAt: Date
) {
  if (!transporter) {
    throw new Error('Email transport not configured');
  }

  const expiresAtLocal = expiresAt.toLocaleString();

  try {
    const info = await transporter.sendMail({
      from: defaultFrom,
      to,
      subject: 'Reset your Akowe password',
      text: [
        'You requested to reset your Akowe password.',
        'If you did not make this request, you can ignore this email.',
        '',
        `Reset link (valid for 30 minutes): ${resetUrl}`,
        '',
        `Expires: ${expiresAtLocal}`,
      ].join('\n'),
      html: `
        <p>You requested to reset your Akowe password.</p>
        <p>If you did not make this request, you can ignore this email.</p>
        <p><a href="${resetUrl}" target="_blank" rel="noopener noreferrer" style="padding: 10px 16px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 6px; display: inline-block;">Reset password</a></p>
        <p>Or copy and paste this link into your browser:<br /><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link expires in 30 minutes (by ${expiresAtLocal}).</p>
      `,
    });

    console.info('[email] Password reset sent', { to, messageId: info.messageId, response: info.response });
  } catch (err) {
    console.error('[email] Password reset failed', { to, error: err });
    throw err;
  }
}

export async function sendWelcomeEmail(to: string, name: string) {
  if (!transporter) {
    console.warn('Skipping welcome email send - transporter not configured');
    return;
  }

  const baseUrl = getBaseUrl();
  const newProjectUrl = `${baseUrl}/dashboard/new`;

  const subject = 'Welcome to Akowe — your first project awaits';

  const text = [
    `Hi ${name || 'there'}, Welcome to Akowe. My name is Olamide, a Co-founder at Akowe.`,
    '',
    'You chose a tool built for academic writing without juggling tools. This email is about one clear step: to help you create your first project.',
    '',
    'Why it matters:',
    '- Projects help you organize your work — essays, theses, research papers.',
    '- Sections break a big task into manageable pieces.',
    '- Templates stop setup overhead.',
    '- Word goals give focus and track progress.',
    '',
    'How to start:',
    '- Log into Akowe.',
    '- Click Create Project.',
    '- Choose your document type (Essay, Thesis, Research Paper).',
    '- Enter a title and select your citation style (APA, MLA, IEEE).',
    '',
    'Once you create your first project, the editor opens and you&rsquo;re ready to write.',
    '',
    `Action step: Start your first project now: ${newProjectUrl}`,
    '',
    'Think about this: What assignment are you most stressed about right now? Start it inside Akowe today.',
  ].join('\n');

  const html = `
    <p>Hi ${name || 'there'}, Welcome to <strong>Akowe</strong>. My name is Olamide, a Co-founder at Akowe.</p>
    <p>You chose a tool built for academic writing without juggling tools. This email is about one clear step: <strong>To help you create your first project.</strong></p>
    <h4 style="margin-bottom:8px;">Why it matters:</h4>
    <ul>
      <li>Projects help you organize your work — essays, theses, research papers.</li>
      <li>Sections break a big task into manageable pieces.</li>
      <li>Templates stop setup overhead.</li>
      <li>Word goals give focus and track progress.</li>
    </ul>
    <h4 style="margin-bottom:8px;">How to start:</h4>
    <ol>
      <li>Log into Akowe.</li>
      <li>Click Create Project.</li>
      <li>Choose your document type (Essay, Thesis, Research Paper).</li>
      <li>Enter a title and select your citation style (APA, MLA, IEEE).</li>
    </ol>
    <h4 style="margin-bottom:8px;">Your next win</h4>
    <p>Once you create your first project, the editor opens and you&rsquo;re ready to write.</p>
    <p style="margin:16px 0;">Action step</p>
    <p>
      <a href="${newProjectUrl}" target="_blank" rel="noopener noreferrer"
        style="padding: 12px 18px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
        Create a new project
      </a>
    </p>
    <p>Think about this: What assignment are you most stressed about right now? Start it inside Akowe today.</p>
  `;

  try {
    const info = await transporter.sendMail({
      from: defaultFrom,
      to,
      subject,
      text,
      html,
    });

    console.info('[email] Welcome email sent', { to, messageId: info.messageId, response: info.response });
  } catch (err) {
    console.error('[email] Welcome email failed', { to, error: err });
    throw err;
  }
}
