import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Project from '@/models/Project';
import DailyUsage from '@/models/DailyUsage';
import Stripe from 'stripe';
import mongoose from 'mongoose';

// Conditionally initialize Stripe only if API key is available
function getStripeClient() {
  // Try multiple possible env var names (common variations)
  // Priority: Check STRIPE_SECRET_KEY first (most common), then environment-specific ones
  let stripeKey: string | undefined;
  
  // First check the generic key (most common)
  if (process.env.STRIPE_SECRET_KEY) {
    stripeKey = process.env.STRIPE_SECRET_KEY;
  } else if (process.env.NODE_ENV === 'production') {
    // Production-specific keys
    stripeKey = process.env.STRIPE_SECRET_KEY_PROD_V2 || 
                process.env.STRIPE_SECRET_KEY_PROD;
  } else {
    // Development/test-specific keys
    stripeKey = process.env.STRIPE_SECRET_KEY_TEST || 
                process.env.STRIPE_SECRET_KEY_DEV;
  }
  
  if (!stripeKey) {
    console.warn('Stripe API key not found. Checked:', [
      'STRIPE_SECRET_KEY',
      'STRIPE_SECRET_KEY_PROD_V2',
      'STRIPE_SECRET_KEY_PROD', 
      'STRIPE_SECRET_KEY_TEST',
      'STRIPE_SECRET_KEY_DEV'
    ]);
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

// Get valid price IDs for THIS product only
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

export async function GET(request: Request) {
  try {
    // MongoDB connection is REQUIRED - fail if not available
    await connectDB();

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days');
    const days = daysParam ? parseInt(daysParam, 10) : 30;
    
    // Validate days parameter
    const validDays = Math.max(1, Math.min(365, days)); // Between 1 and 365 days

    // Get valid price IDs for THIS product only
    const validPriceIds = getValidPriceIds();

    // Get user statistics
    const totalUsers = await User.countDocuments();
    const freeUsers = await User.countDocuments({ plan: 'free' });
    const proUsers = await User.countDocuments({ plan: 'pro' });
    const teamUsers = await User.countDocuments({ plan: 'team' });
    
    // Get users with Stripe subscriptions
    const usersWithSubscriptions = await User.countDocuments({ 
      stripeSubscriptionId: { $exists: true, $ne: null } 
    });

    // Get new users in the last N days (from filter)
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - validDays);
    const newUsersInPeriod = await User.countDocuments({
      createdAt: { $gte: periodStart }
    });

    // Get new users in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newUsersLast7Days = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    // Get user list (recent users)
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .select('name email plan createdAt stripeSubscriptionId')
      .lean();

    // Get project statistics
    const totalProjects = await Project.countDocuments();
    const activeProjects = await Project.countDocuments({ status: { $in: ['draft', 'in_progress'] } });
    const completedProjects = await Project.countDocuments({ status: 'completed' });
    
    // Get projects created in the selected period
    const projectsInPeriod = await Project.countDocuments({
      createdAt: { $gte: periodStart }
    });

    // Get usage statistics
    const totalUsage = await DailyUsage.aggregate([
      {
        $group: {
          _id: null,
          totalAIWords: { $sum: '$aiWordsGenerated' },
          totalPlagiarismChecks: { $sum: '$plagiarismChecks' }
        }
      }
    ]);

    const usageStats = totalUsage[0] || { totalAIWords: 0, totalPlagiarismChecks: 0 };

    // Get usage for last N days (from filter)
    const usageInPeriod = await DailyUsage.aggregate([
      {
        $match: {
          createdAt: { $gte: periodStart }
        }
      },
      {
        $group: {
          _id: null,
          totalAIWords: { $sum: '$aiWordsGenerated' },
          totalPlagiarismChecks: { $sum: '$plagiarismChecks' }
        }
      }
    ]);

    const usagePeriod = usageInPeriod[0] || { totalAIWords: 0, totalPlagiarismChecks: 0 };

    // Get usage by user (top users) with user details
    // First get top users by usage
    const topUsersAggregation = await DailyUsage.aggregate([
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
    ]);

    // Then fetch user details for each
    // Note: DailyUsage.userId is stored as String (user._id.toString())
    // So we need to convert it back to ObjectId for User.findById()
    const topUsersByUsage = await Promise.all(
      topUsersAggregation.map(async (usage) => {
        try {
          let user;
          
          // Try as ObjectId first (if it's a valid ObjectId string)
          if (mongoose.Types.ObjectId.isValid(usage._id)) {
            user = await User.findById(new mongoose.Types.ObjectId(usage._id))
              .select('email name plan')
              .lean();
          } else {
            // If not valid ObjectId, try finding by _id as string
            user = await User.findOne({ _id: usage._id })
              .select('email name plan')
              .lean();
          }
          
          return {
            userId: usage._id,
            email: user?.email || 'Unknown',
            name: user?.name || 'Unknown',
            plan: user?.plan || 'free',
            totalAIWords: usage.totalAIWords,
            totalPlagiarismChecks: usage.totalPlagiarismChecks,
          };
        } catch (error) {
          console.error(`Error fetching user ${usage._id}:`, error);
          return {
            userId: usage._id,
            email: 'Unknown',
            name: 'Unknown',
            plan: 'free',
            totalAIWords: usage.totalAIWords,
            totalPlagiarismChecks: usage.totalPlagiarismChecks,
          };
        }
      })
    );

    // Get revenue and payment information from Stripe
    let revenueData = {
      totalRevenue: 0,
      monthlyRecurringRevenue: 0,
      annualRecurringRevenue: 0,
      activeSubscriptions: 0,
      paymentFailures: 0,
      pastDueSubscriptions: 0,
      canceledSubscriptions: 0,
      revenueLast30Days: 0,
      revenueLast7Days: 0,
      subscriptionDetails: [] as any[],
    };

    const stripe = getStripeClient();
    let revenueInPeriod = 0;
    
    try {
      
      if (!stripe) {
        throw new Error('Stripe not configured');
      }

      // Get ALL subscriptions with pagination (only for THIS product)
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
        
        // Filter to only include subscriptions for THIS product's price IDs
        const filteredSubs = subscriptions.data.filter(sub => {
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

      // Calculate MRR/ARR and subscription statuses (ONLY for THIS product)
      for (const subscription of allSubscriptions) {
        const priceId = subscription.items.data[0]?.price?.id;
        
        // Double-check it's for our product
        if (!priceId || (validPriceIds.length > 0 && !validPriceIds.includes(priceId))) {
          continue;
        }

        try {
          const price = await stripe.prices.retrieve(priceId);
          const amount = price.unit_amount || 0;
          const customerId = subscription.customer;
          
          // Get customer info
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
          
          const subscriptionDetail = {
            id: subscription.id,
            status: subscription.status,
            customerEmail,
            amount: amount / 100,
            interval: price.recurring?.interval || 'unknown',
            createdAt: subscription.created,
            currentPeriodEnd: subscription.current_period_end,
          };
          
          subscriptionDetails.push(subscriptionDetail);
          
          if (subscription.status === 'active' || subscription.status === 'trialing') {
            activeSubs++;
            
            // Calculate MRR/ARR based on billing interval
            if (price.recurring?.interval === 'month') {
              mrr += amount / 100; // Convert cents to dollars
            } else if (price.recurring?.interval === 'year') {
              arr += amount / 100;
              mrr += (amount / 100) / 12; // Convert annual to monthly
            }
          }

          // Track payment failures
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

      // Get revenue from invoices (more accurate - only for THIS product)
      const periodStartTimestamp = Math.floor(periodStart.getTime() / 1000);
      const sevenDaysAgoTimestamp = Math.floor(sevenDaysAgo.getTime() / 1000);
      const allTimeTimestamp = 0;

      // Get ALL invoices with pagination (filtered by subscription)
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
        
        // Filter invoices to only include those for our product subscriptions
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

      // Calculate revenue from invoices (ONLY for THIS product)
      let totalRevenue = 0;
      let revenueInPeriod = 0;
      let revenue7Days = 0;

      for (const invoice of allInvoices) {
        const inv = invoice as any;
        const amount = inv.amount_paid / 100;
        
        // Total revenue: count ALL successful payments (all time)
        // No condition needed - all invoices in allInvoices are already paid
        totalRevenue += amount;
        
        // Period revenue: count payments in the selected period
        if (inv.created >= periodStartTimestamp) {
          revenueInPeriod += amount;
        }
        
        // Last 7 days: always show last 7 days regardless of filter
        if (inv.created >= sevenDaysAgoTimestamp) {
          revenue7Days += amount;
        }
      }

      revenueData = {
        totalRevenue, // All-time revenue from THIS product only
        monthlyRecurringRevenue: mrr, // Current MRR from active subscriptions
        annualRecurringRevenue: arr, // Current ARR from annual subscriptions
        activeSubscriptions: activeSubs,
        paymentFailures: failedPayments,
        pastDueSubscriptions: pastDue,
        canceledSubscriptions: canceled,
        revenueLast30Days: revenueInPeriod, // Revenue in selected period (filtered)
        revenueLast7Days: revenue7Days, // Always last 7 days
        subscriptionDetails: subscriptionDetails.slice(0, 50), // Limit to 50 most recent
      };
    } catch (stripeError) {
      console.warn('Stripe data unavailable:', stripeError instanceof Error ? stripeError.message : 'Stripe not configured');
      // Continue with zero values if Stripe fails or is not configured
    }

    // Get user growth over time (last N days, daily)
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: periodStart }
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

    // Get project creation over time (last N days, daily)
    const projectGrowth = await Project.aggregate([
      {
        $match: {
          createdAt: { $gte: periodStart }
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

    // ===== NEW METRICS CALCULATIONS =====
    
    // 1. Active Users (DAU/MAU) - Use date field for accurate daily/monthly tracking
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const oneDayAgo = new Date(today);
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    const oneDayAgoStr = oneDayAgo.toISOString().split('T')[0];
    
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
    
    // DAU: Users active today or yesterday (last 24-48 hours)
    const dailyActiveUsers = await DailyUsage.distinct('userId', {
      date: { $gte: oneDayAgoStr }
    });
    
    // MAU: Users active in last 30 days
    const monthlyActiveUsers = await DailyUsage.distinct('userId', {
      date: { $gte: thirtyDaysAgoStr }
    });
    
    const dau = dailyActiveUsers.length;
    const mau = monthlyActiveUsers.length;
    const stickiness = mau > 0 ? ((dau / mau) * 100).toFixed(1) : '0.0';

    // 2. Project Completion Rate
    const completionRate = totalProjects > 0 
      ? ((completedProjects / totalProjects) * 100).toFixed(1)
      : '0.0';

    // 3. Projects per User
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
          maxProjects: { $max: '$projectCount' },
          usersWithMultiple: {
            $sum: { $cond: [{ $gt: ['$projectCount', 1] }, 1, 0] }
          }
        }
      }
    ]);
    const avgProjectsPerUser = projectsPerUser[0]?.avgProjects || 0;
    const usersWithMultipleProjects = projectsPerUser[0]?.usersWithMultiple || 0;

    // 4. Feature Adoption Rates
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
      ? ((projectsWithCitations / totalProjects) * 100).toFixed(1)
      : '0.0';
    const pdfAdoption = totalProjects > 0
      ? ((projectsWithPDFs / totalProjects) * 100).toFixed(1)
      : '0.0';
    const plagiarismAdoption = totalProjects > 0
      ? ((projectsWithPlagiarismChecks / totalProjects) * 100).toFixed(1)
      : '0.0';

    // 5. ARPU (Average Revenue Per User)
    const arpu = totalUsers > 0 && revenueData.totalRevenue > 0
      ? (revenueData.totalRevenue / totalUsers).toFixed(2)
      : '0.00';
    const arpuActive = revenueData.activeSubscriptions > 0
      ? (revenueData.monthlyRecurringRevenue / revenueData.activeSubscriptions).toFixed(2)
      : '0.00';

    // 6. Time to Conversion (users who converted)
    // Note: This is an approximation using updatedAt - createdAt
    // More accurate would require tracking plan change events, but this gives reasonable estimate
    const convertedUsers = await User.find({
      plan: { $in: ['pro', 'team'] },
      createdAt: { $exists: true },
      stripeSubscriptionId: { $exists: true, $ne: null } // Only count users with actual subscriptions
    })
      .select('createdAt updatedAt plan stripeSubscriptionId')
      .sort({ updatedAt: 1 })
      .limit(100)
      .lean();
    
    let avgTimeToConversion = 0;
    if (convertedUsers.length > 0) {
      const conversionTimes = convertedUsers
        .filter(u => u.updatedAt && u.createdAt)
        .map(u => {
          const created = new Date(u.createdAt).getTime();
          const updated = new Date(u.updatedAt).getTime();
          const daysDiff = (updated - created) / (1000 * 60 * 60 * 24); // days
          return daysDiff;
        })
        .filter(t => t > 0 && t < 365); // reasonable range (0-365 days)
      
      if (conversionTimes.length > 0) {
        avgTimeToConversion = conversionTimes.reduce((a, b) => a + b, 0) / conversionTimes.length;
      }
    }

    // 7. Usage Consistency (users active multiple days) - Use date field for accurate day counting
    const usageConsistency = await DailyUsage.aggregate([
      {
        $match: {
          date: { $gte: thirtyDaysAgoStr }
        }
      },
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
    ]);
    const avgActiveDays = usageConsistency[0]?.avgActiveDays || 0;
    const powerUsers = usageConsistency[0]?.powerUsers || 0;
    const consistentUsers = usageConsistency[0]?.consistentUsers || 0;

    // 8. Churn Rate (users inactive for 30+ days) - Use date field for accurate churn tracking
    const sixtyDaysAgo = new Date(today);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const sixtyDaysAgoStr = sixtyDaysAgo.toISOString().split('T')[0];
    
    // Users who were active 30-60 days ago (cohort)
    const usersActive60DaysAgo = await DailyUsage.distinct('userId', {
      date: { 
        $gte: sixtyDaysAgoStr,
        $lt: thirtyDaysAgoStr
      }
    });
    
    // Of those users, which are still active in last 30 days
    const usersStillActive = await DailyUsage.distinct('userId', {
      userId: { $in: usersActive60DaysAgo },
      date: { $gte: thirtyDaysAgoStr }
    });
    
    const churnedUsers = usersActive60DaysAgo.length - usersStillActive.length;
    const churnRate = usersActive60DaysAgo.length > 0
      ? ((churnedUsers / usersActive60DaysAgo.length) * 100).toFixed(1)
      : '0.0';

    // ===== PREVIOUS PERIOD COMPARISONS =====
    // Calculate previous period metrics for trend analysis
    const previousPeriodStart = new Date(periodStart);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - days);
    const previousPeriodEnd = new Date(periodStart);
    
    // Previous period: new users
    const previousNewUsers = await User.countDocuments({
      createdAt: {
        $gte: previousPeriodStart,
        $lt: previousPeriodEnd
      }
    });
    
    // Previous period: projects created
    const previousProjectsCreated = await Project.countDocuments({
      createdAt: {
        $gte: previousPeriodStart,
        $lt: previousPeriodEnd
      }
    });
    
    // Previous period: usage
    const previousUsagePeriod = await DailyUsage.aggregate([
      {
        $match: {
          date: {
            $gte: previousPeriodStart.toISOString().split('T')[0],
            $lt: previousPeriodEnd.toISOString().split('T')[0]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalAIWords: { $sum: '$aiWordsGenerated' },
          totalPlagiarismChecks: { $sum: '$plagiarismChecks' }
        }
      }
    ]);
    const previousAIWords = previousUsagePeriod[0]?.totalAIWords || 0;
    const previousPlagiarismChecks = previousUsagePeriod[0]?.totalPlagiarismChecks || 0;
    
    // Previous period: revenue (from Stripe invoices)
    let previousRevenue = 0;
    if (stripe) {
      const previousInvoices = await stripe.invoices.list({
        limit: 100,
        status: 'paid',
        created: {
          gte: Math.floor(previousPeriodStart.getTime() / 1000),
          lt: Math.floor(previousPeriodEnd.getTime() / 1000)
        }
      });
      
      // Filter to only this product's subscriptions
      const previousProductInvoices = previousInvoices.data.filter((inv: any) => {
        return inv.subscription && 
               validPriceIds.length > 0 &&
               inv.lines?.data?.some((line: any) => 
                 line.price && validPriceIds.includes(line.price.id)
               );
      });
      
      for (const invoice of previousProductInvoices) {
        const inv = invoice as any;
        previousRevenue += inv.amount_paid / 100;
      }
    }
    
    // Calculate percentage changes
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return NextResponse.json({
      users: {
        total: totalUsers,
        free: freeUsers,
        pro: proUsers,
        team: teamUsers,
        withSubscriptions: usersWithSubscriptions,
        newLast30Days: newUsersInPeriod,
        newLast7Days: newUsersLast7Days,
        growth: userGrowth,
        recentUsers: recentUsers,
        topUsersByUsage: topUsersByUsage,
      },
      projects: {
        total: totalProjects,
        active: activeProjects,
        completed: completedProjects,
        createdInPeriod: projectsInPeriod,
        growth: projectGrowth,
      },
      usage: {
        totalAIWords: usageStats.totalAIWords,
        totalPlagiarismChecks: usageStats.totalPlagiarismChecks,
        aiWordsLast30Days: usagePeriod.totalAIWords,
        plagiarismChecksLast30Days: usagePeriod.totalPlagiarismChecks,
        topUsersByUsage: topUsersByUsage,
      },
      revenue: revenueData,
      engagement: {
        dau: dau,
        mau: mau,
        stickiness: parseFloat(stickiness),
        powerUsers: powerUsers,
        consistentUsers: consistentUsers,
        avgActiveDays: parseFloat(avgActiveDays.toFixed(1)),
      },
      product: {
        completionRate: parseFloat(completionRate),
        avgProjectsPerUser: parseFloat(avgProjectsPerUser.toFixed(1)),
        usersWithMultipleProjects: usersWithMultipleProjects,
        citationAdoption: parseFloat(citationAdoption),
        pdfAdoption: parseFloat(pdfAdoption),
        plagiarismAdoption: parseFloat(plagiarismAdoption),
      },
      monetization: {
        arpu: parseFloat(arpu),
        arpuActive: parseFloat(arpuActive),
        avgTimeToConversion: parseFloat(avgTimeToConversion.toFixed(1)),
      },
      retention: {
        churnRate: parseFloat(churnRate),
        churnedUsers: churnedUsers,
      },
      comparisons: {
        previousPeriod: {
          newUsers: previousNewUsers,
          projectsCreated: previousProjectsCreated,
          aiWords: previousAIWords,
          plagiarismChecks: previousPlagiarismChecks,
          revenue: previousRevenue,
        },
        changes: {
          newUsers: calculateChange(newUsersInPeriod, previousNewUsers),
          projectsCreated: calculateChange(projectsInPeriod, previousProjectsCreated),
          aiWords: calculateChange(usagePeriod.totalAIWords, previousAIWords),
          plagiarismChecks: calculateChange(usagePeriod.totalPlagiarismChecks, previousPlagiarismChecks),
          revenue: calculateChange(revenueData.revenueLast30Days, previousRevenue),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching admin metrics:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check if it's a MongoDB connection error
    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('MongoNetworkError')) {
      return NextResponse.json(
        { 
          error: 'MongoDB connection failed',
          message: 'Please ensure MongoDB is running on localhost:27017',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch admin metrics',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
