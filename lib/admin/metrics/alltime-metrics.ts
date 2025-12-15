// All-time metrics (cumulative, don't use date filter)

import User from '@/models/User';
import Project from '@/models/Project';
import DailyUsage from '@/models/DailyUsage';
import Stripe from 'stripe';
import { metricsCache, getCacheKey, CACHE_TTL } from './cache';

function getStripeClient(): Stripe | null {
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
    console.warn('Failed to initialize Stripe:', error);
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

export async function getAllTimeUserMetrics() {
  const totalUsers = await User.countDocuments();
  const freeUsers = await User.countDocuments({ plan: 'free' });
  const proUsers = await User.countDocuments({ plan: 'pro' });
  const teamUsers = await User.countDocuments({ plan: 'team' });
  
  const usersWithSubscriptions = await User.countDocuments({ 
    stripeSubscriptionId: { $exists: true, $ne: null } 
  });

  const recentUsers = await User.find()
    .sort({ createdAt: -1 })
    .limit(50)
    .select('name email plan createdAt stripeSubscriptionId _id')
    .lean();

  // Get usage metrics for recent users (all-time)
  const userIds = recentUsers.map((u: any) => u._id.toString());
  const usageMap = new Map<string, { totalAIWords: number; totalPlagiarismChecks: number; activeDays: number }>();
  
  if (userIds.length > 0) {
    const usageData = await DailyUsage.aggregate([
      {
        $match: {
          userId: { $in: userIds }
        }
      },
      {
        $group: {
          _id: '$userId',
          totalAIWords: { $sum: '$aiWordsGenerated' },
          totalPlagiarismChecks: { $sum: '$plagiarismChecks' },
          activeDays: { $sum: 1 }
        }
      }
    ]);

    usageData.forEach((usage: any) => {
      usageMap.set(usage._id, {
        totalAIWords: usage.totalAIWords,
        totalPlagiarismChecks: usage.totalPlagiarismChecks,
        activeDays: usage.activeDays,
      });
    });
  }

  return {
    total: totalUsers,
    free: freeUsers,
    pro: proUsers,
    team: teamUsers,
    withSubscriptions: usersWithSubscriptions,
    recentUsers: recentUsers.map((u: any) => {
      const userId = u._id.toString();
      const usage = usageMap.get(userId) || { totalAIWords: 0, totalPlagiarismChecks: 0, activeDays: 0 };
      return {
        _id: userId,
        name: u.name || 'N/A',
        email: u.email,
        plan: u.plan,
        createdAt: u.createdAt.toISOString(),
        stripeSubscriptionId: u.stripeSubscriptionId,
        totalAIWords: usage.totalAIWords,
        totalPlagiarismChecks: usage.totalPlagiarismChecks,
        activeDays: usage.activeDays,
      };
    }),
  };
}

export async function getAllTimeProjectMetrics() {
  const totalProjects = await Project.countDocuments();
  const activeProjects = await Project.countDocuments({ status: { $in: ['draft', 'in_progress'] } });
  const completedProjects = await Project.countDocuments({ status: 'completed' });

  return {
    total: totalProjects,
    active: activeProjects,
    completed: completedProjects,
  };
}

export async function getAllTimeUsageMetrics() {
  const totalUsage = await DailyUsage.aggregate([
    {
      $group: {
        _id: null,
        totalAIWords: { $sum: '$aiWordsGenerated' },
        totalPlagiarismChecks: { $sum: '$plagiarismChecks' }
      }
    }
  ]);

  const usage = totalUsage[0] || { totalAIWords: 0, totalPlagiarismChecks: 0 };

  return {
    totalAIWords: usage.totalAIWords,
    totalPlagiarismChecks: usage.totalPlagiarismChecks,
  };
}

export async function getAllTimeRevenueMetrics() {
  const cacheKey = getCacheKey('alltime:revenue');
  const cached = metricsCache.get<{
    totalRevenue: number;
    monthlyRecurringRevenue: number;
    annualRecurringRevenue: number;
    activeSubscriptions: number;
    paymentFailures: number;
    pastDueSubscriptions: number;
    canceledSubscriptions: number;
    subscriptionDetails: any[];
  }>(cacheKey);
  if (cached) return cached;

  const stripe = getStripeClient();
  const validPriceIds = getValidPriceIds();

  const defaultRevenue = {
    totalRevenue: 0,
    monthlyRecurringRevenue: 0,
    annualRecurringRevenue: 0,
    activeSubscriptions: 0,
    paymentFailures: 0,
    pastDueSubscriptions: 0,
    canceledSubscriptions: 0,
    subscriptionDetails: [] as any[],
  };

  if (!stripe || validPriceIds.length === 0) {
    return defaultRevenue;
  }

  try {
    // Get all subscriptions with pagination
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
        return validPriceIds.length === 0 || (priceId && validPriceIds.includes(priceId));
      });
      
      allSubscriptions = allSubscriptions.concat(filteredSubs);

      hasMore = subscriptions.has_more;
      if (hasMore && subscriptions.data.length > 0) {
        startingAfter = subscriptions.data[subscriptions.data.length - 1].id;
      } else {
        hasMore = false;
      }
    }

    let mrr = 0;
    let arr = 0;
    let activeSubs = 0;
    let failedPayments = 0;
    let pastDue = 0;
    let canceled = 0;
    const subscriptionDetails: any[] = [];

    for (const subscription of allSubscriptions) {
      const priceId = subscription.items.data[0]?.price?.id;
      
      if (!priceId || (validPriceIds.length > 0 && !validPriceIds.includes(priceId))) {
        continue;
      }

      try {
        const price = await stripe.prices.retrieve(priceId);
        const amount = price.unit_amount || 0;
        const customerId = subscription.customer;
        
        let customerEmail = '';
        try {
          const customer = typeof customerId === 'string' 
            ? await stripe.customers.retrieve(customerId)
            : null;
          if (customer && !customer.deleted && 'email' in customer) {
            customerEmail = customer.email || '';
          }
        } catch (e) {
          // Customer might be deleted
        }
        
        subscriptionDetails.push({
          id: subscription.id,
          status: subscription.status,
          customerEmail,
          amount: amount / 100,
          interval: price.recurring?.interval || 'unknown',
          createdAt: subscription.created,
          currentPeriodEnd: subscription.current_period_end,
        });
        
        if (subscription.status === 'active' || subscription.status === 'trialing') {
          activeSubs++;
          
          if (price.recurring?.interval === 'month') {
            mrr += amount / 100;
          } else if (price.recurring?.interval === 'year') {
            arr += amount / 100;
            mrr += (amount / 100) / 12;
          }
        }

        if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
          failedPayments++;
          pastDue++;
        }

        if (subscription.status === 'canceled') {
          canceled++;
        }
      } catch (priceError) {
        console.error('Error retrieving price:', priceError);
      }
    }

    // Get all invoices for total revenue
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

    let totalRevenue = 0;
    for (const invoice of allInvoices) {
      const inv = invoice as any;
      totalRevenue += inv.amount_paid / 100;
    }

    const result = {
      totalRevenue,
      monthlyRecurringRevenue: mrr,
      annualRecurringRevenue: arr,
      activeSubscriptions: activeSubs,
      paymentFailures: failedPayments,
      pastDueSubscriptions: pastDue,
      canceledSubscriptions: canceled,
      subscriptionDetails: subscriptionDetails.slice(0, 50),
    };

    metricsCache.set(cacheKey, result, CACHE_TTL.stripeData);
    return result;
  } catch (stripeError) {
    console.warn('Stripe data unavailable:', stripeError instanceof Error ? stripeError.message : 'Stripe not configured');
    return defaultRevenue;
  }
}

