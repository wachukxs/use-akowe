import nodemailer from 'nodemailer';
import { getUnsubscribeUrl } from '@/lib/email-suppression';

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

interface EmailSendResult {
  messageId: string;
}

function emailFooter(unsubscribeUrl: string): string {
  return `
  <p style="margin-top:32px; padding-top:16px; border-top:1px solid #e5e7eb; font-size:12px; color:#6b7280;">
    You're receiving this because you signed up for Akowe.
    <a href="${unsubscribeUrl}" style="color:#6b7280; text-decoration:underline;">Unsubscribe</a>
  </p>
`;
}

function emailFooterText(unsubscribeUrl: string): string {
  return `\n\n---\nYou're receiving this because you signed up for Akowe. Unsubscribe: ${unsubscribeUrl}`;
}

function unsubscribeHeaders(email: string): Record<string, string> {
  const url = getUnsubscribeUrl(email);
  return {
    'List-Unsubscribe': `<${url}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };
}

function ctaButton(url: string, label: string): string {
  return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="padding: 12px 18px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">${label}</a>`;
}

export async function sendWelcomeEmail(to: string, name: string) {
  if (!transporter) {
    console.warn('Skipping welcome email send - transporter not configured');
    return;
  }

  const baseUrl = getBaseUrl();
  const newProjectUrl = `${baseUrl}/dashboard`;

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
        Start your first project
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

// ============================================
// Payment failure email
// ============================================

export async function sendPaymentFailedEmail(
  to: string,
  name: string,
  graceDeadline: Date
): Promise<EmailSendResult> {
  if (!transporter) {
    throw new Error('Email transport not configured');
  }

  const baseUrl = getBaseUrl();
  const billingUrl = `${baseUrl}/settings`;
  const greeting = name || 'there';
  const deadlineStr = graceDeadline.toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const info = await transporter.sendMail({
    from: defaultFrom,
    to,
    subject: 'Action needed: Your Akowe payment failed',
    text: [
      `Hi ${greeting},`,
      '',
      'We were unable to process your latest Akowe Pro payment. Your Pro features will remain active until ' + deadlineStr + ', giving you time to update your payment method.',
      '',
      'After that date, your account will be downgraded to the Free plan. You won\'t lose any of your projects or data, but Pro features like unlimited AI words and plagiarism checks will be restricted.',
      '',
      `Update your payment method: ${billingUrl}`,
      '',
      'If you believe this is an error, please check with your bank or reply to this email.',
    ].join('\n'),
    html: `
      <p>Hi ${greeting},</p>
      <p>We were unable to process your latest <strong>Akowe Pro</strong> payment. Your Pro features will remain active until <strong>${deadlineStr}</strong>, giving you time to update your payment method.</p>
      <p>After that date, your account will be downgraded to the Free plan. You won't lose any of your projects or data, but Pro features like unlimited AI words and plagiarism checks will be restricted.</p>
      <p style="margin:16px 0;">${ctaButton(billingUrl, 'Update payment method')}</p>
      <p style="font-size:13px;color:#6b7280;">If you believe this is an error, please check with your bank or reply to this email.</p>
    `,
  });

  console.info('[email] Payment failed email sent', { to, messageId: info.messageId });
  return { messageId: info.messageId };
}

// ============================================
// Engagement email functions (daily cron)
// ============================================

export async function sendGhostSignupEmail(to: string, name: string): Promise<EmailSendResult> {
  if (!transporter) {
    throw new Error('Email transport not configured');
  }

  const baseUrl = getBaseUrl();
  const dashboardUrl = `${baseUrl}/dashboard`;
  const greeting = name || 'there';
  const unsubUrl = getUnsubscribeUrl(to);

  const info = await transporter.sendMail({
    from: defaultFrom,
    to,
    subject: 'What are you working on?',
    headers: unsubscribeHeaders(to),
    text: [
      `Hi ${greeting},`,
      '',
      'It\'s Olamide from Akowe. You signed up a couple of days ago but haven\'t started a project yet. That\'s totally fine — maybe you haven\'t had the right assignment yet.',
      '',
      'When you do, Akowe is ready. Creating a project takes about 30 seconds, and you\'ll have an organized workspace for your essay, thesis, or research paper.',
      '',
      `Create your first project: ${dashboardUrl}`,
      '',
      'What assignment are you most stressed about right now? Start it inside Akowe today.',
      emailFooterText(unsubUrl),
    ].join('\n'),
    html: `
      <p>Hi ${greeting},</p>
      <p>It's Olamide from Akowe. You signed up a couple of days ago but haven't started a project yet. That's totally fine — maybe you haven't had the right assignment yet.</p>
      <p>When you do, Akowe is ready. Creating a project takes about 30 seconds, and you'll have an organized workspace for your essay, thesis, or research paper.</p>
      <p style="margin:16px 0;">${ctaButton(dashboardUrl, 'Create your first project')}</p>
      <p>What assignment are you most stressed about right now? Start it inside Akowe today.</p>
      ${emailFooter(unsubUrl)}
    `,
  });

  console.info('[email] Ghost signup email sent', { to, messageId: info.messageId });
  return { messageId: info.messageId };
}

export async function sendStuckStarterEmail(to: string, name: string): Promise<EmailSendResult> {
  if (!transporter) {
    throw new Error('Email transport not configured');
  }

  const baseUrl = getBaseUrl();
  const dashboardUrl = `${baseUrl}/dashboard`;
  const greeting = name || 'there';
  const unsubUrl = getUnsubscribeUrl(to);

  const info = await transporter.sendMail({
    from: defaultFrom,
    to,
    subject: 'Your project is waiting for you',
    headers: unsubscribeHeaders(to),
    text: [
      `Hi ${greeting},`,
      '',
      'You started a project on Akowe — nice first step. But it looks like you haven\'t written much yet.',
      '',
      'The hardest part of academic writing is the blank page. Here\'s a trick: use the AI writing tools to generate a first draft of any section. You can always edit it, but having something on the page makes everything easier.',
      '',
      `Continue writing: ${dashboardUrl}`,
      emailFooterText(unsubUrl),
    ].join('\n'),
    html: `
      <p>Hi ${greeting},</p>
      <p>You started a project on Akowe — nice first step. But it looks like you haven't written much yet.</p>
      <p>The hardest part of academic writing is the blank page. Here's a trick: use the <strong>AI writing tools</strong> to generate a first draft of any section. You can always edit it, but having something on the page makes everything easier.</p>
      <p style="margin:16px 0;">${ctaButton(dashboardUrl, 'Continue writing')}</p>
      ${emailFooter(unsubUrl)}
    `,
  });

  console.info('[email] Stuck starter email sent', { to, messageId: info.messageId });
  return { messageId: info.messageId };
}

export async function sendAlmostActivatedEmail(to: string, name: string): Promise<EmailSendResult> {
  if (!transporter) {
    throw new Error('Email transport not configured');
  }

  const baseUrl = getBaseUrl();
  const dashboardUrl = `${baseUrl}/dashboard`;
  const greeting = name || 'there';
  const unsubUrl = getUnsubscribeUrl(to);

  const info = await transporter.sendMail({
    from: defaultFrom,
    to,
    subject: "You're almost there — keep going",
    headers: unsubscribeHeaders(to),
    text: [
      `Hi ${greeting},`,
      '',
      'You\'ve been using Akowe\'s AI tools, which means you\'ve found the right workflow. You\'re close to having a solid draft.',
      '',
      'Keep going — most users who reach this point end up finishing their project. The next step: fill in any empty sections, or use the AI rewrite tool to improve what you\'ve already written.',
      '',
      `Keep writing: ${dashboardUrl}`,
      emailFooterText(unsubUrl),
    ].join('\n'),
    html: `
      <p>Hi ${greeting},</p>
      <p>You've been using Akowe's AI tools, which means you've found the right workflow. You're close to having a solid draft.</p>
      <p>Keep going — most users who reach this point end up finishing their project. The next step: fill in any empty sections, or use the <strong>AI rewrite tool</strong> to improve what you've already written.</p>
      <p style="margin:16px 0;">${ctaButton(dashboardUrl, 'Keep writing')}</p>
      ${emailFooter(unsubUrl)}
    `,
  });

  console.info('[email] Almost activated email sent', { to, messageId: info.messageId });
  return { messageId: info.messageId };
}

export async function sendGoingIdleEmail(to: string, name: string): Promise<EmailSendResult> {
  if (!transporter) {
    throw new Error('Email transport not configured');
  }

  const baseUrl = getBaseUrl();
  const dashboardUrl = `${baseUrl}/dashboard`;
  const greeting = name || 'there';
  const unsubUrl = getUnsubscribeUrl(to);

  const info = await transporter.sendMail({
    from: defaultFrom,
    to,
    subject: 'Your research is still here',
    headers: unsubscribeHeaders(to),
    text: [
      `Hi ${greeting},`,
      '',
      'It\'s been a little while since you opened Akowe. Your projects and all your work are exactly where you left them.',
      '',
      'If you have a new assignment or want to revisit an old one, everything is ready.',
      '',
      `Open your projects: ${dashboardUrl}`,
      emailFooterText(unsubUrl),
    ].join('\n'),
    html: `
      <p>Hi ${greeting},</p>
      <p>It's been a little while since you opened Akowe. Your projects and all your work are exactly where you left them.</p>
      <p>If you have a new assignment or want to revisit an old one, everything is ready.</p>
      <p style="margin:16px 0;">${ctaButton(dashboardUrl, 'Open your projects')}</p>
      ${emailFooter(unsubUrl)}
    `,
  });

  console.info('[email] Going idle email sent', { to, messageId: info.messageId });
  return { messageId: info.messageId };
}

export async function sendWinBackEmail(to: string, name: string): Promise<EmailSendResult> {
  if (!transporter) {
    throw new Error('Email transport not configured');
  }

  const baseUrl = getBaseUrl();
  const dashboardUrl = `${baseUrl}/dashboard`;
  const greeting = name || 'there';
  const unsubUrl = getUnsubscribeUrl(to);

  const info = await transporter.sendMail({
    from: defaultFrom,
    to,
    subject: "We've added new features since you left",
    headers: unsubscribeHeaders(to),
    text: [
      `Hi ${greeting},`,
      '',
      'It\'s been a while! We\'ve been busy building. Here\'s what\'s new:',
      '',
      '- AI Rewrite Tool: Highlight any text and improve it instantly.',
      '- Citation Discovery: Find relevant papers and add them in one click.',
      '- Plagiarism Checker: Scan your work before submitting.',
      '',
      'Your account and projects are still here, ready when you are.',
      '',
      `See what's new: ${dashboardUrl}`,
      emailFooterText(unsubUrl),
    ].join('\n'),
    html: `
      <p>Hi ${greeting},</p>
      <p>It's been a while! We've been busy building. Here's what's new:</p>
      <ul>
        <li><strong>AI Rewrite Tool</strong> — Highlight any text and improve it instantly.</li>
        <li><strong>Citation Discovery</strong> — Find relevant papers and add them in one click.</li>
        <li><strong>Plagiarism Checker</strong> — Scan your work before submitting.</li>
      </ul>
      <p>Your account and projects are still here, ready when you are.</p>
      <p style="margin:16px 0;">${ctaButton(dashboardUrl, "See what's new")}</p>
      ${emailFooter(unsubUrl)}
    `,
  });

  console.info('[email] Win-back email sent', { to, messageId: info.messageId });
  return { messageId: info.messageId };
}
