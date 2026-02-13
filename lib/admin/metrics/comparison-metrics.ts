// Comparison metrics (previous period vs current period)

import { DateRange } from './types';
import User from '@/models/User';
import Project from '@/models/Project';
import DailyUsage from '@/models/DailyUsage';
import Stripe from 'stripe';
import { createPreviousPeriodRange } from './date-utils';

function getStripeClient(): Stripe | null {
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

export function calculateChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export async function getComparisonMetrics(
  currentRange: DateRange,
  currentMetrics: {
    newUsers: number;
    projectsCreated: number;
    aiWords: number;
    plagiarismChecks: number;
    topicFinderSearches: number;
    litReviewAnalyses: number;
    revenue: number;
  }
) {
  const previousRange = createPreviousPeriodRange(currentRange);
  
  // Previous period: new users
  const previousNewUsers = await User.countDocuments({
    createdAt: {
      $gte: previousRange.start,
      $lte: previousRange.end
    }
  });
  
  // Previous period: projects created
  const previousProjectsCreated = await Project.countDocuments({
    createdAt: {
      $gte: previousRange.start,
      $lte: previousRange.end
    }
  });
  
  // Previous period: usage
  const previousUsagePeriod = await DailyUsage.aggregate([
    {
      $match: {
        date: {
          $gte: previousRange.startStr,
          $lte: previousRange.endStr
        }
      }
    },
    {
      $group: {
        _id: null,
        totalAIWords: { $sum: '$aiWordsGenerated' },
        totalPlagiarismChecks: { $sum: '$plagiarismChecks' },
        totalTopicFinderSearches: { $sum: '$topicFinderSearches' },
        totalLitReviewAnalyses: { $sum: '$litReviewAnalyses' }
      }
    }
  ], { maxTimeMS: 30000 }); // 30 second timeout
  const previousAIWords = previousUsagePeriod[0]?.totalAIWords || 0;
  const previousPlagiarismChecks = previousUsagePeriod[0]?.totalPlagiarismChecks || 0;
  const previousTopicFinderSearches = previousUsagePeriod[0]?.totalTopicFinderSearches || 0;
  const previousLitReviewAnalyses = previousUsagePeriod[0]?.totalLitReviewAnalyses || 0;
  
  // Previous period: revenue (from Stripe invoices)
  let previousRevenue = 0;
  const stripe = getStripeClient();
  const validPriceIds = getValidPriceIds();
  
  if (stripe && validPriceIds.length > 0) {
    try {
      // Get subscriptions for this product
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

      // Get invoices for previous period
      const previousInvoices = await stripe.invoices.list({
        limit: 100,
        status: 'paid',
        created: {
          gte: previousRange.startTimestamp,
          lt: previousRange.endTimestamp
        }
      });
      
      const previousProductInvoices = previousInvoices.data.filter((inv: any) => {
        return inv.subscription && 
               allSubscriptions.some(sub => sub.id === inv.subscription);
      });
      
      for (const invoice of previousProductInvoices) {
        const inv = invoice as any;
        previousRevenue += inv.amount_paid / 100;
      }
    } catch (error) {
      console.warn('Error fetching previous period revenue:', error);
    }
  }

  return {
    previousPeriod: {
      newUsers: previousNewUsers,
      projectsCreated: previousProjectsCreated,
      aiWords: previousAIWords,
      plagiarismChecks: previousPlagiarismChecks,
      topicFinderSearches: previousTopicFinderSearches,
      litReviewAnalyses: previousLitReviewAnalyses,
      revenue: previousRevenue,
    },
    changes: {
      newUsers: calculateChange(currentMetrics.newUsers, previousNewUsers),
      projectsCreated: calculateChange(currentMetrics.projectsCreated, previousProjectsCreated),
      aiWords: calculateChange(currentMetrics.aiWords, previousAIWords),
      plagiarismChecks: calculateChange(currentMetrics.plagiarismChecks, previousPlagiarismChecks),
      topicFinderSearches: calculateChange(currentMetrics.topicFinderSearches, previousTopicFinderSearches),
      litReviewAnalyses: calculateChange(currentMetrics.litReviewAnalyses, previousLitReviewAnalyses),
      revenue: calculateChange(currentMetrics.revenue, previousRevenue),
    },
  };
}

