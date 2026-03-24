import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sendWiseRenewalReminderEmail } from '@/lib/email';
import { isInWiseRenewalReminderWindow } from '@/lib/wise-billing';
import { downgradeWisePaidUserToFree } from '@/lib/wise-webhook-handlers';

/**
 * Daily job: Wise term expiry (downgrade to free) + email ~3 days before renewal.
 * Auth: `Authorization: Bearer $CRON_SECRET`
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('[cron] CRON_SECRET env var not configured');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const now = new Date();

  const expired = await User.find({
    paymentProvider: 'wise',
    plan: { $in: ['standard', 'pro'] },
    subscriptionEndDate: { $lte: now },
  });

  let downgraded = 0;
  for (const user of expired) {
    await downgradeWisePaidUserToFree(user);
    downgraded++;
    console.log(`[cron] Wise term expired — downgraded user ${user._id}`);
  }

  const reminderCandidates = await User.find({
    paymentProvider: 'wise',
    plan: { $in: ['standard', 'pro'] },
    subscriptionEndDate: { $gt: now },
    $or: [{ wiseRenewalReminderSentAt: null }, { wiseRenewalReminderSentAt: { $exists: false } }],
  });

  let remindersSent = 0;
  for (const user of reminderCandidates) {
    if (!user.subscriptionEndDate) continue;
    if (!isInWiseRenewalReminderWindow(user.subscriptionEndDate, now)) continue;
    try {
      await sendWiseRenewalReminderEmail(user.email, user.name, user.subscriptionEndDate);
      user.wiseRenewalReminderSentAt = new Date();
      await user.save();
      remindersSent++;
    } catch (e) {
      console.error('[cron] Wise renewal reminder failed', user._id, e);
    }
  }

  return NextResponse.json({
    success: true,
    downgraded,
    remindersSent,
  });
}
