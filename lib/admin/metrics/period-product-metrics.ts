// Period-specific product metrics (respect date filter)

import { DateRange } from './types';
import Project from '@/models/Project';
import DailyUsage from '@/models/DailyUsage';
import ShareLink from '@/models/ShareLink';
import ReviewComment from '@/models/ReviewComment';
import { metricsCache, getCacheKey, CACHE_TTL } from './cache';

export async function getPeriodProductMetrics(range: DateRange) {
  const cacheKey = getCacheKey('period:product', range.startStr, range.endStr);
  const cached = metricsCache.get<{
    completionRate: number;
    avgProjectsPerUser: number;
    usersWithMultipleProjects: number;
    citationAdoption: number;
    pdfAdoption: number;
    plagiarismAdoption: number;
    litReviewAdoption: number;
    projects: { total: number; active: number; completed: number };
  }>(cacheKey);
  if (cached) return cached;

  // Use $facet to combine all aggregations in one query
  const aggregationResult = await Project.aggregate([
    {
      $match: {
        createdAt: { $gte: range.start, $lte: range.end }
      }
    },
    {
      $facet: {
        total: [{ $count: 'count' }],
        completed: [
          {
            $match: {
              status: 'completed',
              updatedAt: { $gte: range.start, $lte: range.end }
            }
          },
          { $count: 'count' }
        ],
        projectsPerUser: [
          {
            $group: {
              _id: '$userId',
              projectCount: { $sum: 1 }
            }
          },
          {
            $group: {
              _id: null,
              avgProjects: { $avg: '$projectCount' },
              usersWithMultiple: {
                $sum: { $cond: [{ $gt: ['$projectCount', 1] }, 1, 0] }
              }
            }
          }
        ],
        withCitations: [
          {
            $match: {
              citations: { $exists: true, $ne: [] }
            }
          },
          { $count: 'count' }
        ],
        withPDFs: [
          {
            $match: {
              pdfs: { $exists: true, $ne: [] }
            }
          },
          { $count: 'count' }
        ],
        withPlagiarismChecks: [
          {
            $match: {
              plagiarismChecks: { $exists: true, $ne: [] }
            }
          },
          { $count: 'count' }
        ]
      }
    }
  ], { maxTimeMS: 30000 }); // 30 second timeout

  const projectsInPeriod = aggregationResult[0]?.total[0]?.count || 0;
  const completedInPeriod = aggregationResult[0]?.completed[0]?.count || 0;
  const projectsPerUser = aggregationResult[0]?.projectsPerUser[0] || { avgProjects: 0, usersWithMultiple: 0 };
  const projectsWithCitations = aggregationResult[0]?.withCitations[0]?.count || 0;
  const projectsWithPDFs = aggregationResult[0]?.withPDFs[0]?.count || 0;
  const projectsWithPlagiarismChecks = aggregationResult[0]?.withPlagiarismChecks[0]?.count || 0;

  // Lit review adoption: count distinct users who used lit review in this period (from DailyUsage)
  const litReviewUsersAgg = await DailyUsage.aggregate([
    {
      $match: {
        date: { $gte: range.startStr, $lte: range.endStr },
        litReviewAnalyses: { $gt: 0 }
      }
    },
    {
      $group: {
        _id: '$userId'
      }
    },
    {
      $count: 'count'
    }
  ], { maxTimeMS: 30000 });
  const usersWithLitReview = litReviewUsersAgg[0]?.count || 0;

  // Total active users in period for lit review adoption calculation
  const activeUsersAgg = await DailyUsage.aggregate([
    {
      $match: {
        date: { $gte: range.startStr, $lte: range.endStr }
      }
    },
    {
      $group: {
        _id: '$userId'
      }
    },
    {
      $count: 'count'
    }
  ], { maxTimeMS: 30000 });
  const totalActiveUsers = activeUsersAgg[0]?.count || 0;

  // Completion rate for period (projects completed / projects created in period)
  const completionRate = projectsInPeriod > 0
    ? ((completedInPeriod / projectsInPeriod) * 100)
    : 0;

  const avgProjectsPerUser = projectsPerUser.avgProjects || 0;
  const usersWithMultipleProjects = projectsPerUser.usersWithMultiple || 0;
  
  const citationAdoption = projectsInPeriod > 0 
    ? ((projectsWithCitations / projectsInPeriod) * 100)
    : 0;
  const pdfAdoption = projectsInPeriod > 0
    ? ((projectsWithPDFs / projectsInPeriod) * 100)
    : 0;
  const plagiarismAdoption = projectsInPeriod > 0
    ? ((projectsWithPlagiarismChecks / projectsInPeriod) * 100)
    : 0;
  const litReviewAdoption = totalActiveUsers > 0
    ? ((usersWithLitReview / totalActiveUsers) * 100)
    : 0;

  const result = {
    completionRate,
    avgProjectsPerUser,
    usersWithMultipleProjects,
    citationAdoption,
    pdfAdoption,
    plagiarismAdoption,
    litReviewAdoption,
    projects: {
      total: projectsInPeriod,
      active: 0, // Would need to track active projects separately
      completed: completedInPeriod,
    },
  };

  metricsCache.set(cacheKey, result, CACHE_TTL.periodPerformance);
  return result;
}

export async function getReviewMetrics(range: DateRange) {
  const cacheKey = getCacheKey('period:review', range.startStr, range.endStr);
  const cached = metricsCache.get<{
    totalShareLinks: number;
    activeShareLinks: number;
    totalComments: number;
    resolvedComments: number;
    resolutionRate: number;
    projectsWithShares: number;
  }>(cacheKey);
  if (cached) return cached;

  const now = new Date();

  const [
    totalShareLinks,
    activeShareLinks,
    totalComments,
    resolvedComments,
    projectsWithShares,
  ] = await Promise.all([
    ShareLink.countDocuments({
      createdAt: { $gte: range.start, $lte: range.end },
    }),
    ShareLink.countDocuments({
      expiresAt: { $gt: now },
      revokedAt: { $exists: false },
    }),
    ReviewComment.countDocuments({
      authorType: 'advisor',
      createdAt: { $gte: range.start, $lte: range.end },
    }),
    ReviewComment.countDocuments({
      authorType: 'advisor',
      status: 'resolved',
      createdAt: { $gte: range.start, $lte: range.end },
    }),
    ShareLink.distinct('projectId', {
      createdAt: { $gte: range.start, $lte: range.end },
    }).then((ids) => ids.length),
  ]);

  const resolutionRate = totalComments > 0
    ? Math.round((resolvedComments / totalComments) * 1000) / 10
    : 0;

  const result = {
    totalShareLinks,
    activeShareLinks,
    totalComments,
    resolvedComments,
    resolutionRate,
    projectsWithShares,
  };

  metricsCache.set(cacheKey, result, CACHE_TTL.periodPerformance);
  return result;
}

