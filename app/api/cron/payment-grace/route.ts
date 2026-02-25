import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

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

  try {
    const now = new Date();

    // Find users whose grace period has expired and are still on a paying plan
    const expiredUsers = await User.find({
      paymentGraceDeadline: { $lte: now },
      plan: { $in: ['pro', 'team'] },
    });

    let downgraded = 0;

    for (const user of expiredUsers) {
      user.plan = 'free';
      user.paymentGraceDeadline = null;
      await user.save();
      downgraded++;
      console.log(`⬇️ Grace period expired — downgraded user ${user._id} to free plan`);
    }

    // Clean up stale grace deadlines (user already on free but deadline wasn't cleared)
    const staleCleanup = await User.updateMany(
      {
        paymentGraceDeadline: { $lte: now },
        plan: 'free',
      },
      { $set: { paymentGraceDeadline: null } }
    );

    console.info('[cron] Payment grace check complete', {
      downgraded,
      staleCleaned: staleCleanup.modifiedCount,
    });

    return NextResponse.json({
      success: true,
      downgraded,
      staleCleaned: staleCleanup.modifiedCount,
    });
  } catch (error) {
    console.error('[cron] Payment grace check failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
