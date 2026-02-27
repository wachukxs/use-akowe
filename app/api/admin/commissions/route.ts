import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AffiliateCommission from '@/models/AffiliateCommission';
import User from '@/models/User';
import Influencer from '@/models/Influencer';

/**
 * GET /api/admin/commissions
 * Returns all affiliate commissions with referrer and referred user info, plus summary stats.
 *
 * PATCH /api/admin/commissions
 * Body: { id: string, status: 'paid' | 'cancelled' }
 * Marks a single commission record as paid or cancelled.
 */

export async function GET() {
  try {
    await connectDB();

    // Summary stats
    const statsAgg = await AffiliateCommission.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalCents: { $sum: '$commissionAmount' },
        },
      },
    ]);

    const stats = {
      pending: { count: 0, totalCents: 0 },
      paid: { count: 0, totalCents: 0 },
      cancelled: { count: 0, totalCents: 0 },
    };
    for (const row of statsAgg) {
      if (row._id === 'pending' || row._id === 'paid' || row._id === 'cancelled') {
        stats[row._id as keyof typeof stats] = { count: row.count, totalCents: row.totalCents };
      }
    }

    // All commissions, newest first
    const commissions = await AffiliateCommission.find()
      .sort({ createdAt: -1 })
      .lean();

    // Enrich with referrer names and referred user emails
    const enriched = await Promise.all(
      commissions.map(async (c) => {
        let referrerName: string | null = null;
        let referrerEmail: string | null = null;

        if (c.referrerType === 'user') {
          const referrer = await User.findById(c.referrerId).select('name email').lean();
          if (referrer) { referrerName = referrer.name; referrerEmail = referrer.email; }
        } else {
          const referrer = await Influencer.findById(c.referrerId).select('name email').lean();
          if (referrer) { referrerName = referrer.name; referrerEmail = referrer.email; }
        }

        const referredUser = await User.findById(c.referredUserId).select('name email plan').lean();

        return {
          _id: c._id.toString(),
          referralCode: c.referralCode,
          referrerType: c.referrerType,
          referrerName,
          referrerEmail,
          referredUserName: referredUser?.name ?? null,
          referredUserEmail: referredUser?.email ?? null,
          referredUserPlan: referredUser?.plan ?? null,
          billingCycle: c.billingCycle,
          commissionMonth: c.commissionMonth,
          billingReason: c.billingReason,
          paymentAmount: c.paymentAmount,
          commissionRate: c.commissionRate,
          commissionAmount: c.commissionAmount,
          status: c.status,
          paidAt: c.paidAt ?? null,
          createdAt: c.createdAt,
        };
      })
    );

    return NextResponse.json({
      stats: {
        pendingCount: stats.pending.count,
        pendingTotal: `$${(stats.pending.totalCents / 100).toFixed(2)}`,
        paidCount: stats.paid.count,
        paidTotal: `$${(stats.paid.totalCents / 100).toFixed(2)}`,
        cancelledCount: stats.cancelled.count,
        allTimeTotal: `$${((stats.pending.totalCents + stats.paid.totalCents) / 100).toFixed(2)}`,
      },
      commissions: enriched,
    });
  } catch (error) {
    console.error('Error fetching commissions:', error);
    return NextResponse.json({ error: 'Failed to fetch commissions' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { id, status } = body;

    if (!id || !['paid', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'id and status (paid|cancelled) are required' }, { status: 400 });
    }

    const update: Record<string, unknown> = { status };
    if (status === 'paid') {
      update.paidAt = new Date();
    }

    const commission = await AffiliateCommission.findByIdAndUpdate(id, update, { new: true });
    if (!commission) {
      return NextResponse.json({ error: 'Commission not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, commission });
  } catch (error) {
    console.error('Error updating commission:', error);
    return NextResponse.json({ error: 'Failed to update commission' }, { status: 500 });
  }
}
