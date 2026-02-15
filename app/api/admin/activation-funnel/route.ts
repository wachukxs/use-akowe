import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Activation from '@/models/Activation';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '0');

    // Date filter: 0 = all-time
    const userDateFilter = days > 0
      ? { createdAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) } }
      : {};

    // Step 1: Total signups in period
    const totalSignups = await User.countDocuments(userDateFilter);

    // For date-filtered queries, get the cohort of user emails first
    // so Activation queries are scoped to the SAME users as step 1
    let activationFilter: Record<string, any> = {};
    if (days > 0) {
      const cohortUsers = await User.find(userDateFilter).select('email').lean();
      const cohortEmails = cohortUsers.map((u) => u.email);
      activationFilter = { userId: { $in: cohortEmails } };
    }

    // Step 2: Users who created their first project (same cohort)
    const withFirstProject = await Activation.countDocuments({
      ...activationFilter,
      firstProjectCreatedAt: { $ne: null },
    });

    // Step 3: Users who generated their first AI output (same cohort)
    const withFirstOutput = await Activation.countDocuments({
      ...activationFilter,
      firstOutputGeneratedAt: { $ne: null },
    });

    // Step 4: Users who subscribed (pro or team)
    const subscribers = await User.countDocuments({
      ...userDateFilter,
      plan: { $in: ['pro', 'team'] },
    });

    // Build funnel steps with drop-off rates
    const steps = [
      { label: 'Signed Up', count: totalSignups },
      { label: 'Created First Project', count: withFirstProject },
      { label: 'Generated First Output', count: withFirstOutput },
      { label: 'Subscribed', count: subscribers },
    ];

    const funnel = steps.map((step, i) => {
      const prev = i === 0 ? step.count : steps[i - 1].count;
      const conversionFromPrev = prev > 0 ? (step.count / prev) * 100 : 0;
      const conversionFromTop = totalSignups > 0 ? (step.count / totalSignups) * 100 : 0;
      const dropOff = i === 0 ? 0 : prev - step.count;
      const dropOffRate = prev > 0 ? (dropOff / prev) * 100 : 0;

      return {
        ...step,
        conversionFromPrev: Math.round(conversionFromPrev * 10) / 10,
        conversionFromTop: Math.round(conversionFromTop * 10) / 10,
        dropOff,
        dropOffRate: Math.round(dropOffRate * 10) / 10,
      };
    });

    // Median time-to-activation for activated users (same cohort)
    const activatedUsers = await Activation.find({
      ...activationFilter,
      isActivated: true,
      timeToActivation: { $ne: null },
    })
      .select('timeToActivation')
      .lean();

    let medianTimeToActivation: number | null = null;
    if (activatedUsers.length > 0) {
      const times = activatedUsers
        .map((u) => u.timeToActivation as number)
        .sort((a, b) => a - b);
      const mid = Math.floor(times.length / 2);
      medianTimeToActivation =
        times.length % 2 === 0
          ? Math.round((times[mid - 1] + times[mid]) / 2)
          : times[mid];
    }

    // Weekly funnel trend (last 8 weeks)
    // Use User.createdAt for weekly grouping, then look up Activation by email cohort per week
    const eightWeeksAgo = new Date(Date.now() - 56 * 24 * 60 * 60 * 1000);

    // Get all users from last 8 weeks with their emails and signup week
    const recentUsers = await User.find({ createdAt: { $gte: eightWeeksAgo } })
      .select('email createdAt plan')
      .lean();

    // Group users by signup week
    const weeklyData = new Map<string, { emails: string[]; signups: number; subscribers: number }>();
    for (const u of recentUsers) {
      const week = getISOWeek(new Date(u.createdAt));
      if (!weeklyData.has(week)) {
        weeklyData.set(week, { emails: [], signups: 0, subscribers: 0 });
      }
      const data = weeklyData.get(week)!;
      data.emails.push(u.email);
      data.signups++;
      if (u.plan === 'pro' || u.plan === 'team') data.subscribers++;
    }

    // Get all Activation records for these users
    const allRecentEmails = recentUsers.map((u) => u.email);
    const recentActivations = await Activation.find({
      userId: { $in: allRecentEmails },
    })
      .select('userId firstProjectCreatedAt firstOutputGeneratedAt')
      .lean();

    const activationByEmail = new Map<string, any>();
    for (const a of recentActivations) {
      activationByEmail.set(a.userId, a);
    }

    // Build weekly trend from grouped data
    const weeklyTrend = Array.from(weeklyData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, data]) => {
        let firstProject = 0;
        let firstOutput = 0;
        for (const email of data.emails) {
          const activation = activationByEmail.get(email);
          if (activation?.firstProjectCreatedAt) firstProject++;
          if (activation?.firstOutputGeneratedAt) firstOutput++;
        }
        return {
          week,
          signups: data.signups,
          firstProject,
          firstOutput,
          subscribed: data.subscribers,
        };
      });

    return NextResponse.json({
      funnel,
      medianTimeToActivation,
      weeklyTrend,
    });
  } catch (error) {
    console.error('Error fetching activation funnel data:', error);
    return NextResponse.json({ error: 'Failed to fetch funnel data' }, { status: 500 });
  }
}

/** Returns ISO week string like "2025-W03" */
function getISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}
