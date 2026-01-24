// Period-specific metrics (respect date filter)

import { DateRange } from './types';
import User from '@/models/User';
import Project from '@/models/Project';
import DailyUsage from '@/models/DailyUsage';
import mongoose from 'mongoose';
import { metricsCache, getCacheKey, CACHE_TTL } from './cache';

export async function getPeriodUserMetrics(range: DateRange) {
  const cacheKey = getCacheKey('period:users', range.startStr, range.endStr);
  const cached = metricsCache.get<{ newInPeriod: number; newLast7Days: number; growth: Array<{ _id: string; count: number }> }>(cacheKey);
  if (cached) return cached;

  const newUsersInPeriod = await User.countDocuments({
    createdAt: { $gte: range.start, $lte: range.end }
  });

  // Last 7 days (always)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
  sevenDaysAgo.setUTCHours(0, 0, 0, 0);
  const newUsersLast7Days = await User.countDocuments({
    createdAt: { $gte: sevenDaysAgo }
  });

  // User growth over time (daily breakdown)
  const userGrowth = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: range.start, $lte: range.end }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  const result = {
    newInPeriod: newUsersInPeriod,
    newLast7Days: newUsersLast7Days,
    growth: userGrowth,
  };

  metricsCache.set(cacheKey, result, CACHE_TTL.periodPerformance);
  return result;
}

export async function getPeriodProjectMetrics(range: DateRange) {
  const createdInPeriod = await Project.countDocuments({
    createdAt: { $gte: range.start, $lte: range.end }
  });

  // Project growth over time (daily breakdown)
  const projectGrowth = await Project.aggregate([
    {
      $match: {
        createdAt: { $gte: range.start, $lte: range.end }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  return {
    createdInPeriod,
    growth: projectGrowth,
  };
}

export async function getPeriodUsageMetrics(range: DateRange) {
  const cacheKey = getCacheKey('period:usage', range.startStr, range.endStr);
  const cached = metricsCache.get<{
    aiWordsInPeriod: number;
    plagiarismChecksInPeriod: number;
    topUsersByUsage: Array<any>;
  }>(cacheKey);
  if (cached) return cached;

  // Use $facet to combine total usage, daily growth, and top users in one query
  const aggregationResult = await DailyUsage.aggregate([
    {
      $match: {
        date: { $gte: range.startStr, $lte: range.endStr }
      }
    },
    {
      $facet: {
        totalUsage: [
          {
            $group: {
              _id: null,
              totalAIWords: { $sum: '$aiWordsGenerated' },
              totalPlagiarismChecks: { $sum: '$plagiarismChecks' }
            }
          }
        ],
        dailyGrowth: [
          {
            $group: {
              _id: '$date',
              aiWords: { $sum: '$aiWordsGenerated' },
              plagiarismChecks: { $sum: '$plagiarismChecks' }
            }
          },
          {
            $sort: { _id: 1 }
          }
        ],
        topUsers: [
          {
            $group: {
              _id: '$userId',
              totalAIWords: { $sum: '$aiWordsGenerated' },
              totalPlagiarismChecks: { $sum: '$plagiarismChecks' }
            }
          },
          {
            $sort: { totalAIWords: -1 }
          },
          {
            $limit: 20
          }
        ]
      }
    }
  ], { maxTimeMS: 30000 }); // 30 second timeout

  const usage = aggregationResult[0]?.totalUsage[0] || { totalAIWords: 0, totalPlagiarismChecks: 0 };
  const dailyGrowth = aggregationResult[0]?.dailyGrowth || [];
  const topUsersAggregation = aggregationResult[0]?.topUsers || [];

  // Batch fetch user details (single query instead of N queries)
  const userIds = topUsersAggregation
    .map((u: { _id: string }) => u._id)
    .filter((id: string) => mongoose.Types.ObjectId.isValid(id))
    .map((id: string) => new mongoose.Types.ObjectId(id));
  
  const usersMap = new Map<string, any>();
  if (userIds.length > 0) {
    const users = await User.find({ _id: { $in: userIds } })
      .select('email name plan _id')
      .lean();
    
    users.forEach(user => {
      usersMap.set(user._id.toString(), user);
    });
  }

  const topUsersByUsage = topUsersAggregation.map((usage: { _id: string; totalAIWords: number; totalPlagiarismChecks: number }) => {
    const user = usersMap.get(usage._id) || null;
    return {
      userId: usage._id,
      email: user?.email || 'Unknown',
      name: user?.name || 'Unknown',
      plan: user?.plan || 'free',
      totalAIWords: usage.totalAIWords,
      totalPlagiarismChecks: usage.totalPlagiarismChecks,
    };
  });

  const result = {
    aiWordsInPeriod: usage.totalAIWords,
    plagiarismChecksInPeriod: usage.totalPlagiarismChecks,
    growth: dailyGrowth.map((day: { _id: string; aiWords: number; plagiarismChecks: number }) => ({
      _id: day._id,
      count: day.aiWords,
    })),
    topUsersByUsage,
  };

  metricsCache.set(cacheKey, result, CACHE_TTL.periodPerformance);
  return result;
}

export async function getPeriodEngagementMetrics(range: DateRange) {
  const cacheKey = getCacheKey('period:engagement', range.startStr, range.endStr);
  const cached = metricsCache.get<{
    activeUsers: number;
    avgActiveDays: number;
    powerUsers: number;
    consistentUsers: number;
  }>(cacheKey);
  if (cached) return cached;

  // Use $facet to combine distinct users and consistency metrics in one query
  const aggregationResult = await DailyUsage.aggregate([
    {
      $match: {
        date: { $gte: range.startStr, $lte: range.endStr }
      }
    },
    {
      $facet: {
        distinctUsers: [
          {
            $group: {
              _id: '$userId'
            }
          },
          {
            $count: 'count'
          }
        ],
        consistency: [
          {
            $group: {
              _id: '$userId',
              activeDays: { $sum: 1 },
              totalWords: { $sum: '$aiWordsGenerated' }
            }
          },
          {
            $group: {
              _id: null,
              avgActiveDays: { $avg: '$activeDays' },
              powerUsers: { $sum: { $cond: [{ $gte: ['$activeDays', 5] }, 1, 0] } },
              consistentUsers: { $sum: { $cond: [{ $gte: ['$activeDays', 3] }, 1, 0] } }
            }
          }
        ]
      }
    }
  ], { maxTimeMS: 30000 }); // 30 second timeout

  const activeUsersCount = aggregationResult[0]?.distinctUsers[0]?.count || 0;
  const usageConsistency = aggregationResult[0]?.consistency[0] || { avgActiveDays: 0, powerUsers: 0, consistentUsers: 0 };

  const result = {
    activeUsers: activeUsersCount,
    avgActiveDays: usageConsistency.avgActiveDays || 0,
    powerUsers: usageConsistency.powerUsers || 0,
    consistentUsers: usageConsistency.consistentUsers || 0,
  };

  metricsCache.set(cacheKey, result, CACHE_TTL.periodPerformance);
  return result;
}

