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

// ============================================
// Engagement email functions
// ============================================

const CTA_STYLE = 'padding: 12px 18px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;';

function engagementFooter(): string {
  return `
    <p style="margin-top:24px; font-size:12px; color:#6b7280;">
      You're receiving this because you signed up for Akowe. If you'd rather not hear from us, just reply and let us know.
    </p>
  `;
}

async function sendEngagementEmail(
  to: string,
  subject: string,
  text: string,
  html: string,
  tag: string
): Promise<{ messageId: string }> {
  if (!transporter) {
    throw new Error('Email transport not configured');
  }

  try {
    const info = await transporter.sendMail({
      from: defaultFrom,
      to,
      subject,
      text,
      html,
    });
    console.info(`[email] ${tag} sent`, { to, messageId: info.messageId });
    return { messageId: info.messageId };
  } catch (err) {
    console.error(`[email] ${tag} failed`, { to, error: err });
    throw err;
  }
}

/**
 * Ghost signup: signed up 2-3 days ago, zero projects.
 * Goal: get them to create their first project.
 */
export async function sendGhostSignupEmail(
  to: string,
  name: string
): Promise<{ messageId: string }> {
  const baseUrl = getBaseUrl();
  const ctaUrl = `${baseUrl}/dashboard/new`;
  const greeting = name || 'there';

  const subject = 'Quick question — what are you working on?';

  const text = [
    `Hi ${greeting},`,
    '',
    'It\'s Olamide from Akowe. You signed up a couple of days ago but haven\'t created a project yet.',
    '',
    'No pressure — I just wanted to check in. Most people start with whatever assignment is due next.',
    '',
    'It takes about 30 seconds:',
    '1. Pick your document type (essay, thesis, research paper)',
    '2. Enter a title',
    '3. Start writing with AI assistance',
    '',
    `Create your first project: ${ctaUrl}`,
    '',
    'What are you working on right now? Reply to this email — I read every one.',
    '',
    'Olamide',
    'Co-founder, Akowe',
  ].join('\n');

  const html = `
    <p>Hi ${greeting},</p>
    <p>It's Olamide from Akowe. You signed up a couple of days ago but haven't created a project yet.</p>
    <p>No pressure — I just wanted to check in. Most people start with whatever assignment is due next.</p>
    <p><strong>It takes about 30 seconds:</strong></p>
    <ol>
      <li>Pick your document type (essay, thesis, research paper)</li>
      <li>Enter a title</li>
      <li>Start writing with AI assistance</li>
    </ol>
    <p>
      <a href="${ctaUrl}" target="_blank" rel="noopener noreferrer" style="${CTA_STYLE}">
        Create your first project
      </a>
    </p>
    <p>What are you working on right now? Reply to this email — I read every one.</p>
    <p>Olamide<br/>Co-founder, Akowe</p>
    ${engagementFooter()}
  `;

  return sendEngagementEmail(to, subject, text, html, 'ghost_signup');
}

/**
 * Stuck starter: 3-5 days old, has a project but <100 words.
 * Goal: get them writing with the AI assistant.
 */
export async function sendStuckStarterEmail(
  to: string,
  name: string
): Promise<{ messageId: string }> {
  const baseUrl = getBaseUrl();
  const ctaUrl = `${baseUrl}/dashboard`;
  const greeting = name || 'there';

  const subject = 'The blank page is the hardest part';

  const text = [
    `Hi ${greeting},`,
    '',
    'It\'s Olamide from Akowe. I noticed you created a project — that\'s the hardest step done.',
    '',
    'The blank page is where most people get stuck. Here\'s a shortcut: use the AI writing assistant.',
    '',
    'Try this:',
    '- Open your project',
    '- Click into any section',
    '- Use the AI writer to generate a first draft for that section',
    '- Edit it in your own voice',
    '',
    'You don\'t need a perfect first draft. You need a starting point. The AI gives you that in seconds.',
    '',
    `Open your project: ${ctaUrl}`,
    '',
    'Olamide',
    'Co-founder, Akowe',
  ].join('\n');

  const html = `
    <p>Hi ${greeting},</p>
    <p>It's Olamide from Akowe. I noticed you created a project — that's the hardest step done.</p>
    <p>The blank page is where most people get stuck. Here's a shortcut: <strong>use the AI writing assistant.</strong></p>
    <p><strong>Try this:</strong></p>
    <ul>
      <li>Open your project</li>
      <li>Click into any section</li>
      <li>Use the AI writer to generate a first draft for that section</li>
      <li>Edit it in your own voice</li>
    </ul>
    <p>You don't need a perfect first draft. You need a starting point. The AI gives you that in seconds.</p>
    <p>
      <a href="${ctaUrl}" target="_blank" rel="noopener noreferrer" style="${CTA_STYLE}">
        Open your project
      </a>
    </p>
    <p>Olamide<br/>Co-founder, Akowe</p>
    ${engagementFooter()}
  `;

  return sendEngagementEmail(to, subject, text, html, 'stuck_starter');
}

/**
 * Almost activated: 5-10 days old, has AI usage but not fully activated.
 * Goal: show them features they haven't tried yet.
 */
