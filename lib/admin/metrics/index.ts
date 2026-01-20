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
    growth: [] as Array<{ _id: string; count: number }>,
  };

  // If Stripe is not configured, we can't compute revenue – return zeros.
  if (!stripe) {
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

      // If no valid price IDs are configured, accept all subscriptions (same behaviour as all‑time metrics).
      // Otherwise, restrict to the configured price IDs only.
      const filteredSubs = subscriptions.data.filter((sub: any) => {
        const priceId = sub.items.data[0]?.price?.id;
        if (!priceId) return false;
        if (validPriceIds.length === 0) return true;
        return validPriceIds.includes(priceId);
      });
      
      allSubscriptions = allSubscriptions.concat(filteredSubs);
      hasMore = subscriptions.has_more;
      if (hasMore && subscriptions.data.length > 0) {
        startingAfter = subscriptions.data[subscriptions.data.length - 1].id;
      } else {
        hasMore = false;
      }
    }

    // Calculate revenue in period from subscriptions (not invoices)
    // Count billing cycles that occurred within the date range
    let revenueInPeriod = 0;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
    sevenDaysAgo.setUTCHours(0, 0, 0, 0);
    const sevenDaysAgoTimestamp = Math.floor(sevenDaysAgo.getTime() / 1000);
    let revenue7Days = 0;

    // Group revenue by day for growth chart
    const dailyRevenueMap = new Map<string, number>();

    for (const subscription of allSubscriptions) {
      const priceId = subscription.items.data[0]?.price?.id;
      
      if (!priceId || (validPriceIds.length > 0 && !validPriceIds.includes(priceId))) {
        continue;
      }

      try {
        const price = await stripe.prices.retrieve(priceId);
        const amount = price.unit_amount || 0;
        const interval = price.recurring?.interval;
        
        if (!interval || amount === 0) continue;

        const subscriptionCreated = subscription.created;
        const currentPeriodStart = subscription.current_period_start;
        const currentPeriodEnd = subscription.current_period_end;
        const amountDollars = amount / 100;
        
        // Calculate billing cycles that occurred in the period
        if (interval === 'month') {
          // For monthly subscriptions, count cycles that occurred in the period
          // Process ALL subscriptions (including canceled ones) to count revenue
          // that occurred during the period, even if subscription is now canceled
          
          // Determine when subscription ended (canceled_at if canceled, otherwise currentPeriodEnd)
          const subscriptionEndTime = subscription.status === 'canceled' && subscription.canceled_at
            ? subscription.canceled_at
            : currentPeriodEnd;
          
          // Skip if subscription ended before the period started
          if (subscriptionEndTime < range.startTimestamp) {
            continue;
          }
          
          // A billing cycle occurs on subscription.created + N months
          const secondsPerMonth = Math.floor(30.44 * 24 * 60 * 60); // ~30.44 days per month
          
          // Find all billing cycles that occurred during the period
          // Start from subscription creation and iterate forward
          let cycleDate = subscriptionCreated;
          let cycleNumber = 0;
          
          // Iterate through billing cycles until we've passed the period end
          // Limit to 120 cycles (10 years) as a safety check
          while (cycleDate <= range.endTimestamp && cycleNumber <= 120) {
            // Check if this billing cycle occurred within the period
            if (cycleDate >= range.startTimestamp && cycleDate <= range.endTimestamp) {
              // Only count if subscription was active at this cycle date
              // (i.e., cycle date is before or equal to when subscription ended)
              if (cycleDate <= subscriptionEndTime) {
                revenueInPeriod += amountDollars;
                
                // Group by date (YYYY-MM-DD) for growth chart
                const cycleDateObj = new Date(cycleDate * 1000);
                const dateStr = cycleDateObj.toISOString().split('T')[0];
                dailyRevenueMap.set(dateStr, (dailyRevenueMap.get(dateStr) || 0) + amountDollars);
                
                // Check if within last 7 days
                if (cycleDate >= sevenDaysAgoTimestamp) {
                  revenue7Days += amountDollars;
                }
              }
            }
            
            // Move to next billing cycle
            cycleNumber++;
            cycleDate = subscriptionCreated + (cycleNumber * secondsPerMonth);
            
            // Stop if we've passed the period end or subscription end
            if (cycleDate > range.endTimestamp || cycleDate > subscriptionEndTime) break;
          }
        } else if (interval === 'year') {
          // For annual subscriptions, count if subscription started/renewed in the period
          // Check if subscription creation falls within the period
          if (subscriptionCreated >= range.startTimestamp && subscriptionCreated <= range.endTimestamp) {
            revenueInPeriod += amountDollars;
            
            // Group by date (YYYY-MM-DD)
            const cycleDateObj = new Date(subscriptionCreated * 1000);
            const dateStr = cycleDateObj.toISOString().split('T')[0];
            dailyRevenueMap.set(dateStr, (dailyRevenueMap.get(dateStr) || 0) + amountDollars);
            
            // Check if within last 7 days
            if (subscriptionCreated >= sevenDaysAgoTimestamp) {
              revenue7Days += amountDollars;
            }
          }
          
          // Check for renewals (if subscription is older than 1 year)
          // Calculate potential renewal dates
          if (subscriptionCreated < range.endTimestamp) {
            const secondsPerYear = Math.floor(365.25 * 24 * 60 * 60);
            let renewalDate = subscriptionCreated + secondsPerYear;
            
            // Determine when subscription ended (canceled_at if canceled, otherwise currentPeriodEnd)
            // For canceled subscriptions, use canceled_at; for active, use currentPeriodEnd
            const subscriptionEndTime = subscription.status === 'canceled' && subscription.canceled_at
              ? subscription.canceled_at
              : currentPeriodEnd;
            
            // Check renewals that occurred in the period
            // Use < (strictly less than) for subscriptionEndTime to exclude unpaid future renewals
            // currentPeriodEnd is when the next payment is due, not when it was paid
            while (renewalDate <= range.endTimestamp && renewalDate < subscriptionEndTime) {
              if (renewalDate >= range.startTimestamp && renewalDate <= range.endTimestamp) {
                revenueInPeriod += amountDollars;
                
                // Group by date
                const renewalDateObj = new Date(renewalDate * 1000);
                const dateStr = renewalDateObj.toISOString().split('T')[0];
                dailyRevenueMap.set(dateStr, (dailyRevenueMap.get(dateStr) || 0) + amountDollars);
                
                // Check if within last 7 days
                if (renewalDate >= sevenDaysAgoTimestamp) {
                  revenue7Days += amountDollars;
                }
              }
              
              // Move to next renewal
              renewalDate += secondsPerYear;
              
              // Stop if we've passed the period end or subscription end
              if (renewalDate > range.endTimestamp || renewalDate >= subscriptionEndTime) break;
            }
          }
        }
      } catch (priceError) {
        console.error('Error calculating period revenue for subscription:', priceError);
      }
    }

    // Convert map to sorted array format matching user growth
    const revenueGrowth = Array.from(dailyRevenueMap.entries())
      .map(([date, amount]) => ({
        _id: date,
        count: amount,
      }))
      .sort((a, b) => a._id.localeCompare(b._id));

    return {
      revenueInPeriod,
      revenueLast7Days: revenue7Days,
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
  } catch (error) {
    return null;
  }
}

