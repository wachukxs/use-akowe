import { getAllMetrics } from './metrics';

/**
 * Sanitized public-facing metrics for investor/marketing use.
 * This deliberately excludes any user-identifiable data or
 * subscription-level details and only exposes aggregates.
 */
export async function getPublicMetrics() {
  // Use 30-day window for "recent performance" plus all-time aggregates
  const metrics = await getAllMetrics(30);

  return {
    users: {
      total: metrics.businessMetrics.users.total,
      newInPeriod: metrics.periodPerformance.users.newInPeriod,
      newLast7Days: metrics.periodPerformance.users.newLast7Days,
      dau: metrics.engagement.dau,
      mau: metrics.engagement.mau,
      stickiness: metrics.engagement.stickiness,
    },
    projects: {
      total: metrics.productHealth.projects.total,
      createdInPeriod: metrics.periodPerformance.projects.createdInPeriod,
      avgProjectsPerUser: metrics.productHealth.avgProjectsPerUser,
    },
    usage: {
      aiWordsInPeriod: metrics.periodPerformance.usage.aiWordsInPeriod,
      plagiarismChecksInPeriod: metrics.periodPerformance.usage.plagiarismChecksInPeriod,
      citationAdoption: metrics.productHealth.citationAdoption,
      plagiarismAdoption: metrics.productHealth.plagiarismAdoption,
    },
    productHealth: {
      activeUsers: metrics.periodPerformance.engagement.activeUsers,
      powerUsers: metrics.periodPerformance.engagement.powerUsers,
      consistentUsers: metrics.periodPerformance.engagement.consistentUsers,
    },
    // We intentionally do NOT expose:
    // - detailedLists (recentUsers, topUsersByUsage, subscriptionDetails)
    // - per-subscription revenue breakdown
  };
}

