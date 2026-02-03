import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import User from '@/models/User';
import DailyUsage from '@/models/DailyUsage';
import connectDB from '@/lib/mongodb';

/**
 * API endpoint to check if a user is eligible for ACTIVE37 discount
 * 
 * Eligibility criteria:
 * - User must be on free plan (not already paid)
 * - User must have activity in the last 7 days (based on DailyUsage)
 * - User must not have already dismissed the popup permanently
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only free plan users are eligible
    if (user.plan !== 'free') {
      return NextResponse.json({
        eligible: false,
        reason: 'not_free_plan',
      });
    }

    // Check if user has been active in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const startDateStr = sevenDaysAgo.toISOString().split('T')[0];
    const endDateStr = new Date().toISOString().split('T')[0];

    const recentActivity = await DailyUsage.findOne({
      userId: user._id.toString(),
      date: { $gte: startDateStr, $lte: endDateStr },
    });

    if (!recentActivity) {
      return NextResponse.json({
        eligible: false,
        reason: 'no_recent_activity',
      });
    }

    // Check total activity in last 7 days (at least 1 day with usage)
    const activityCount = await DailyUsage.countDocuments({
      userId: user._id.toString(),
      date: { $gte: startDateStr, $lte: endDateStr },
    });

    if (activityCount === 0) {
      return NextResponse.json({
        eligible: false,
        reason: 'insufficient_activity',
      });
    }

    // User is eligible
    return NextResponse.json({
      eligible: true,
      activeDays: activityCount,
      discountCode: 'ACTIVE37',
      discountPercent: 37,
    });
  } catch (error) {
    console.error('Error checking active discount eligibility:', error);
    return NextResponse.json(
      { error: 'Failed to check eligibility' },
      { status: 500 }
    );
  }
}
