// Adapter to convert new metrics structure to frontend-compatible format

import { AdminMetricsResponse } from './types';

/**
 * Converts the new structured metrics response to the format expected by the frontend
 * This maintains backward compatibility while using the new structure
 */
export function adaptMetricsForFrontend(response: AdminMetricsResponse) {
  return {
    // New structure - organized by time context
    executiveSummary: response.executiveSummary,
    periodPerformance: response.periodPerformance,
    businessMetrics: response.businessMetrics,
    productHealth: response.productHealth,
    detailedLists: response.detailedLists,
    comparisons: response.comparisons,
    dateRange: response.dateRange,
    timeContexts: response.timeContexts,
    
    // Legacy structure for backward compatibility (includes engagement and retention)
    users: {
      total: response.businessMetrics.users.total,
      free: response.businessMetrics.users.free,
      pro: response.businessMetrics.users.pro,
      team: response.businessMetrics.users.team,
      withSubscriptions: response.businessMetrics.users.withSubscriptions,
      newLast30Days: response.periodPerformance.users.newInPeriod,
      newLast7Days: response.periodPerformance.users.newLast7Days,
      growth: response.periodPerformance.users.growth,
      recentUsers: response.detailedLists.recentUsers,
      topUsersByUsage: response.detailedLists.topUsersByUsage,
    },
    projects: {
      total: response.productHealth.projects.total,
      active: response.productHealth.projects.active,
      completed: response.productHealth.projects.completed,
      createdInPeriod: response.periodPerformance.projects.createdInPeriod,
      growth: response.periodPerformance.projects.growth,
    },
    usage: {
      totalAIWords: 0, // Not in new structure, can be calculated if needed
      totalPlagiarismChecks: 0, // Not in new structure, can be calculated if needed
      aiWordsLast30Days: response.periodPerformance.usage.aiWordsInPeriod,
      plagiarismChecksLast30Days: response.periodPerformance.usage.plagiarismChecksInPeriod,
      paraphraseUsesInPeriod: response.periodPerformance.usage.paraphraseUsesInPeriod,
      growth: response.periodPerformance.usage.growth || [],
      topUsersByUsage: response.detailedLists.topUsersByUsage,
    },
    revenue: {
      totalRevenue: response.businessMetrics.revenue.totalRevenue,
      monthlyRecurringRevenue: response.businessMetrics.revenue.monthlyRecurringRevenue,
      annualRecurringRevenue: response.businessMetrics.revenue.annualRecurringRevenue,
      activeSubscriptions: response.businessMetrics.revenue.activeSubscriptions,
      paymentFailures: response.businessMetrics.revenue.paymentFailures,
      pastDueSubscriptions: response.businessMetrics.revenue.pastDueSubscriptions,
      canceledSubscriptions: response.businessMetrics.revenue.canceledSubscriptions,
      revenueLast30Days: response.periodPerformance.revenue.revenueInPeriod,
      revenueLast7Days: response.periodPerformance.revenue.revenueLast7Days,
      growth: response.periodPerformance.revenue.growth || [],
      subscriptionDetails: response.detailedLists.subscriptionDetails,
    },
    engagement: {
      dau: response.engagement.dau,
      mau: response.engagement.mau,
      stickiness: response.engagement.stickiness,
      powerUsers: response.engagement.powerUsers,
      consistentUsers: response.engagement.consistentUsers,
      avgActiveDays: response.engagement.avgActiveDays,
    },
    product: {
      completionRate: response.productHealth.completionRate,
      avgProjectsPerUser: response.productHealth.avgProjectsPerUser,
      usersWithMultipleProjects: response.productHealth.usersWithMultipleProjects,
      citationAdoption: response.productHealth.citationAdoption,
      pdfAdoption: response.productHealth.pdfAdoption,
      plagiarismAdoption: response.productHealth.plagiarismAdoption,
    },
    monetization: {
      arpu: response.businessMetrics.monetization.arpu,
      arpuActive: response.businessMetrics.monetization.arpuActive,
      avgTimeToConversion: response.businessMetrics.monetization.avgTimeToConversion,
    },
    retention: {
      churnRate: response.retention.churnRate,
      churnedUsers: response.retention.churnedUsers,
    },
  };
}

