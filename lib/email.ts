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
  const newProjectUrl = `${baseUrl}/dashboard?utm_source=email&utm_medium=transactional&utm_campaign=welcome`;

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
  const billingUrl = `${baseUrl}/settings?utm_source=email&utm_medium=transactional&utm_campaign=payment_failed`;
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
  const dashboardUrl = `${baseUrl}/dashboard?utm_source=email&utm_medium=engagement&utm_campaign=ghost_signup`;
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

export async function sendStuckStarterEmail(to: string, name: string, projectName?: string): Promise<EmailSendResult> {
  if (!transporter) {
    throw new Error('Email transport not configured');
  }

  const baseUrl = getBaseUrl();
  const dashboardUrl = `${baseUrl}/dashboard?utm_source=email&utm_medium=engagement&utm_campaign=stuck_starter`;
  const greeting = name || 'there';
  const unsubUrl = getUnsubscribeUrl(to);
  const projectRef = projectName ? `"${projectName}"` : 'your project';

  const info = await transporter.sendMail({
    from: defaultFrom,
    to,
    subject: `One paragraph. That's all it takes to unstick ${projectRef}.`,
    headers: unsubscribeHeaders(to),
    text: [
      `Hi ${greeting},`,
      '',
      `${projectRef} is sitting at almost zero words. That's the hardest place to be.`,
      '',
      `Here's the trick that works: open the AI assistant, type "write an opening paragraph for my introduction," and hit send. You'll have something on the page in 10 seconds. From there, editing is easy.`,
      '',
      `This one task takes 5 minutes. That's it.`,
      '',
      `Open ${projectRef}: ${dashboardUrl}`,
      emailFooterText(unsubUrl),
    ].join('\n'),
    html: `
      <p>Hi ${greeting},</p>
      <p>${projectRef} is sitting at almost zero words. That's the hardest place to be.</p>
      <p>Here's the trick that works: open the <strong>AI assistant</strong>, type <em>"write an opening paragraph for my introduction,"</em> and hit send. You'll have something on the page in 10 seconds. From there, editing is easy.</p>
      <p>This one task takes 5 minutes. That's it.</p>
      <p style="margin:16px 0;">${ctaButton(dashboardUrl, `Open ${projectRef}`)}</p>
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
  const dashboardUrl = `${baseUrl}/dashboard?utm_source=email&utm_medium=engagement&utm_campaign=almost_activated`;
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

export async function sendGoingIdleEmail(to: string, name: string, projectName?: string): Promise<EmailSendResult> {
  if (!transporter) {
    throw new Error('Email transport not configured');
  }

  const baseUrl = getBaseUrl();
  const dashboardUrl = `${baseUrl}/dashboard?utm_source=email&utm_medium=engagement&utm_campaign=going_idle`;
  const greeting = name || 'there';
  const unsubUrl = getUnsubscribeUrl(to);
  const projectRef = projectName ? `"${projectName}"` : 'your project';

  const info = await transporter.sendMail({
    from: defaultFrom,
    to,
    subject: projectName ? `Stuck on ${projectRef}? Let AI suggest 3 endings.` : 'Your draft is waiting — pick it up in 5 minutes',
    headers: unsubscribeHeaders(to),
    text: [
      `Hi ${greeting},`,
      '',
      `${projectRef} is still open in Akowe — your draft, your citations, everything exactly where you left it.`,
      '',
      `Here's a 5-minute task to move it forward: open the AI assistant and type "suggest 3 ways to end my conclusion." You'll have three options to choose from in seconds.`,
      '',
      `Even picking one and editing it gets you unstuck faster than starting from a blank page.`,
      '',
      `Continue ${projectRef}: ${dashboardUrl}`,
      emailFooterText(unsubUrl),
    ].join('\n'),
    html: `
      <p>Hi ${greeting},</p>
      <p>${projectRef} is still open in Akowe — your draft, your citations, everything exactly where you left it.</p>
      <p>Here's a 5-minute task to move it forward: open the <strong>AI assistant</strong> and type <em>"suggest 3 ways to end my conclusion."</em> You'll have three options to choose from in seconds.</p>
      <p>Even picking one and editing it gets you unstuck faster than starting from a blank page.</p>
      <p style="margin:16px 0;">${ctaButton(dashboardUrl, `Continue ${projectRef}`)}</p>
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
  const dashboardUrl = `${baseUrl}/dashboard?utm_source=email&utm_medium=engagement&utm_campaign=win_back`;
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

// ============================================
// Paid user feedback email
// ============================================

export async function sendFeedbackRequestEmail(to: string, name: string): Promise<EmailSendResult> {
  if (!transporter) {
    throw new Error('Email transport not configured');
  }

  const baseUrl = getBaseUrl();
  const dashboardUrl = `${baseUrl}/dashboard?utm_source=email&utm_medium=engagement&utm_campaign=paid_feedback`;
  const formUrl = 'https://forms.gle/f2jeLXbnXeu1PVJc7';
  const greeting = name || 'there';
  const unsubUrl = getUnsubscribeUrl(to);

  const info = await transporter.sendMail({
    from: defaultFrom,
    to,
    subject: "Quick question about your experience",
    headers: unsubscribeHeaders(to),
    text: [
      `Hi ${greeting},`,
      '',
      "It's Olamide from Akowe. You've been on a paid plan for a little while now, and I wanted to check in personally.",
      '',
      "Is it doing what you expected? Are there things you wished it did that it doesn't? Is there anything getting in your way?",
      '',
      "I read every response myself. It takes about 60 seconds, and it genuinely shapes what we build next.",
      '',
      `Share your feedback: ${formUrl}`,
      '',
      `Or if you'd rather just reply to this email directly, that works too.`,
      '',
      `Either way — thank you for trusting us with your work.`,
      '',
      '— Olamide',
      '',
      `P.S. Your dashboard is always here when you need it: ${dashboardUrl}`,
      emailFooterText(unsubUrl),
    ].join('\n'),
    html: `
      <p>Hi ${greeting},</p>
      <p>It's Olamide from Akowe. You've been on a paid plan for a little while now, and I wanted to check in personally.</p>
      <p>Is it doing what you expected? Are there things you wished it did that it doesn't? Is there anything getting in your way?</p>
      <p>I read every response myself. It takes about 60 seconds, and it genuinely shapes what we build next.</p>
      <p style="margin:20px 0;">${ctaButton(formUrl, 'Share your feedback')}</p>
      <p style="font-size:13px; color:#6b7280;">Or if you'd rather just reply to this email directly, that works too.</p>
      <p>Either way — thank you for trusting us with your work.</p>
      <p>— Olamide</p>
      <p style="font-size:13px; color:#6b7280;">P.S. Your dashboard is always here when you need it: <a href="${dashboardUrl}" style="color:#6b7280;">${dashboardUrl}</a></p>
      ${emailFooter(unsubUrl)}
    `,
  });

  console.info('[email] Feedback request email sent', { to, messageId: info.messageId });
  return { messageId: info.messageId };
}

// ============================================
// Affiliate application emails
// ============================================

export async function sendAffiliateApprovedEmail(
  to: string,
  name: string,
  referralCode: string
): Promise<void> {
  if (!transporter) {
    console.warn('[email] Skipping affiliate approved email - transporter not configured');
    return;
  }

  const baseUrl = getBaseUrl();
  const greeting = name || 'there';
  const referralLink = `${baseUrl}?ref=${referralCode}&utm_source=affiliate&utm_medium=referral&utm_campaign=affiliate`;
  const statsUrl = `${baseUrl}/affiliate-stats?utm_source=email&utm_medium=transactional&utm_campaign=affiliate_approved`;
  const payoutEmail = 'affiliate@placeholderllc.name.ng';

  const info = await transporter.sendMail({
    from: defaultFrom,
    to,
    subject: "You're approved — here's your Akowe affiliate code",
    text: [
      `Hi ${greeting},`,
      '',
      "Great news — your Akowe affiliate application has been approved. You're now set up as an affiliate partner.",
      '',
      `Your referral code: ${referralCode}`,
      '',
      `Your referral link: ${referralLink}`,
      '',
      'Anyone who signs up using your link will be attributed to you. Every time they pay for a subscription, you earn 30% — for their first 12 months or for as long as they stay subscribed, whichever is shorter.',
      '',
      'Tracking your stats:',
      `Visit ${statsUrl} and enter your referral code to see clicks, signups, and paid conversions at any time.`,
      '',
      'Getting paid:',
      `At the end of each month, email ${payoutEmail} with your referral code and your preferred payout method (PayPal, bank transfer, etc.). We verify your balance in our system and process payment within 5–7 business days.`,
      '',
      "Welcome aboard — let's build something great together.",
      '',
      '— The Akowe Team',
    ].join('\n'),
    html: `
      <p>Hi ${greeting},</p>
      <p>Great news — your Akowe affiliate application has been approved. You're now set up as an affiliate partner.</p>

      <table style="margin:24px 0; padding:20px 24px; background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; width:100%; max-width:480px; border-collapse:collapse;">
        <tr>
          <td style="padding:6px 0; font-size:13px; color:#6b7280; text-transform:uppercase; letter-spacing:0.08em;">Your referral code</td>
        </tr>
        <tr>
          <td style="padding:0 0 12px; font-size:22px; font-weight:700; font-family:monospace; color:#111827; letter-spacing:0.12em;">${referralCode}</td>
        </tr>
        <tr>
          <td style="padding:6px 0; font-size:13px; color:#6b7280; text-transform:uppercase; letter-spacing:0.08em;">Your referral link</td>
        </tr>
        <tr>
          <td style="padding:0; font-size:13px; font-family:monospace; word-break:break-all;">
            <a href="${referralLink}" style="color:#111827;">${referralLink}</a>
          </td>
        </tr>
      </table>

      <p>Anyone who signs up using your link will be attributed to you. Every time they pay for a subscription, you earn <strong>30%</strong> — for their first 12 months or for as long as they stay subscribed, whichever is shorter.</p>

      <h3 style="margin:24px 0 8px; font-size:15px;">Tracking your stats</h3>
      <p>Visit your stats page to see clicks, signups, and paid conversions at any time.</p>
      <p style="margin:12px 0;">${ctaButton(statsUrl, 'View your stats')}</p>

      <h3 style="margin:24px 0 8px; font-size:15px;">Getting paid</h3>
      <p>At the end of each month, email <a href="mailto:${payoutEmail}" style="color:#111827;">${payoutEmail}</a> with your referral code and your preferred payout method (PayPal, bank transfer, etc.). We verify your balance in our system and process payment within 5–7 business days.</p>

      <p style="margin-top:24px;">Welcome aboard — let's build something great together.</p>
      <p>— The Akowe Team</p>
    `,
  });

  console.info('[email] Affiliate approved email sent', { to, messageId: info.messageId });
}

export async function sendAffiliateDeniedEmail(
  to: string,
  name: string
): Promise<void> {
  if (!transporter) {
    console.warn('[email] Skipping affiliate denied email - transporter not configured');
    return;
  }

  const greeting = name || 'there';
  const payoutEmail = 'affiliate@placeholderllc.name.ng';

  const info = await transporter.sendMail({
    from: defaultFrom,
    to,
    subject: 'Your Akowe affiliate application',
    text: [
      `Hi ${greeting},`,
      '',
      'Thank you for applying to the Akowe affiliate program.',
      '',
      "After reviewing your application, we're not able to move forward at this time. This is usually because we're keeping the program small and selective while we're still early-stage.",
      '',
      "If you're already an Akowe user, you still have a personal referral link in your Settings page — you can use that to refer friends and earn commissions the same way.",
      '',
      `If you think this decision was made in error or you'd like to discuss further, feel free to reply to this email or reach us at ${payoutEmail}.`,
      '',
      '— The Akowe Team',
    ].join('\n'),
    html: `
      <p>Hi ${greeting},</p>
      <p>Thank you for applying to the Akowe affiliate program.</p>
      <p>After reviewing your application, we're not able to move forward at this time. This is usually because we're keeping the program small and selective while we're still early-stage.</p>
      <p>If you're already an Akowe user, you still have a personal referral link in your Settings page — you can use that to refer friends and earn commissions the same way.</p>
      <p>If you think this decision was made in error or you'd like to discuss further, feel free to reply to this email or reach us at <a href="mailto:${payoutEmail}" style="color:#111827;">${payoutEmail}</a>.</p>
      <p style="margin-top:24px;">— The Akowe Team</p>
    `,
  });

  console.info('[email] Affiliate denied email sent', { to, messageId: info.messageId });
}
