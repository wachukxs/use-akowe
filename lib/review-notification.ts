import connectDB from '@/lib/mongodb';
import ShareLink from '@/models/ShareLink';
import ReviewComment from '@/models/ReviewComment';
import Project from '@/models/Project';
import User from '@/models/User';
import nodemailer from 'nodemailer';
import { getUnsubscribeUrl } from '@/lib/email-suppression';

const NOTIFICATION_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes

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
  });
}

function getBaseUrl() {
  const base =
    process.env.NEXTAUTH_URL ||
    process.env.APP_BASE_URL ||
    'https://useakowe.com';
  return base.startsWith('http') ? base : `https://${base}`;
}

/**
 * Notify the student that their advisor left comments.
 * Has a 15-minute cooldown per ShareLink to avoid spam.
 */
export async function maybeNotifyStudentOfComment(shareLinkId: string) {
  try {
    await connectDB();

    const shareLink = await ShareLink.findById(shareLinkId).lean();
    if (!shareLink) return;

    // Check cooldown
    if (
      shareLink.lastNotifiedAt &&
      Date.now() - new Date(shareLink.lastNotifiedAt).getTime() < NOTIFICATION_COOLDOWN_MS
    ) {
      return;
    }

    // Count recent comments since last notification
    const sinceDate = shareLink.lastNotifiedAt || shareLink.createdAt;
    const recentCount = await ReviewComment.countDocuments({
      shareLinkId: shareLink._id,
      authorType: 'advisor',
      createdAt: { $gt: sinceDate },
    });

    if (recentCount === 0) return;

    // Get project name
    const project = await Project.findById(shareLink.projectId)
      .select('name')
      .lean();
    const projectName = project?.name || 'your project';

    // Get student info
    const student = await User.findOne({ email: shareLink.userId })
      .select('name email')
      .lean();
    if (!student) return;

    const transporter = getTransporter();
    if (!transporter) {
      console.warn('[review-notification] Email transport not configured');
      return;
    }

    const baseUrl = getBaseUrl();
    const projectUrl = `${baseUrl}/project/${shareLink.projectId}?utm_source=email&utm_medium=transactional&utm_campaign=advisor_comment`;
    const greeting = student.name || 'there';
    const defaultFrom =
      process.env.SMTP_FROM || process.env.EMAIL_FROM || 'no-reply@useakowe.com';
    const unsubUrl = getUnsubscribeUrl(student.email);

    const commentWord = recentCount === 1 ? 'comment' : 'comments';

    await transporter.sendMail({
      from: defaultFrom,
      to: student.email,
      subject: `New feedback from ${shareLink.advisorName} on "${projectName}"`,
      headers: {
        'List-Unsubscribe': `<${unsubUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
      text: [
        `Hi ${greeting},`,
        '',
        `${shareLink.advisorName} left ${recentCount} new ${commentWord} on "${projectName}".`,
        '',
        `View and respond to their feedback: ${projectUrl}`,
        '',
        'Best,',
        'The Akowe Team',
        '',
        '---',
        `Unsubscribe: ${unsubUrl}`,
      ].join('\n'),
      html: `
        <p>Hi ${greeting},</p>
        <p><strong>${shareLink.advisorName}</strong> left ${recentCount} new ${commentWord} on "<strong>${projectName}</strong>".</p>
        <p>Open your project to view their feedback and respond.</p>
        <p style="margin:16px 0;">
          <a href="${projectUrl}" style="display:inline-block;padding:12px 24px;background:#1d2939;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">
            View Comments
          </a>
        </p>
        <p style="font-size:12px;color:#666;margin-top:32px;">
          <a href="${unsubUrl}" style="color:#666;">Unsubscribe</a>
        </p>
      `,
    });

    // Update cooldown timestamp
    await ShareLink.updateOne(
      { _id: shareLink._id },
      { $set: { lastNotifiedAt: new Date() } }
    );

    console.info('[review-notification] Sent', {
      to: student.email,
      advisor: shareLink.advisorName,
      comments: recentCount,
    });
  } catch (error) {
    console.error('[review-notification] Failed:', error);
  }
}
