// Main metrics service - orchestrates all metric calculations

import Stripe from 'stripe';
import { DateRange, AdminMetricsResponse } from './types';
import { createDateRange } from './date-utils';
import * as periodMetrics from './period-metrics';
import * as periodProductMetrics from './period-product-metrics';
import * as allTimeMetrics from './alltime-metrics';
import * as fixedWindowMetrics from './fixed-window-metrics';
import * as comparisonMetrics from './comparison-metrics';
import { calculateChange } from './comparison-metrics';
import { metricsCache, getCacheKey, CACHE_TTL } from './cache';

export async function getAllMetrics(days: number, startDate?: string, endDate?: string): Promise<AdminMetricsResponse> {
  // Validate and create date range
  const validDays = Math.max(1, Math.min(365, days));
  
  let currentRange: DateRange;
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    
    currentRange = {
      start,
      end,
      startStr: start.toISOString().split('T')[0],
      endStr: end.toISOString().split('T')[0],
      startTimestamp: Math.floor(start.getTime() / 1000),
      endTimestamp: Math.floor(end.getTime() / 1000),
      days: validDays,
    };
  } else {
    currentRange = createDateRange(validDays);
  }

  // Check cache for all-time metrics separately (they rarely change)
  const allTimeCacheKey = getCacheKey('alltime:metrics');
  let allTimeUserMetrics, allTimeProjectMetrics, allTimeUsageMetrics, allTimeRevenueMetrics;
  
  const cachedAllTime = metricsCache.get<{
    users: any;
    projects: any;
    usage: any;
    revenue: any;
  }>(allTimeCacheKey);
  
  if (cachedAllTime) {
    allTimeUserMetrics = cachedAllTime.users;
    allTimeProjectMetrics = cachedAllTime.projects;
    allTimeUsageMetrics = cachedAllTime.usage;
    allTimeRevenueMetrics = cachedAllTime.revenue;
  } else {
    // Fetch all-time metrics in parallel
    [allTimeUserMetrics, allTimeProjectMetrics, allTimeUsageMetrics, allTimeRevenueMetrics] = await Promise.all([
      allTimeMetrics.getAllTimeUserMetrics(),
      allTimeMetrics.getAllTimeProjectMetrics(),
      allTimeMetrics.getAllTimeUsageMetrics(),
      allTimeMetrics.getAllTimeRevenueMetrics(),
    ]);
    
    // Cache all-time metrics for longer (they don't change often)
    metricsCache.set(allTimeCacheKey, {
      users: allTimeUserMetrics,
      projects: allTimeProjectMetrics,
      usage: allTimeUsageMetrics,
      revenue: allTimeRevenueMetrics,
    }, CACHE_TTL.allTimeMetrics);
  }

  // Check cache for period-specific metrics
  const periodCacheKey = getCacheKey('period:metrics', currentRange.startStr, currentRange.endStr);
  const cachedPeriod = metricsCache.get<{
    users: any;
    projects: any;
    usage: any;
    engagement: any;
    product: any;
  }>(periodCacheKey);

  let periodUserMetrics, periodProjectMetrics, periodUsageMetrics, periodEngagementMetrics, periodProductMetricsData;
  
  if (cachedPeriod) {
    periodUserMetrics = cachedPeriod.users;
    periodProjectMetrics = cachedPeriod.projects;
    periodUsageMetrics = cachedPeriod.usage;
    periodEngagementMetrics = cachedPeriod.engagement;
    periodProductMetricsData = cachedPeriod.product;
  } else {
    // Calculate period metrics in parallel
    [periodUserMetrics, periodProjectMetrics, periodUsageMetrics, periodEngagementMetrics, periodProductMetricsData] = await Promise.all([
      periodMetrics.getPeriodUserMetrics(currentRange),
      periodMetrics.getPeriodProjectMetrics(currentRange),
      periodMetrics.getPeriodUsageMetrics(currentRange),
      periodMetrics.getPeriodEngagementMetrics(currentRange),
      periodProductMetrics.getPeriodProductMetrics(currentRange),
    ]);
    
    // Cache period metrics
    metricsCache.set(periodCacheKey, {
      users: periodUserMetrics,
      projects: periodProjectMetrics,
      usage: periodUsageMetrics,
      engagement: periodEngagementMetrics,
      product: periodProductMetricsData,
    }, CACHE_TTL.periodPerformance);
  }

  // Fixed window metrics (cache separately)
  const fixedWindowCacheKey = getCacheKey('fixedwindow:metrics', validDays);
  let fixedWindowEngagement, fixedWindowRetention;
  
  const cachedFixedWindow = metricsCache.get<{
    engagement: any;
    retention: any;
  }>(fixedWindowCacheKey);
  
  if (cachedFixedWindow) {
    fixedWindowEngagement = cachedFixedWindow.engagement;
    fixedWindowRetention = cachedFixedWindow.retention;
  } else {
    [fixedWindowEngagement, fixedWindowRetention] = await Promise.all([
      fixedWindowMetrics.getFixedWindowEngagementMetrics(validDays),
      fixedWindowMetrics.getFixedWindowRetentionMetrics(validDays),
    ]);
    
    metricsCache.set(fixedWindowCacheKey, {
      engagement: fixedWindowEngagement,
      retention: fixedWindowRetention,
    }, CACHE_TTL.periodPerformance);
  }

  // Calculate period revenue first (needed for comparisons)
  const periodRevenue = await getPeriodRevenue(currentRange);

  // Calculate monetization and comparisons in parallel
  const [allTimeMonetization, comparisons] = await Promise.all([
    allTimeMetrics.getAllTimeMonetizationMetrics(
      allTimeUserMetrics.total,
      allTimeRevenueMetrics.totalRevenue,
      allTimeRevenueMetrics.monthlyRecurringRevenue,
      allTimeRevenueMetrics.activeSubscriptions
    ),
    comparisonMetrics.getComparisonMetrics(
      currentRange,
      {
        newUsers: periodUserMetrics.newInPeriod,
        projectsCreated: periodProjectMetrics.createdInPeriod,
        aiWords: periodUsageMetrics.aiWordsInPeriod,
        plagiarismChecks: periodUsageMetrics.plagiarismChecksInPeriod,
        revenue: periodRevenue.revenueInPeriod,
      }
    ),
  ]);

  // Calculate conversion rate
  const conversionRate = allTimeUserMetrics.total > 0
    ? ((allTimeUserMetrics.pro / allTimeUserMetrics.total) * 100)
    : 0;

  const result: AdminMetricsResponse = {
    executiveSummary: {
      monthlyRecurringRevenue: allTimeRevenueMetrics.monthlyRecurringRevenue,
      annualRecurringRevenue: allTimeRevenueMetrics.annualRecurringRevenue,
      activeSubscriptions: allTimeRevenueMetrics.activeSubscriptions,
      dau: fixedWindowEngagement.dau,
      mau: fixedWindowEngagement.mau,
      stickiness: fixedWindowEngagement.stickiness,
    },
    periodPerformance: {
      users: periodUserMetrics,
      projects: periodProjectMetrics,
      usage: periodUsageMetrics,
      revenue: periodRevenue,
      engagement: periodEngagementMetrics,
    },
    businessMetrics: {
      revenue: {
        totalRevenue: allTimeRevenueMetrics.totalRevenue,
        monthlyRecurringRevenue: allTimeRevenueMetrics.monthlyRecurringRevenue,
        annualRecurringRevenue: allTimeRevenueMetrics.annualRecurringRevenue,
        activeSubscriptions: allTimeRevenueMetrics.activeSubscriptions,
        paymentFailures: allTimeRevenueMetrics.paymentFailures,
        pastDueSubscriptions: allTimeRevenueMetrics.pastDueSubscriptions,
        canceledSubscriptions: allTimeRevenueMetrics.canceledSubscriptions,
      },
      users: {
        total: allTimeUserMetrics.total,
        free: allTimeUserMetrics.free,
        pro: allTimeUserMetrics.pro,
        team: allTimeUserMetrics.team,
        withSubscriptions: allTimeUserMetrics.withSubscriptions,
        conversionRate,
      },
      monetization: allTimeMonetization,
    },
    engagement: {
      dau: fixedWindowEngagement.dau,
      mau: fixedWindowEngagement.mau,
      stickiness: fixedWindowEngagement.stickiness,
      powerUsers: periodEngagementMetrics.powerUsers,
      consistentUsers: periodEngagementMetrics.consistentUsers,
      avgActiveDays: periodEngagementMetrics.avgActiveDays,
    },
    productHealth: {
      completionRate: periodProductMetricsData.completionRate,
      avgProjectsPerUser: periodProductMetricsData.avgProjectsPerUser,
      usersWithMultipleProjects: periodProductMetricsData.usersWithMultipleProjects,
      citationAdoption: periodProductMetricsData.citationAdoption,
      pdfAdoption: periodProductMetricsData.pdfAdoption,
      plagiarismAdoption: periodProductMetricsData.plagiarismAdoption,
      projects: periodProductMetricsData.projects,
    },
    retention: fixedWindowRetention,
    detailedLists: {
      recentUsers: allTimeUserMetrics.recentUsers,
      topUsersByUsage: periodUsageMetrics.topUsersByUsage,
      subscriptionDetails: allTimeRevenueMetrics.subscriptionDetails,
    },
    comparisons,
    dateRange: {
      days: validDays,
      start: currentRange.startStr,
      end: currentRange.endStr,
    },
    timeContexts: {
      executiveSummary: 'current',
      periodPerformance: 'period',
      businessMetrics: 'mixed',
      engagement: 'adaptive',
      productHealth: 'period' as const, // Now respects date filter
      retention: 'fixed-window',
    },
  };

  return result;
}

