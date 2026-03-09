// Main metrics service - orchestrates all metric calculations

import Stripe from 'stripe';
import { DateRange, AdminMetricsResponse } from './types';
import { createDateRange, getEarliestDataDate } from './date-utils';
import * as periodMetrics from './period-metrics';
import * as periodProductMetrics from './period-product-metrics';
import * as allTimeMetrics from './alltime-metrics';
import * as fixedWindowMetrics from './fixed-window-metrics';
import * as comparisonMetrics from './comparison-metrics';
import { metricsCache, getCacheKey, CACHE_TTL } from './cache';

export async function getAllMetrics(days: number, startDate?: string, endDate?: string): Promise<AdminMetricsResponse> {
  // Validate and create date range
  // Allow 0 for "all time" (handled by createDateRange)
  const validDays = days === 0 ? 0 : Math.max(1, Math.min(365, days));
  
  let currentRange: DateRange;
  if (startDate && endDate) {
    // Parse date strings ensuring UTC representation
    // If date-only (YYYY-MM-DD), append T00:00:00.000Z
    // If has T but no timezone indicator (Z, +, or -), append Z to ensure UTC parsing
    const normalizeDateString = (dateStr: string, defaultTime: string) => {
      if (!dateStr.includes('T')) {
        // Date-only: append default time with Z
        return dateStr + defaultTime;
      }
      // Has time component - check for timezone indicator
      // Match ISO 8601 timezone formats: Z, ±HH:MM, or ±HHMM
      if (!dateStr.endsWith('Z') && !dateStr.match(/[+-]\d{2}:?\d{2}$/)) {
        // Has T but no timezone indicator - append Z for UTC
        return dateStr + 'Z';
      }
      return dateStr;
    };
    
    const startStr = normalizeDateString(startDate, 'T00:00:00.000Z');
    const endStr = normalizeDateString(endDate, 'T23:59:59.999Z');
    const start = new Date(startStr);
    const end = new Date(endStr);
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(23, 59, 59, 999);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    currentRange = {
      start,
      end,
      startStr: start.toISOString().split('T')[0],
      endStr: end.toISOString().split('T')[0],
      startTimestamp: Math.floor(start.getTime() / 1000),
      endTimestamp: Math.floor(end.getTime() / 1000),
      days: daysDiff,
    };
  } else {
    // If "All time" (days === 0), get the earliest date from the database
    if (validDays === 0) {
      const earliestDate = await getEarliestDataDate();
      currentRange = createDateRange(0, earliestDate);
    } else {
      currentRange = createDateRange(validDays);
    }
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
    review: any;
  }>(periodCacheKey);

  let periodUserMetrics, periodProjectMetrics, periodUsageMetrics, periodEngagementMetrics, periodProductMetricsData, periodReviewMetricsData;

  if (cachedPeriod) {
    periodUserMetrics = cachedPeriod.users;
    periodProjectMetrics = cachedPeriod.projects;
    periodUsageMetrics = cachedPeriod.usage;
    periodEngagementMetrics = cachedPeriod.engagement;
    periodProductMetricsData = cachedPeriod.product;
    periodReviewMetricsData = cachedPeriod.review;
  } else {
    // Calculate period metrics in parallel
    [periodUserMetrics, periodProjectMetrics, periodUsageMetrics, periodEngagementMetrics, periodProductMetricsData, periodReviewMetricsData] = await Promise.all([
      periodMetrics.getPeriodUserMetrics(currentRange),
      periodMetrics.getPeriodProjectMetrics(currentRange),
      periodMetrics.getPeriodUsageMetrics(currentRange),
      periodMetrics.getPeriodEngagementMetrics(currentRange),
      periodProductMetrics.getPeriodProductMetrics(currentRange),
      periodProductMetrics.getReviewMetrics(currentRange),
    ]);

    // Cache period metrics
    metricsCache.set(periodCacheKey, {
      users: periodUserMetrics,
      projects: periodProjectMetrics,
      usage: periodUsageMetrics,
      engagement: periodEngagementMetrics,
      product: periodProductMetricsData,
      review: periodReviewMetricsData,
    }, CACHE_TTL.periodPerformance);
  }

  // Fixed window metrics (cache separately)
  const fixedWindowCacheKey = getCacheKey('fixedwindow:metrics', validDays);
  let fixedWindowCoreMetrics, fixedWindowRetention;

  const cachedFixedWindow = metricsCache.get<{
    coreMetrics: any;
    retention: any;
  }>(fixedWindowCacheKey);

  if (cachedFixedWindow) {
    fixedWindowCoreMetrics = cachedFixedWindow.coreMetrics;
    fixedWindowRetention = cachedFixedWindow.retention;
  } else {
    [fixedWindowCoreMetrics, fixedWindowRetention] = await Promise.all([
      fixedWindowMetrics.getFixedWindowCoreMetrics(currentRange),
      fixedWindowMetrics.getFixedWindowRetentionMetrics(validDays),
    ]);

    metricsCache.set(fixedWindowCacheKey, {
      coreMetrics: fixedWindowCoreMetrics,
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
        topicFinderSearches: periodUsageMetrics.topicFinderSearchesInPeriod,
        litReviewAnalyses: periodUsageMetrics.litReviewAnalysesInPeriod,
        revenue: periodRevenue.revenueInPeriod,
      }
    ),
  ]);

  // Calculate conversion rate (any paid plan: standard, pro, team)
  const paidUsers = allTimeUserMetrics.standard + allTimeUserMetrics.pro + allTimeUserMetrics.team;
  const conversionRate = allTimeUserMetrics.total > 0
    ? ((paidUsers / allTimeUserMetrics.total) * 100)
    : 0;

  const result: AdminMetricsResponse = {
    executiveSummary: {
      monthlyRecurringRevenue: allTimeRevenueMetrics.monthlyRecurringRevenue,
      annualRecurringRevenue: allTimeRevenueMetrics.annualRecurringRevenue,
      activeSubscriptions: allTimeRevenueMetrics.activeSubscriptions,
      wau: fixedWindowCoreMetrics.wau,
      wauChange: fixedWindowCoreMetrics.wauChange,
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
        standard: allTimeUserMetrics.standard,
        pro: allTimeUserMetrics.pro,
        team: allTimeUserMetrics.team,
        withSubscriptions: allTimeUserMetrics.withSubscriptions,
        conversionRate,
      },
      monetization: allTimeMonetization,
    },
    coreMetrics: {
      wau: fixedWindowCoreMetrics.wau,
      wauChange: fixedWindowCoreMetrics.wauChange,
      mau: fixedWindowCoreMetrics.mau,
      activationRate: fixedWindowCoreMetrics.activationRate,
      activationTotal: fixedWindowCoreMetrics.activationTotal,
      activationActivated: fixedWindowCoreMetrics.activationActivated,
      avgTimeToActivation: fixedWindowCoreMetrics.avgTimeToActivation,
      week1Retention: fixedWindowRetention.week1Retention,
      week1CohortSize: fixedWindowRetention.week1CohortSize,
      week4Retention: fixedWindowRetention.week4Retention,
      week4CohortSize: fixedWindowRetention.week4CohortSize,
      projectsCompleted: fixedWindowCoreMetrics.projectsCompleted,
      projectsCompletedChange: fixedWindowCoreMetrics.projectsCompletedChange,
      wordsPerActiveDay: fixedWindowCoreMetrics.wordsPerActiveDay,
      wowRetention: fixedWindowCoreMetrics.wowRetention,
    },
    productHealth: {
      completionRate: periodProductMetricsData.completionRate,
      behavioralCompletionRate: periodProductMetricsData.behavioralCompletionRate,
      avgProjectsPerUser: periodProductMetricsData.avgProjectsPerUser,
      usersWithMultipleProjects: periodProductMetricsData.usersWithMultipleProjects,
      citationAdoption: periodProductMetricsData.citationAdoption,
      pdfAdoption: periodProductMetricsData.pdfAdoption,
      plagiarismAdoption: periodProductMetricsData.plagiarismAdoption,
      litReviewAdoption: periodProductMetricsData.litReviewAdoption,
      projects: periodProductMetricsData.projects,
    },
    reviewMetrics: periodReviewMetricsData,
    retention: {
      ...fixedWindowRetention,
      wowRetention: fixedWindowCoreMetrics.wowRetention,
    },
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
      coreMetrics: 'fixed-window',
      productHealth: 'period' as const,
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
      if (process.env.STRIPE_PRICE_STANDARD_MONTHLY_PROD) priceIds.push(process.env.STRIPE_PRICE_STANDARD_MONTHLY_PROD);
      if (process.env.STRIPE_PRICE_STANDARD_ANNUAL_PROD) priceIds.push(process.env.STRIPE_PRICE_STANDARD_ANNUAL_PROD);
    } else {
      if (process.env.STRIPE_PRICE_MONTHLY_TEST) priceIds.push(process.env.STRIPE_PRICE_MONTHLY_TEST);
      if (process.env.STRIPE_PRICE_ANNUAL_TEST) priceIds.push(process.env.STRIPE_PRICE_ANNUAL_TEST);
      if (process.env.STRIPE_PRICE_STANDARD_MONTHLY_TEST) priceIds.push(process.env.STRIPE_PRICE_STANDARD_MONTHLY_TEST);
      if (process.env.STRIPE_PRICE_STANDARD_ANNUAL_TEST) priceIds.push(process.env.STRIPE_PRICE_STANDARD_ANNUAL_TEST);
    }

    return priceIds;
  }
  
  const validPriceIds = getValidPriceIds();

  const defaultRevenue = {
    revenueInPeriod: 0,
    revenueLast7Days: 0,
    growth: [] as Array<{ _id: string; count: number }>,
  };

  // If Stripe is not configured, we can't compute revenue – return zeros.
  if (!stripe) {
    return defaultRevenue;
  }

  try {
    // Fetch paid invoices within the period to get actual collected revenue
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
    sevenDaysAgo.setUTCHours(0, 0, 0, 0);
    const sevenDaysAgoTimestamp = Math.floor(sevenDaysAgo.getTime() / 1000);

    let startingAfter: string | undefined = undefined;
    let hasMore = true;

    let revenueInPeriod = 0;
    let revenueLast7Days = 0;
    const dailyRevenueMap = new Map<string, number>();

    while (hasMore) {
      const page: Stripe.ApiList<Stripe.Invoice> = await stripe.invoices.list({
        limit: 100,
        status: 'paid',
        created: {
          gte: range.startTimestamp,
          lte: range.endTimestamp,
        },
        starting_after: startingAfter,
        expand: ['data.lines.data.price'],
      });

      for (const invoice of page.data) {
        const createdTs = typeof invoice.created === 'number'
          ? invoice.created
          : Math.floor(new Date(invoice.created as any).getTime() / 1000);

        // Sum only matching price IDs when provided; otherwise use the invoice total
        let invoiceAmountCents = 0;
        if (validPriceIds.length > 0 && invoice.lines?.data?.length) {
          invoice.lines.data.forEach((line: any) => {
            const priceId = line.price?.id;
            if (priceId && validPriceIds.includes(priceId)) {
              invoiceAmountCents += line.amount || 0;
            }
          });
        }

        // Fallback to amount_paid when no line items matched or filtering not applied
        if (invoiceAmountCents === 0) {
          invoiceAmountCents = invoice.amount_paid || 0;
        }

        const invoiceAmount = invoiceAmountCents / 100;
        revenueInPeriod += invoiceAmount;

        const dateStr = new Date(createdTs * 1000).toISOString().split('T')[0];
        dailyRevenueMap.set(dateStr, (dailyRevenueMap.get(dateStr) || 0) + invoiceAmount);

        if (createdTs >= sevenDaysAgoTimestamp) {
          revenueLast7Days += invoiceAmount;
        }
      }

      hasMore = page.has_more;
      if (hasMore && page.data.length > 0) {
        startingAfter = page.data[page.data.length - 1].id;
      } else {
        hasMore = false;
      }
    }

    const revenueGrowth = Array.from(dailyRevenueMap.entries())
      .map(([date, amount]) => ({ _id: date, count: amount }))
      .sort((a, b) => a._id.localeCompare(b._id));

    return {
      revenueInPeriod,
      revenueLast7Days,
      growth: revenueGrowth,
    };
  } catch (error) {
    console.warn('Error fetching period revenue:', error);
    return defaultRevenue;
  }
}

function getStripeClient() {
  let stripeKey: string | undefined;
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Prioritize environment-specific keys to avoid using production keys in dev
  if (isProduction) {
    stripeKey = process.env.STRIPE_SECRET_KEY_PROD_V2 || 
                process.env.STRIPE_SECRET_KEY_PROD ||
                process.env.STRIPE_SECRET_KEY; // Fallback to generic key only in prod
  } else {
    stripeKey = process.env.STRIPE_SECRET_KEY_TEST || 
                process.env.STRIPE_SECRET_KEY_DEV ||
                process.env.STRIPE_SECRET_KEY; // Fallback to generic key only in dev
  }
  
  if (!stripeKey) {
    return null;
  }
  
  try {
    return new Stripe(stripeKey, {
      apiVersion: '2025-10-29.clover',
    });
  } catch {
    return null;
  }
}

