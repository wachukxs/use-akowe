import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import DailyUsage from '@/models/DailyUsage';
import Project from '@/models/Project';
import EmailSuppression from '@/models/EmailSuppression';
import { format } from 'date-fns';

/**
 * GET /api/admin/user-lookup?email=...
 * Returns full support profile for a user: account details, today's usage,
 * project count, and email suppression status.
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email')?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'email query param is required' }, { status: 400 });
    }

    const user = await User.findOne({ email }, {
      name: 1, email: 1, plan: 1, billingCycle: 1,
      subscriptionStartDate: 1, subscriptionEndDate: 1,
      paymentGraceDeadline: 1, lastActiveAt: 1, createdAt: 1,
      stripeCustomerId: 1, stripeSubscriptionId: 1,
    }).lean();

    if (!user) {
      return NextResponse.json({ error: `No user found with email: ${email}` }, { status: 404 });
    }

    const userId = (user._id as { toString(): string }).toString();
    const today = format(new Date(), 'yyyy-MM-dd');

    const [todayUsage, projectCount, suppression] = await Promise.all([
      DailyUsage.findOne({ userId, date: today }).lean(),
      Project.countDocuments({ userId }),
      EmailSuppression.findOne({ email }).lean(),
    ]);

    return NextResponse.json({
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        plan: user.plan,
        billingCycle: user.billingCycle,
        subscriptionStartDate: user.subscriptionStartDate,
        subscriptionEndDate: user.subscriptionEndDate,
        paymentGraceDeadline: user.paymentGraceDeadline,
        lastActiveAt: user.lastActiveAt,
        createdAt: user.createdAt,
        stripeCustomerId: user.stripeCustomerId || null,
        stripeSubscriptionId: user.stripeSubscriptionId || null,
      },
      todayUsage: {
        date: today,
        aiWordsGenerated: todayUsage?.aiWordsGenerated ?? 0,
        plagiarismChecks: todayUsage?.plagiarismChecks ?? 0,
        paraphraseUses: todayUsage?.paraphraseUses ?? 0,
        topicFinderSearches: todayUsage?.topicFinderSearches ?? 0,
        litReviewAnalyses: todayUsage?.litReviewAnalyses ?? 0,
      },
      projectCount,
      suppression: suppression
        ? { suppressed: true, reason: suppression.reason, suppressedAt: suppression.suppressedAt }
        : { suppressed: false },
    });
  } catch (error) {
    console.error('Error looking up user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
