import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

const VALID_PLANS = ['free', 'standard', 'pro', 'team'] as const;
type PlanType = typeof VALID_PLANS[number];

/**
 * POST /api/admin/change-plan
 * Body: { email: string, plan: 'free' | 'standard' | 'pro' | 'team' }
 *
 * Manually overrides a user's plan. Useful when payment processed but plan
 * didn't update, or when comping a user for a bad experience.
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, plan } = body;

    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }
    if (!plan || !VALID_PLANS.includes(plan as PlanType)) {
      return NextResponse.json({ error: `plan must be one of: ${VALID_PLANS.join(', ')}` }, { status: 400 });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).lean();
    if (!user) {
      return NextResponse.json({ error: `No user found with email: ${email}` }, { status: 404 });
    }

    const previousPlan = user.plan;

    await User.updateOne(
      { email: email.trim().toLowerCase() },
      { $set: { plan: plan as PlanType } }
    );

    return NextResponse.json({
      success: true,
      email,
      previousPlan,
      newPlan: plan,
      message: `Changed ${email} from ${previousPlan} → ${plan}.`,
    });
  } catch (error) {
    console.error('Error changing plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
