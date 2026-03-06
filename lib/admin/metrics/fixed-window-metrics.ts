// Fixed window metrics - WAU, activation, cohort retention, words per active day

import DailyUsage from '@/models/DailyUsage';
import User from '@/models/User';
import Project from '@/models/Project';
import Activation from '@/models/Activation';
import { DateRange } from './types';
import { getChurnDateRanges, createPreviousPeriodRange } from './date-utils';

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

export async function getFixedWindowCoreMetrics(dateRange: DateRange) {
  const now = new Date();
  now.setUTCHours(23, 59, 59, 999);

  // --- WAU: exactly last 7 days (fixed) ---
  // [today - 6, today] inclusive = 7 days
  const sixDaysAgo = new Date();
  sixDaysAgo.setUTCDate(sixDaysAgo.getUTCDate() - 6);
  sixDaysAgo.setUTCHours(0, 0, 0, 0);
  const wauStartStr = toDateStr(sixDaysAgo);
  const wauEndStr = toDateStr(now);

  // --- Previous week for WoW comparison (fixed) ---
  // [today - 13, today - 7] inclusive = 7 days (symmetric with current WAU)
  const thirteenDaysAgo = new Date();
  thirteenDaysAgo.setUTCDate(thirteenDaysAgo.getUTCDate() - 13);
  thirteenDaysAgo.setUTCHours(0, 0, 0, 0);
  const prevEnd = new Date(sixDaysAgo);
  prevEnd.setUTCDate(prevEnd.getUTCDate() - 1);
  const prevWauStartStr = toDateStr(thirteenDaysAgo);
  const prevWauEndStr = toDateStr(prevEnd);

  // --- MAU: exactly last 30 days (fixed) ---
  // [today - 29, today] inclusive = 30 days
  const twentyNineDaysAgo = new Date();
  twentyNineDaysAgo.setUTCDate(twentyNineDaysAgo.getUTCDate() - 29);
  twentyNineDaysAgo.setUTCHours(0, 0, 0, 0);
  const mauStartStr = toDateStr(twentyNineDaysAgo);
  const mauEndStr = toDateStr(now);

  // --- Date-filtered metrics use the selected period ---
  const periodDateFilter = {
    createdAt: { $gte: dateRange.start, $lte: dateRange.end },
  };
  const prevRange = createPreviousPeriodRange(dateRange);

  // Run all queries in parallel
  const [
    thisWeekUsers,
    lastWeekUsers,
    mauUsers,
    // Activation: scoped to date filter
    totalUsers,
    activationActivated,
    activatedRecords,
    // Words per Active Day: scoped to date filter
    wordsAgg,
    // Projects Completed: scoped to date filter
    projectsCompleted,
    prevProjectsCompleted,
  ] = await Promise.all([
    // WAU (fixed)
    DailyUsage.distinct('userId', {
      date: { $gte: wauStartStr, $lte: wauEndStr },
    }),
    // Previous WAU (fixed)
    DailyUsage.distinct('userId', {
      date: { $gte: prevWauStartStr, $lte: prevWauEndStr },
    }),
    // MAU (fixed - exactly 30 days)
    DailyUsage.distinct('userId', {
      date: { $gte: mauStartStr, $lte: mauEndStr },
    }),
    // Activation: users who signed up in the selected period
    User.countDocuments(periodDateFilter),
    // Activation: users who generated first output AND signed up in the period
    Activation.countDocuments({
      ...periodDateFilter,
      firstOutputGeneratedAt: { $ne: null },
    }),
    // Avg time to activation (all-time, for reference)
    Activation.find({ isActivated: true, timeToActivation: { $ne: null } })
      .select('timeToActivation')
      .lean(),
    // Words per Active Day: scoped to selected period
    DailyUsage.aggregate([
      {
        $match: {
          date: { $gte: dateRange.startStr, $lte: dateRange.endStr },
        },
      },
      {
        $group: {
          _id: null,
          totalWords: { $sum: '$aiWordsGenerated' },
          totalUserDays: { $sum: 1 },
        },
      },
    ]),
    // Projects completed in selected period
    Project.countDocuments({
      status: 'completed',
      updatedAt: { $gte: dateRange.start, $lte: dateRange.end },
    }),
    // Projects completed in previous period (for comparison)
    Project.countDocuments({
      status: 'completed',
      updatedAt: { $gte: prevRange.start, $lte: prevRange.end },
    }),
  ]);

  const mau = mauUsers.length;
  const activationTotal = totalUsers;

  const wau = thisWeekUsers.length;
  const lastWeekWau = lastWeekUsers.length;
  const wauChange =
    lastWeekWau > 0 ? ((wau - lastWeekWau) / lastWeekWau) * 100 : 0;

  // WoW Retention: % of last week's users who returned this week (fixed)
  const lastWeekUserSet = new Set(lastWeekUsers.map(String));
  const thisWeekUserSet = new Set(thisWeekUsers.map(String));
  let returnedCount = 0;
  for (const uid of lastWeekUserSet) {
    if (thisWeekUserSet.has(uid)) returnedCount++;
  }
  const wowRetention =
    lastWeekWau > 0 ? (returnedCount / lastWeekWau) * 100 : 0;

  // Activation Rate (scoped to date filter)
  const activationRate =
    activationTotal > 0 ? (activationActivated / activationTotal) * 100 : 0;
  const avgTimeToActivation =
    activatedRecords.length > 0
      ? activatedRecords.reduce(
          (sum: number, r: { timeToActivation?: number | null }) =>
            sum + (r.timeToActivation || 0),
          0
        ) / activatedRecords.length
      : null;

  // Words per Active Day (scoped to date filter)
  const totalWords = wordsAgg[0]?.totalWords || 0;
  const totalUserDays = wordsAgg[0]?.totalUserDays || 0;
  const wordsPerActiveDay = totalUserDays > 0 ? totalWords / totalUserDays : 0;

  // Projects completed change vs previous period
  const projectsCompletedChange =
    prevProjectsCompleted > 0
      ? ((projectsCompleted - prevProjectsCompleted) / prevProjectsCompleted) *
        100
      : 0;

  return {
    wau,
    wauChange,
    mau,
    activationRate,
    activationTotal,
    activationActivated,
    avgTimeToActivation,
    wordsPerActiveDay,
    projectsCompleted,
    projectsCompletedChange,
    wowRetention,
  };
}

