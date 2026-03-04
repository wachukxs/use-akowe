import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { createDateRange } from './metrics/date-utils';
import * as periodMetrics from './metrics/period-metrics';
import * as periodProductMetrics from './metrics/period-product-metrics';
import * as fixedWindowMetrics from './metrics/fixed-window-metrics';
import * as allTimeMetrics from './metrics/alltime-metrics';

/**
 * Get subscription prices from environment or use defaults
 * Prices are in cents (Stripe format)
 */
function getSubscriptionPrices() {
  // Try to get from env vars first, fallback to defaults
  // Defaults: $29/month, $290/year (10 months = annual discount)
  const monthlyPrice = parseInt(process.env.SUBSCRIPTION_PRICE_MONTHLY || '2900', 10); // $29 in cents
  const annualPrice = parseInt(process.env.SUBSCRIPTION_PRICE_ANNUAL || '29000', 10); // $290 in cents
  
  return {
    monthly: monthlyPrice,
    annual: annualPrice,
  };
}

/**
 * Calculate revenue metrics from local database (no Stripe API calls)
 * Simplified: If user has stripeSubscriptionId, they've paid at least once
 */
async function getLocalRevenueMetrics() {
  const prices = getSubscriptionPrices();
  
  // Get ALL users with subscriptions (active or expired - they've all paid at least once)
  const allSubscriptionUsers = await User.find({
    stripeSubscriptionId: { $exists: true, $ne: null }
  }).select('billingCycle subscriptionStartDate subscriptionEndDate plan createdAt').lean();
  
  let mrr = 0;
  let arr = 0;
  let totalRevenue = 0;
  let activeSubs = 0;
  const now = Date.now();
  
  for (const user of allSubscriptionUsers) {
    const billingCycle = user.billingCycle || 'monthly';
    // Include both 'pro' and 'team' plans as active paying subscriptions
    const isActive = (user.plan === 'standard' || user.plan === 'pro' || user.plan === 'team') && !user.subscriptionEndDate;
    
    if (billingCycle === 'monthly') {
      const monthlyPrice = prices.monthly;
      
      // MRR: only count active subscriptions
      if (isActive) {
        mrr += monthlyPrice;
        activeSubs++;
      }
      
      // Total revenue: count cycles from start to end (or now)
      // If we have subscriptionStartDate, use it. Otherwise, use createdAt as fallback.
      const subscriptionStart = user.subscriptionStartDate 
        ? new Date(user.subscriptionStartDate).getTime()
        : new Date(user.createdAt || Date.now()).getTime();
      
      const subscriptionEnd = user.subscriptionEndDate 
        ? new Date(user.subscriptionEndDate).getTime()
        : now;
      
      const monthsSinceStart = Math.max(0, Math.floor(
        (subscriptionEnd - subscriptionStart) / (1000 * 60 * 60 * 24 * 30.44)
      ));
      // Always count at least 1 cycle (initial payment - they have stripeSubscriptionId)
      const cyclesCompleted = Math.max(1, monthsSinceStart + 1);
      totalRevenue += monthlyPrice * cyclesCompleted;
      
    } else if (billingCycle === 'annual') {
      const annualPrice = prices.annual;
      
      // ARR and MRR: only count active subscriptions
      if (isActive) {
        arr += annualPrice;
        mrr += Math.round(annualPrice / 12);
        activeSubs++;
      }
      
      // Total revenue: count cycles from start to end (or now)
      const subscriptionStart = user.subscriptionStartDate 
        ? new Date(user.subscriptionStartDate).getTime()
        : new Date(user.createdAt || Date.now()).getTime();
      
      const subscriptionEnd = user.subscriptionEndDate 
        ? new Date(user.subscriptionEndDate).getTime()
        : now;
      
      const yearsSinceStart = Math.max(0, (subscriptionEnd - subscriptionStart) / (1000 * 60 * 60 * 24 * 365.25));
      // Always count at least 1 cycle (initial payment - they have stripeSubscriptionId)
      const cyclesCompleted = Math.max(1, Math.floor(yearsSinceStart) + 1);
      totalRevenue += annualPrice * cyclesCompleted;
    }
  }
  
  return {
    totalRevenue: Math.round(totalRevenue), // Already in cents
    monthlyRecurringRevenue: Math.round(mrr),
    annualRecurringRevenue: Math.round(arr),
    activeSubscriptions: activeSubs,
  };
}