export async function getAllTimeProductMetrics() {
  const totalProjects = await Project.countDocuments();
  const completedProjects = await Project.countDocuments({ status: 'completed' });
  
  const completionRate = totalProjects > 0 
    ? ((completedProjects / totalProjects) * 100)
    : 0;

  const projectsPerUser = await Project.aggregate([
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
  ]);

  const avgProjectsPerUser = projectsPerUser[0]?.avgProjects || 0;
  const usersWithMultipleProjects = projectsPerUser[0]?.usersWithMultiple || 0;

  // Feature adoption
  const projectsWithCitations = await Project.countDocuments({
    citations: { $exists: true, $ne: [] }
  });
  const projectsWithPDFs = await Project.countDocuments({
    pdfs: { $exists: true, $ne: [] }
  });
  const projectsWithPlagiarismChecks = await Project.countDocuments({
    plagiarismChecks: { $exists: true, $ne: [] }
  });
  
  const citationAdoption = totalProjects > 0 
    ? ((projectsWithCitations / totalProjects) * 100)
    : 0;
  const pdfAdoption = totalProjects > 0
    ? ((projectsWithPDFs / totalProjects) * 100)
    : 0;
  const plagiarismAdoption = totalProjects > 0
    ? ((projectsWithPlagiarismChecks / totalProjects) * 100)
    : 0;

  return {
    completionRate,
    avgProjectsPerUser,
    usersWithMultipleProjects,
    citationAdoption,
    pdfAdoption,
    plagiarismAdoption,
  };
}

export async function getAllTimeMonetizationMetrics(totalUsers: number, totalRevenue: number, mrr: number, activeSubs: number) {
  const arpu = totalUsers > 0 && totalRevenue > 0
    ? (totalRevenue / totalUsers)
    : 0;
  const arpuActive = activeSubs > 0
    ? (mrr / activeSubs)
    : 0;

  // Time to conversion
  const User = (await import('@/models/User')).default;
  const convertedUsers = await User.find({
    plan: { $in: ['pro', 'team'] },
    createdAt: { $exists: true },
    stripeSubscriptionId: { $exists: true, $ne: null }
  })
    .select('createdAt updatedAt plan stripeSubscriptionId')
    .sort({ updatedAt: 1 })
    .limit(100)
    .lean();
  
  let avgTimeToConversion = 0;
  if (convertedUsers.length > 0) {
    const conversionTimes = convertedUsers
      .filter((u: any) => u.updatedAt && u.createdAt)
      .map((u: any) => {
        const created = new Date(u.createdAt).getTime();
        const updated = new Date(u.updatedAt).getTime();
        const daysDiff = (updated - created) / (1000 * 60 * 60 * 24);
        return daysDiff;
      })
      .filter((t: number) => t > 0 && t < 365);
    
    if (conversionTimes.length > 0) {
      avgTimeToConversion = conversionTimes.reduce((a: number, b: number) => a + b, 0) / conversionTimes.length;
    }
  }

  return {
    arpu,
    arpuActive,
    avgTimeToConversion,
  };
}

