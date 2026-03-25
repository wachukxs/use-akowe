import connectDB from '@/lib/mongodb';
import ShareLink from '@/models/ShareLink';
import Project from '@/models/Project';
import User from '@/models/User';
import nodemailer from 'nodemailer';

// Send a reminder to the advisor if:
// - advisorEmail is set
// - link is active (not expired, not revoked)
// - accessCount === 0 (never opened)
// - created at least REMIND_AFTER_DAYS days ago
// - reminder has not already been sent
const REMIND_AFTER_DAYS = 3;

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 8_000,
    socketTimeout: 10_000,
  });
}

function getBaseUrl() {
  const base =
    process.env.NEXTAUTH_URL ||
    process.env.APP_BASE_URL ||
    'https://useakowe.com';
  return base.startsWith('http') ? base : `https://${base}`;
}

export interface AdvisorReminderResult {
  sent: number;
  skipped: number;
  failed: number;
}

export async function sendAdvisorReminders(): Promise<AdvisorReminderResult> {
  await connectDB();

  const cutoff = new Date(Date.now() - REMIND_AFTER_DAYS * 24 * 60 * 60 * 1000);
  const now = new Date();

  // Find eligible share links
  const candidates = await ShareLink.find({
    advisorEmail: { $exists: true, $ne: '' },
    revokedAt: { $exists: false },
    expiresAt: { $gt: now },
    accessCount: 0,
    reminderSentAt: { $exists: false },
    createdAt: { $lte: cutoff },
  }).lean();

  if (candidates.length === 0) {
    return { sent: 0, skipped: 0, failed: 0 };
  }

  const transporter = getTransporter();
  if (!transporter) {
    console.warn('[advisor-reminder] SMTP not configured — skipping');
    return { sent: 0, skipped: candidates.length, failed: 0 };
  }

  const baseUrl = getBaseUrl();
  const defaultFrom =
    process.env.SMTP_FROM || process.env.EMAIL_FROM || 'no-reply@useakowe.com';

  let sent = 0;
  let failed = 0;

  for (const link of candidates) {
    try {
      // Get project name and student name for a personal email
      const [project, student] = await Promise.all([
        Project.findById(link.projectId).select('name').lean(),
        User.findOne({ email: link.userId }).select('name').lean(),
      ]);

      const projectName = project?.name || 'a project';
      const studentName = student?.name || 'a student';
      const shareUrl = `${baseUrl}/review/${link.token}`;
      const createdDaysAgo = Math.round(
        (Date.now() - new Date(link.createdAt).getTime()) / (24 * 60 * 60 * 1000)
      );

      await transporter.sendMail({
        from: defaultFrom,
        to: link.advisorEmail,
        subject: `Reminder: ${studentName} is waiting for your feedback on "${projectName}"`,
        text: [
          `Hi ${link.advisorName},`,
          '',
          `${studentName} shared their project "${projectName}" with you for review ${createdDaysAgo} days ago, but the link hasn't been opened yet.`,
          '',
          `If you still have time to review it, you can access it here:`,
          shareUrl,
          '',
          `No login required — just click the link and leave your comments directly on the document.`,
          '',
          "If you've already reviewed it through another channel, you can ignore this email.",
          '',
          '— The Akowe Team',
        ].join('\n'),
        html: `
          <p>Hi ${link.advisorName},</p>
          <p><strong>${studentName}</strong> shared their project &ldquo;<strong>${projectName}</strong>&rdquo; with you for review ${createdDaysAgo} days ago, but the link has not been opened yet.</p>
          <p>If you still have time to review it, you can access it here — no login required:</p>
          <p style="margin:16px 0;">
            <a href="${shareUrl}" style="display:inline-block;padding:12px 24px;background:#1d2939;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">
              Open Review
            </a>
          </p>
          <p style="color:#666;font-size:13px;">If you've already reviewed it through another channel, you can ignore this email.</p>
          <p style="color:#666;font-size:13px;">— The Akowe Team</p>
        `,
      });

      await ShareLink.updateOne(
        { _id: link._id },
        { $set: { reminderSentAt: new Date() } }
      );

      sent++;
      console.info('[advisor-reminder] Sent reminder', {
        advisor: link.advisorEmail,
        project: projectName,
      });
    } catch (err) {
      failed++;
      console.error('[advisor-reminder] Failed to send reminder', {
        linkId: link._id,
        advisor: link.advisorEmail,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { sent, skipped: 0, failed };
}