/**
 * Optimized public-facing metrics for investor/marketing use.
 * Uses ONLY local database - no Stripe API calls.
 * This deliberately excludes any user-identifiable data or subscription-level details.
 */
export async function getPublicMetrics() {
  // Ensure database connection
  await connectDB();
  
  // Use 30-day window for period metrics
  const currentRange = createDateRange(30);
  
  // Fetch only what we need in parallel
  const [
    allTimeUserMetrics,
    allTimeProjectMetrics,
    allTimeUsageMetrics,
    periodUsageMetrics,
    localRevenueMetrics,
    periodUserMetrics,
    periodProjectMetrics,
    periodEngagementMetrics,
    periodProductMetricsData,
    fixedWindowCoreMetrics,
  ] = await Promise.all([
    // All-time metrics (lightweight - only counts, no expensive aggregations)
    (async () => {
      const totalUsers = await User.countDocuments();
      const freeUsers = await User.countDocuments({ plan: 'free' });
      const proUsers = await User.countDocuments({ plan: 'pro' });
      const teamUsers = await User.countDocuments({ plan: 'team' });
      const usersWithSubscriptions = await User.countDocuments({
        stripeSubscriptionId: { $exists: true, $ne: null }
      });
      return {
        total: totalUsers,
        free: freeUsers,
        pro: proUsers,
        team: teamUsers,
        withSubscriptions: usersWithSubscriptions,
      };
    })(),
    // All-time project metrics
    allTimeMetrics.getAllTimeProjectMetrics(),
    // All-time usage metrics (AI words, plagiarism checks - cumulative totals)
    allTimeMetrics.getAllTimeUsageMetrics(),
    // Period usage metrics (30 days) - AI words and plagiarism checks for engagement
    periodMetrics.getPeriodUsageMetrics(currentRange),
    // Local revenue metrics (no Stripe API)
    getLocalRevenueMetrics(),
    // Period metrics (30 days) - for new users, projects created, engagement
    periodMetrics.getPeriodUserMetrics(currentRange),
    periodMetrics.getPeriodProjectMetrics(currentRange),
    periodMetrics.getPeriodEngagementMetrics(currentRange),
    periodProductMetrics.getPeriodProductMetrics(currentRange),
    // Fixed window core metrics (WAU, activation, etc.)
    fixedWindowMetrics.getFixedWindowCoreMetrics(currentRange),
  ]);

  return {
    users: {
      total: allTimeUserMetrics.total,
      newInPeriod: periodUserMetrics.newInPeriod,
      newLast7Days: periodUserMetrics.newLast7Days,
      wau: fixedWindowCoreMetrics.wau,
      wauChange: fixedWindowCoreMetrics.wauChange,
    },
    projects: {
      total: allTimeProjectMetrics.total,
      createdInPeriod: periodProjectMetrics.createdInPeriod,
      avgProjectsPerUser: periodProductMetricsData.avgProjectsPerUser,
    },
    usage: {
      totalAIWords: allTimeUsageMetrics.totalAIWords, // All-time cumulative
      totalPlagiarismChecks: allTimeUsageMetrics.totalPlagiarismChecks, // All-time cumulative
      aiWordsInPeriod: periodUsageMetrics.aiWordsInPeriod, // Last 30 days for engagement
      plagiarismChecksInPeriod: periodUsageMetrics.plagiarismChecksInPeriod, // Last 30 days for engagement
      citationAdoption: periodProductMetricsData.citationAdoption,
      plagiarismAdoption: periodProductMetricsData.plagiarismAdoption,
    },
    productHealth: {
      activeUsers: periodEngagementMetrics.activeUsers,
      powerUsers: periodEngagementMetrics.powerUsers,
      consistentUsers: periodEngagementMetrics.consistentUsers,
    },
    revenue: {
      totalRevenue: localRevenueMetrics.totalRevenue,
      monthlyRecurringRevenue: localRevenueMetrics.monthlyRecurringRevenue,
      annualRecurringRevenue: localRevenueMetrics.annualRecurringRevenue,
      activeSubscriptions: localRevenueMetrics.activeSubscriptions,
    },
    // We intentionally do NOT expose:
    // - detailedLists (recentUsers, topUsersByUsage, subscriptionDetails)
    // - per-subscription revenue breakdown
    // - paymentFailures, pastDueSubscriptions, canceledSubscriptions (sensitive operational data)
  };
}