export async function getFixedWindowRetentionMetrics(periodDays: number) {
  const ranges = getChurnDateRanges(periodDays);

  // --- Existing churn logic ---
  const usersActiveInCohort = await DailyUsage.distinct('userId', {
    date: {
      $gte: ranges.cohortStart.startStr,
      $lt: ranges.cohortEnd.endStr,
    },
  });

  const usersStillActive = await DailyUsage.distinct('userId', {
    userId: { $in: usersActiveInCohort },
    date: { $gte: ranges.currentStart.startStr },
  });

  const churnedUsers = usersActiveInCohort.length - usersStillActive.length;
  const churnRate =
    usersActiveInCohort.length > 0
      ? (churnedUsers / usersActiveInCohort.length) * 100
      : 0;

  // --- Week 1 & Week 4 Retention (cohort-based, same cohort) ---
  // Use users who signed up at least 35 days ago so both their week 1 (days 7-14)
  // and week 4 (days 21-28) windows have fully elapsed.
  // Both metrics must use the SAME cohort so they form a meaningful retention curve.
  const now = new Date();
  // cohortCutoff: at least 35 days old so week 1 (days 7-14) and week 4 (days 21-28) windows have elapsed
  // cohortStart: cap at 180 days old — avoids old churned users permanently dragging retention down
  const cohortCutoff = new Date(now);
  cohortCutoff.setUTCDate(now.getUTCDate() - 35);
  cohortCutoff.setUTCHours(0, 0, 0, 0);

  const cohortStart = new Date(now);
  cohortStart.setUTCDate(now.getUTCDate() - 180);
  cohortStart.setUTCHours(0, 0, 0, 0);

  const cohortUsers = await User.find({
    createdAt: { $gte: cohortStart, $lt: cohortCutoff },
  })
    .select('_id createdAt')
    .lean();

  // Calculate both retention windows against the same cohort
  const [week1Retention, week4Retention] = await Promise.all([
    calculateCohortRetention(cohortUsers, 7, 14),
    calculateCohortRetention(cohortUsers, 21, 28),
  ]);

  return {
    churnRate,
    churnedUsers,
    week1Retention: week1Retention.rate,
    week1CohortSize: week1Retention.cohortSize,
    week4Retention: week4Retention.rate,
    week4CohortSize: week4Retention.cohortSize,
    wowRetention: 0, // Populated from core metrics in orchestrator
  };
}

/**
 * Calculate cohort retention using batch queries for performance.
 * For each user in the cohort, checks if they had activity between
 * dayStart and dayEnd days after their signup date.
 */
async function calculateCohortRetention(
  cohortUsers: Array<{ _id: unknown; createdAt: Date }>,
  dayStart: number,
  dayEnd: number
): Promise<{ rate: number; cohortSize: number }> {
  if (cohortUsers.length === 0) {
    return { rate: 0, cohortSize: 0 };
  }

  // Build per-user activity windows
  const userWindows = new Map<
    string,
    { startStr: string; endStr: string }
  >();
  let earliestStart = '';
  let latestEnd = '';

  for (const user of cohortUsers) {
    const userId = user._id!.toString();
    const signup = new Date(user.createdAt);

    const windowStart = new Date(signup);
    windowStart.setUTCDate(signup.getUTCDate() + dayStart);
    const windowEnd = new Date(signup);
    windowEnd.setUTCDate(signup.getUTCDate() + dayEnd);

    const startStr = toDateStr(windowStart);
    const endStr = toDateStr(windowEnd);

    userWindows.set(userId, { startStr, endStr });

    if (!earliestStart || startStr < earliestStart) earliestStart = startStr;
    if (!latestEnd || endStr > latestEnd) latestEnd = endStr;
  }

  // Single batch query for all users' activity in the overall window
  const userIds = cohortUsers.map((u) => u._id!.toString());
  const allActivity = await DailyUsage.find({
    userId: { $in: userIds },
    date: { $gte: earliestStart, $lte: latestEnd },
  })
    .select('userId date')
    .lean();

  // Check each record against the user's personal retention window
  const retainedSet = new Set<string>();
  for (const record of allActivity) {
    const window = userWindows.get(record.userId);
    if (
      window &&
      record.date >= window.startStr &&
      record.date <= window.endStr
    ) {
      retainedSet.add(record.userId);
    }
  }

  const rate =
    cohortUsers.length > 0
      ? (retainedSet.size / cohortUsers.length) * 100
      : 0;

  return { rate, cohortSize: cohortUsers.length };
}
