import User from '@/models/User';
import Project from '@/models/Project';
import DailyUsage from '@/models/DailyUsage';
import mongoose from 'mongoose';

export interface InfluencerQualityMetrics {
  totalReferrals: number;
  activatedUsers: number;
  paidUsers: number;
  activationRate: number; // Percentage of referrals who created at least 1 project
  paidConversionRate: number; // Percentage of referrals who upgraded to paid
  avgActiveDays: number; // Average active days per referred user
  qualityScore: number; // Overall quality score (0-100)
  lastCalculated?: Date;
}

/**
 * Calculate quality metrics for an influencer
 * 
 * Quality Score Formula:
 * - Activation Rate: 40% weight (users who created at least 1 project)
 * - Paid Conversion Rate: 40% weight (users who upgraded to pro/team)
 * - Engagement: 20% weight (average active days per user, normalized to 0-100)
 * 
 * @param influencerId - The MongoDB ObjectId of the influencer
 * @returns Quality metrics including activation rate, paid conversion, and overall score
 */
export async function calculateInfluencerQuality(
  influencerId: mongoose.Types.ObjectId | string
): Promise<InfluencerQualityMetrics> {
  const influencerObjectId = typeof influencerId === 'string' 
    ? new mongoose.Types.ObjectId(influencerId)
    : influencerId;

  // Get all users referred by this influencer
  const referredUsers = await User.find({
    referredByInfluencer: influencerObjectId,
  }).lean();

  const totalReferrals = referredUsers.length;

  if (totalReferrals === 0) {
    return {
      totalReferrals: 0,
      activatedUsers: 0,
      paidUsers: 0,
      activationRate: 0,
      paidConversionRate: 0,
      avgActiveDays: 0,
      qualityScore: 0,
      lastCalculated: new Date(),
    };
  }

  const userIds = referredUsers.map((u) => u._id.toString());

  // Count activated users (users who created at least 1 project)
  const activatedUsers = await Project.countDocuments({
    userId: { $in: userIds },
  });

  // Count paid users (users on pro or team plan)
  const paidUsers = referredUsers.filter(
    (u) => u.plan === 'pro' || u.plan === 'team'
  ).length;

  // Calculate activation rate (users with projects / total referrals)
  // Note: Multiple projects by same user count as 1 activated user
  const uniqueActivatedUserIds = await Project.distinct('userId', {
    userId: { $in: userIds },
  });
  const activatedUsersCount = uniqueActivatedUserIds.length;
  const activationRate = totalReferrals > 0 
    ? (activatedUsersCount / totalReferrals) * 100 
    : 0;

  // Calculate paid conversion rate
  const paidConversionRate = totalReferrals > 0 
    ? (paidUsers / totalReferrals) * 100 
    : 0;

  // Calculate average active days per user
  const activeDaysData = await DailyUsage.aggregate([
    {
      $match: {
        userId: { $in: userIds },
      },
    },
    {
      $group: {
        _id: '$userId',
        activeDays: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: null,
        avgActiveDays: { $avg: '$activeDays' },
      },
    },
  ]);

  const avgActiveDays = activeDaysData[0]?.avgActiveDays || 0;

  // Normalize engagement score (0-100)
  // Assuming 30+ active days is excellent (100), 0 days is 0
  const engagementScore = Math.min((avgActiveDays / 30) * 100, 100);

  // Calculate overall quality score (weighted combination)
  // Activation: 40%, Paid Conversion: 40%, Engagement: 20%
  const qualityScore = 
    (activationRate * 0.4) + 
    (paidConversionRate * 0.4) + 
    (engagementScore * 0.2);

  return {
    totalReferrals,
    activatedUsers: activatedUsersCount, // Unique users who created at least 1 project
    paidUsers,
    activationRate: Math.round(activationRate * 100) / 100, // Round to 2 decimal places
    paidConversionRate: Math.round(paidConversionRate * 100) / 100,
    avgActiveDays: Math.round(avgActiveDays * 100) / 100,
    qualityScore: Math.round(qualityScore * 100) / 100,
    lastCalculated: new Date(),
  };
}

/**
 * Get quality score label based on score value
 */
export function getQualityScoreLabel(score: number): {
  label: string;
  color: string;
  level: 'excellent' | 'good' | 'fair' | 'poor';
} {
  if (score >= 70) {
    return { label: 'Excellent', color: 'green', level: 'excellent' };
  } else if (score >= 50) {
    return { label: 'Good', color: 'blue', level: 'good' };
  } else if (score >= 30) {
    return { label: 'Fair', color: 'yellow', level: 'fair' };
  } else {
    return { label: 'Poor', color: 'red', level: 'poor' };
  }
}
