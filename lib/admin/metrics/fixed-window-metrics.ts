// Fixed window metrics (DAU/MAU, churn) - adapt based on period context

import DailyUsage from '@/models/DailyUsage';
import { getEngagementDateRanges, getChurnDateRanges } from './date-utils';

export async function getFixedWindowEngagementMetrics(periodDays: number) {
  const ranges = getEngagementDateRanges(periodDays);
  
  // DAU: Users active in DAU range
  const dailyActiveUsers = await DailyUsage.distinct('userId', {
    date: { $gte: ranges.dau.startStr, $lte: ranges.dau.endStr }
  });
  
  // MAU: Users active in MAU range
  const monthlyActiveUsers = await DailyUsage.distinct('userId', {
    date: { $gte: ranges.mau.startStr, $lte: ranges.mau.endStr }
  });
  
  const dau = dailyActiveUsers.length;
  const mau = monthlyActiveUsers.length;
  const stickiness = mau > 0 ? ((dau / mau) * 100) : 0;

  return {
    dau,
    mau,
    stickiness,
  };
}

export async function getFixedWindowRetentionMetrics(periodDays: number) {
  const ranges = getChurnDateRanges(periodDays);
  
  // Users who were active in the cohort period (30-60 days ago, or adapted)
  const usersActiveInCohort = await DailyUsage.distinct('userId', {
    date: { 
      $gte: ranges.cohortStart.startStr,
      $lt: ranges.cohortEnd.endStr
    }
  });
  
  // Of those users, which are still active in current period
  const usersStillActive = await DailyUsage.distinct('userId', {
    userId: { $in: usersActiveInCohort },
    date: { $gte: ranges.currentStart.startStr }
  });
  
  const churnedUsers = usersActiveInCohort.length - usersStillActive.length;
  const churnRate = usersActiveInCohort.length > 0
    ? ((churnedUsers / usersActiveInCohort.length) * 100)
    : 0;

  return {
    churnRate,
    churnedUsers,
  };
}

