import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { verifyAdminSession } from '@/lib/admin-auth';
import WiseCheckoutAttempt from '@/models/WiseCheckoutAttempt';
import User from '@/models/User';

export async function GET(request: Request) {
  try {
    const session = await verifyAdminSession();
    if (!session.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)));
    const status = (searchParams.get('status') || 'all').trim();
    const since = (searchParams.get('since') || 'all').trim();

    const filter: Record<string, unknown> = {};
    if (status !== 'all' && ['pending', 'completed', 'cancelled'].includes(status)) {
      filter.status = status;
    }
    if (since !== 'all' && ['24h', '7d', '30d'].includes(since)) {
      const now = Date.now();
      const msMap: Record<string, number> = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
      };
      filter.createdAt = { $gte: new Date(now - msMap[since]) };
    }

    const total = await WiseCheckoutAttempt.countDocuments(filter);
    const attempts = await WiseCheckoutAttempt.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const userIds = attempts
      .map((attempt) => String(attempt.userId || ''))
      .filter((id) => id.length > 0);

    const users = userIds.length
      ? await User.find({ _id: { $in: userIds } }).select('name email').lean()
      : [];

    const userMap = new Map(
      users.map((user) => [String(user._id), { name: user.name || 'N/A', email: user.email || '' }])
    );

    return NextResponse.json({
      attempts: attempts.map((attempt) => {
        const user = userMap.get(String(attempt.userId));
        return {
          id: String(attempt._id),
          userId: String(attempt.userId),
          userName: user?.name || 'N/A',
          userEmail: user?.email || '',
          reference: attempt.reference,
          plan: attempt.plan,
          billingCycle: attempt.billingCycle,
          sku: attempt.sku,
          status: attempt.status,
          transferId: attempt.transferId ?? null,
          expiresAt: attempt.expiresAt || null,
          createdAt: attempt.createdAt,
          updatedAt: attempt.updatedAt,
        };
      }),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      filters: { status, since },
    });
  } catch (error) {
    console.error('Error fetching Wise checkout attempts:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch Wise checkout attempts',
        details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