async function getPeriodRevenue(range: DateRange) {
  const stripe = getStripeClient();
  
  function getValidPriceIds(): string[] {
    const isProduction = process.env.NODE_ENV === 'production';
    const priceIds: string[] = [];
    
    if (isProduction) {
      if (process.env.STRIPE_PRICE_MONTHLY_PROD) priceIds.push(process.env.STRIPE_PRICE_MONTHLY_PROD);
      if (process.env.STRIPE_PRICE_ANNUAL_PROD) priceIds.push(process.env.STRIPE_PRICE_ANNUAL_PROD);
    } else {
      if (process.env.STRIPE_PRICE_MONTHLY_TEST) priceIds.push(process.env.STRIPE_PRICE_MONTHLY_TEST);
      if (process.env.STRIPE_PRICE_ANNUAL_TEST) priceIds.push(process.env.STRIPE_PRICE_ANNUAL_TEST);
    }
    
    return priceIds;
  }
  
  const validPriceIds = getValidPriceIds();

  const defaultRevenue = {
    revenueInPeriod: 0,
    revenueLast7Days: 0,
  };

  if (!stripe || validPriceIds.length === 0) {
    return defaultRevenue;
  }

  try {
    // Get all subscriptions for this product
    let allSubscriptions: any[] = [];
    let hasMore = true;
    let startingAfter: string | undefined = undefined;

    while (hasMore) {
      const params: any = {
        limit: 100,
        status: 'all',
      };
      if (startingAfter) {
        params.starting_after = startingAfter;
      }

      const subscriptions = await stripe.subscriptions.list(params);
      const filteredSubs = subscriptions.data.filter((sub: any) => {
        const priceId = sub.items.data[0]?.price?.id;
        return priceId && validPriceIds.includes(priceId);
      });
      
      allSubscriptions = allSubscriptions.concat(filteredSubs);
      hasMore = subscriptions.has_more;
      if (hasMore && subscriptions.data.length > 0) {
        startingAfter = subscriptions.data[subscriptions.data.length - 1].id;
      } else {
        hasMore = false;
      }
    }

    // Get invoices for period
    let allInvoices: any[] = [];
    hasMore = true;
    startingAfter = undefined;

    while (hasMore) {
      const params: any = {
        limit: 100,
      };
      if (startingAfter) {
        params.starting_after = startingAfter;
      }

      const invoices = await stripe.invoices.list(params);
      const filteredInvoices = invoices.data.filter((invoice: any) => {
        if (!invoice.subscription) return false;
        const subId = typeof invoice.subscription === 'string' 
          ? invoice.subscription 
          : invoice.subscription.id;
        return allSubscriptions.some(sub => sub.id === subId);
      });
      
      allInvoices = allInvoices.concat(
        filteredInvoices.filter((inv: any) => inv.paid && inv.amount_paid)
      );

      hasMore = invoices.has_more;
      if (hasMore && invoices.data.length > 0) {
        startingAfter = invoices.data[invoices.data.length - 1].id;
      } else {
        hasMore = false;
      }
    }

    // Calculate revenue in period
    let revenueInPeriod = 0;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoTimestamp = Math.floor(sevenDaysAgo.getTime() / 1000);
    let revenue7Days = 0;

    for (const invoice of allInvoices) {
      const inv = invoice as any;
      const amount = inv.amount_paid / 100;
      
      if (inv.created >= range.startTimestamp && inv.created <= range.endTimestamp) {
        revenueInPeriod += amount;
      }
      
      if (inv.created >= sevenDaysAgoTimestamp) {
        revenue7Days += amount;
      }
    }

    return {
      revenueInPeriod,
      revenueLast7Days: revenue7Days,
    };
  } catch (error) {
    console.warn('Error fetching period revenue:', error);
    return defaultRevenue;
  }
}

function getStripeClient() {
  let stripeKey: string | undefined;
  
  if (process.env.STRIPE_SECRET_KEY) {
    stripeKey = process.env.STRIPE_SECRET_KEY;
  } else if (process.env.NODE_ENV === 'production') {
    stripeKey = process.env.STRIPE_SECRET_KEY_PROD_V2 || 
                process.env.STRIPE_SECRET_KEY_PROD;
  } else {
    stripeKey = process.env.STRIPE_SECRET_KEY_TEST || 
                process.env.STRIPE_SECRET_KEY_DEV;
  }
  
  if (!stripeKey) {
    return null;
  }
  
  try {
    return new Stripe(stripeKey, {
      apiVersion: '2025-09-30.clover',
    });
  } catch (error) {
    return null;
  }
}