export async function sendAlmostActivatedEmail(
  to: string,
  name: string
): Promise<{ messageId: string }> {
  const baseUrl = getBaseUrl();
  const ctaUrl = `${baseUrl}/dashboard`;
  const greeting = name || 'there';

  const subject = 'You\'re using Akowe — here\'s what you might be missing';

  const text = [
    `Hi ${greeting},`,
    '',
    'It\'s Olamide. You\'ve been writing with Akowe and I wanted to make sure you\'ve seen everything that can help.',
    '',
    'Three features most people don\'t try right away:',
    '',
    '1. Plagiarism checker — run a check before you submit. Catches issues your eyes miss.',
    '2. Auto-citations — add sources in APA, MLA, or IEEE with one click. No more formatting headaches.',
    '3. Literature review tool — find and summarize relevant papers for your topic.',
    '',
    'Each one saves real time on the parts of academic writing nobody enjoys.',
    '',
    `Try them out: ${ctaUrl}`,
    '',
    'Olamide',
    'Co-founder, Akowe',
  ].join('\n');

  const html = `
    <p>Hi ${greeting},</p>
    <p>It's Olamide. You've been writing with Akowe and I wanted to make sure you've seen everything that can help.</p>
    <p><strong>Three features most people don't try right away:</strong></p>
    <ol>
      <li><strong>Plagiarism checker</strong> — run a check before you submit. Catches issues your eyes miss.</li>
      <li><strong>Auto-citations</strong> — add sources in APA, MLA, or IEEE with one click. No more formatting headaches.</li>
      <li><strong>Literature review tool</strong> — find and summarize relevant papers for your topic.</li>
    </ol>
    <p>Each one saves real time on the parts of academic writing nobody enjoys.</p>
    <p>
      <a href="${ctaUrl}" target="_blank" rel="noopener noreferrer" style="${CTA_STYLE}">
        Try them out
      </a>
    </p>
    <p>Olamide<br/>Co-founder, Akowe</p>
    ${engagementFooter()}
  `;

  return sendEngagementEmail(to, subject, text, html, 'almost_activated');
}

/**
 * Going idle: last active 7-14 days ago, has projects.
 * Goal: bring them back to their work.
 */
export async function sendGoingIdleEmail(
  to: string,
  name: string
): Promise<{ messageId: string }> {
  const baseUrl = getBaseUrl();
  const ctaUrl = `${baseUrl}/dashboard`;
  const greeting = name || 'there';

  const subject = 'Your project is where you left it';

  const text = [
    `Hi ${greeting},`,
    '',
    'It\'s Olamide from Akowe. It\'s been about a week since you last logged in.',
    '',
    'Your project is exactly where you left it — nothing lost, nothing changed.',
    '',
    'If you hit a wall, that\'s normal. Here are two things that help:',
    '- Use the AI writer to push through a section you\'re stuck on',
    '- Break your next section into smaller pieces — even a few sentences count as progress',
    '',
    'Deadlines don\'t wait. A small session today beats a long one the night before.',
    '',
    `Pick up where you left off: ${ctaUrl}`,
    '',
    'Olamide',
    'Co-founder, Akowe',
  ].join('\n');

  const html = `
    <p>Hi ${greeting},</p>
    <p>It's Olamide from Akowe. It's been about a week since you last logged in.</p>
    <p>Your project is exactly where you left it — nothing lost, nothing changed.</p>
    <p><strong>If you hit a wall, that's normal. Here are two things that help:</strong></p>
    <ul>
      <li>Use the AI writer to push through a section you're stuck on</li>
      <li>Break your next section into smaller pieces — even a few sentences count as progress</li>
    </ul>
    <p>Deadlines don't wait. A small session today beats a long one the night before.</p>
    <p>
      <a href="${ctaUrl}" target="_blank" rel="noopener noreferrer" style="${CTA_STYLE}">
        Pick up where you left off
      </a>
    </p>
    <p>Olamide<br/>Co-founder, Akowe</p>
    ${engagementFooter()}
  `;

  return sendEngagementEmail(to, subject, text, html, 'going_idle');
}

/**
 * Win back: inactive 30+ days.
 * Goal: re-engage with what's new.
 */
export async function sendWinBackEmail(
  to: string,
  name: string
): Promise<{ messageId: string }> {
  const baseUrl = getBaseUrl();
  const ctaUrl = `${baseUrl}/dashboard`;
  const greeting = name || 'there';

  const subject = 'Akowe has gotten better since you left';

  const text = [
    `Hi ${greeting},`,
    '',
    'It\'s Olamide from Akowe. It\'s been a while and I wanted to let you know we\'ve been shipping.',
    '',
    'Since you last visited:',
    '- The AI writing assistant is faster and more accurate',
    '- Literature review tool finds and summarizes papers for any topic',
    '- Plagiarism checking catches more issues before you submit',
    '- The editor is smoother with better section management',
    '',
    'If you have a paper, thesis, or essay coming up, Akowe is built to get you through it.',
    '',
    `See what\'s new: ${ctaUrl}`,
    '',
    'Olamide',
    'Co-founder, Akowe',
  ].join('\n');

  const html = `
    <p>Hi ${greeting},</p>
    <p>It's Olamide from Akowe. It's been a while and I wanted to let you know we've been shipping.</p>
    <p><strong>Since you last visited:</strong></p>
    <ul>
      <li>The AI writing assistant is faster and more accurate</li>
      <li>Literature review tool finds and summarizes papers for any topic</li>
      <li>Plagiarism checking catches more issues before you submit</li>
      <li>The editor is smoother with better section management</li>
    </ul>
    <p>If you have a paper, thesis, or essay coming up, Akowe is built to get you through it.</p>
    <p>
      <a href="${ctaUrl}" target="_blank" rel="noopener noreferrer" style="${CTA_STYLE}">
        See what's new
      </a>
    </p>
    <p>Olamide<br/>Co-founder, Akowe</p>
    ${engagementFooter()}
  `;

  return sendEngagementEmail(to, subject, text, html, 'win_back');
}
