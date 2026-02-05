import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Influencer from '@/models/Influencer';
import mongoose from 'mongoose';
import { calculateInfluencerQuality } from '@/lib/influencer-quality';

export async function GET() {
  try {
    await connectDB();

    // Get all influencers with their referral counts and quality scores
    const influencers = await Influencer.find().sort({ createdAt: -1 }).lean();
    const influencersWithCounts = await Promise.all(
      influencers.map(async (influencer) => {
        const referralCount = await User.countDocuments({
          referredByInfluencer: influencer._id,
        });

        // Use cached quality score if available and recent (within 24 hours), otherwise calculate
        const shouldRecalculate = !influencer.qualityScoreLastCalculated ||
          (Date.now() - new Date(influencer.qualityScoreLastCalculated).getTime()) > 24 * 60 * 60 * 1000;

        let qualityMetrics;
        if (shouldRecalculate && referralCount > 0) {
          // Calculate fresh quality metrics
          qualityMetrics = await calculateInfluencerQuality(influencer._id!);
          
          // Update cached scores in database (fire-and-forget, don't block response)
          Influencer.findByIdAndUpdate(influencer._id, {
            qualityScore: qualityMetrics.qualityScore,
            activationRate: qualityMetrics.activationRate,
            paidConversionRate: qualityMetrics.paidConversionRate,
            avgActiveDays: qualityMetrics.avgActiveDays,
            qualityScoreLastCalculated: qualityMetrics.lastCalculated,
          }).catch(err => console.error('Error updating cached quality score:', err));
        } else {
          // Use cached values
          qualityMetrics = {
            totalReferrals: referralCount,
            activatedUsers: 0, // Not cached, would need separate query
            paidUsers: 0, // Not cached, would need separate query
            activationRate: influencer.activationRate ?? 0,
            paidConversionRate: influencer.paidConversionRate ?? 0,
            avgActiveDays: influencer.avgActiveDays ?? 0,
            qualityScore: influencer.qualityScore ?? 0,
            lastCalculated: influencer.qualityScoreLastCalculated ?? null,
          };
        }

        return {
          _id: influencer._id.toString(),
          name: influencer.name,
          email: influencer.email,
          referralCode: influencer.referralCode,
          notes: influencer.notes,
          referralCount,
          qualityScore: qualityMetrics.qualityScore,
          activationRate: qualityMetrics.activationRate,
          paidConversionRate: qualityMetrics.paidConversionRate,
          avgActiveDays: qualityMetrics.avgActiveDays,
          qualityScoreLastCalculated: qualityMetrics.lastCalculated,
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
    ], { maxTimeMS: 30000 }); // 30 second timeout

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

    interface PopulatedReferrer {
      _id: mongoose.Types.ObjectId | { toString(): string };
      name: string;
      email: string;
    }

    const formattedReferredUsers = referredUsers.map((user) => ({
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      plan: user.plan,
      createdAt: user.createdAt,
      referredBy: user.referredBy
        ? (() => {
            const ref = user.referredBy as unknown as PopulatedReferrer;
            return {
              type: 'user' as const,
              _id: ref._id.toString(),
              name: ref.name,
              email: ref.email,
            };
          })()
        : user.referredByInfluencer
        ? (() => {
            const ref = user.referredByInfluencer as unknown as PopulatedReferrer;
            return {
              type: 'influencer' as const,
              _id: ref._id.toString(),
              name: ref.name,
              email: ref.email,
            };
          })()
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
