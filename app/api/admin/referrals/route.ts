import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Influencer from '@/models/Influencer';
import { verifyAdminSession } from '@/lib/admin-auth';

export async function GET() {
  try {
    // Verify admin authentication
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get all influencers with their referral counts
    const influencers = await Influencer.find().sort({ createdAt: -1 }).lean();
    const influencersWithCounts = await Promise.all(
      influencers.map(async (influencer) => {
        const referralCount = await User.countDocuments({
          referredByInfluencer: influencer._id,
        });
        return {
          _id: influencer._id.toString(),
          name: influencer.name,
          email: influencer.email,
          referralCode: influencer.referralCode,
          notes: influencer.notes,
          referralCount,
          createdAt: influencer.createdAt,
        };
      })
    );

    // Get users who have made referrals (have referralCode and someone was referred by them)
    const usersWithReferrals = await User.aggregate([
      {
        $match: {
          referralCode: { $exists: true, $ne: null },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'referredBy',
          as: 'referredUsers',
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          referralCode: 1,
          plan: 1,
          referralCount: { $size: '$referredUsers' },
          createdAt: 1,
        },
      },
      {
        $match: {
          referralCount: { $gt: 0 },
        },
      },
      {
        $sort: { referralCount: -1 },
      },
    ]);

    // Get all referred users (users who signed up via referral)
    const referredUsers = await User.find({
      $or: [
        { referredBy: { $exists: true, $ne: null } },
        { referredByInfluencer: { $exists: true, $ne: null } },
      ],
    })
      .populate('referredBy', 'name email')
      .populate('referredByInfluencer', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const formattedReferredUsers = referredUsers.map((user) => ({
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      plan: user.plan,
      createdAt: user.createdAt,
      referredBy: user.referredBy
        ? {
            type: 'user' as const,
            _id: (user.referredBy as any)._id.toString(),
            name: (user.referredBy as any).name,
            email: (user.referredBy as any).email,
          }
        : user.referredByInfluencer
        ? {
            type: 'influencer' as const,
            _id: (user.referredByInfluencer as any)._id.toString(),
            name: (user.referredByInfluencer as any).name,
            email: (user.referredByInfluencer as any).email,
          }
        : null,
    }));

    // Calculate summary stats
    const totalReferrals = referredUsers.length;
    const totalInfluencers = influencers.length;
    const totalUserReferrers = usersWithReferrals.length;
    const referralsByInfluencers = referredUsers.filter(
      (u) => u.referredByInfluencer
    ).length;
    const referralsByUsers = referredUsers.filter((u) => u.referredBy).length;

    return NextResponse.json({
      stats: {
        totalReferrals,
        totalInfluencers,
        totalUserReferrers,
        referralsByInfluencers,
        referralsByUsers,
      },
      influencers: influencersWithCounts,
      userReferrers: usersWithReferrals.map((user) => ({
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        referralCode: user.referralCode,
        plan: user.plan,
        referralCount: user.referralCount,
        createdAt: user.createdAt,
      })),
      referredUsers: formattedReferredUsers,
    });
  } catch (error) {
    console.error('Error fetching referral data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referral data' },
      { status: 500 }
    );
  }
}
