// Date utility functions for metrics calculations

import { DateRange } from './types';
import User from '@/models/User';
import Project from '@/models/Project';
import DailyUsage from '@/models/DailyUsage';

/**
 * Creates a date range for the specified number of days
 * If days is 0 and earliestDate is provided, creates range from earliestDate to now (all time)
 * If days is 0 and earliestDate is not provided, falls back to a default (should not happen in practice)
 */
export function createDateRange(days: number, earliestDate?: Date): DateRange {
  const end = new Date();
  end.setUTCHours(23, 59, 59, 999); // End of today (UTC)
  
  let start: Date;
  let actualDays: number;
  
  if (days === 0) {
    // All time: from earliest date to now
    if (earliestDate) {
      start = new Date(earliestDate);
    } else {
      // Fallback: use a very old date (should not happen if getEarliestDataDate is called)
      start = new Date('2020-01-01T00:00:00.000Z');
    }
    start.setUTCHours(0, 0, 0, 0);
    actualDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  } else {
    start = new Date();
    start.setUTCDate(start.getUTCDate() - days);
    start.setUTCHours(0, 0, 0, 0);
    actualDays = days;
  }
  
  return {
    start,
    end,
    startStr: start.toISOString().split('T')[0],
    endStr: end.toISOString().split('T')[0],
    startTimestamp: Math.floor(start.getTime() / 1000),
    endTimestamp: Math.floor(end.getTime() / 1000),
    days: actualDays,
  };
}

/**
 * Gets the earliest date from User, Project, and DailyUsage collections
 * This represents when the first data was created in the system
 */
export async function getEarliestDataDate(): Promise<Date> {
  // Get earliest dates from all three collections in parallel
  const [earliestUser, earliestProject, earliestUsage] = await Promise.all([
    User.findOne().sort({ createdAt: 1 }).select('createdAt').lean(),
    Project.findOne().sort({ createdAt: 1 }).select('createdAt').lean(),
    DailyUsage.findOne().sort({ date: 1 }).select('date').lean(),
  ]);

  const dates: Date[] = [];

  if (earliestUser?.createdAt) {
    dates.push(new Date(earliestUser.createdAt));
  }
  if (earliestProject?.createdAt) {
    dates.push(new Date(earliestProject.createdAt));
  }
  if (earliestUsage?.date) {
    // DailyUsage.date is a string (YYYY-MM-DD format) - parse as UTC to avoid timezone issues
    const dateStr = earliestUsage.date as string;
    dates.push(new Date(dateStr + 'T00:00:00.000Z'));
  }

  if (dates.length === 0) {
    // No data exists, return current date as fallback
    const now = new Date();
    now.setUTCHours(0, 0, 0, 0);
    return now;
  }

  // Return the earliest date (all dates are now normalized to UTC midnight)
  const earliest = new Date(Math.min(...dates.map(d => d.getTime())));
  earliest.setUTCHours(0, 0, 0, 0);
  return earliest;
}

/**
 * Creates a date range for the previous period (same length as current period)
 */
export function createPreviousPeriodRange(currentRange: DateRange): DateRange {
  const periodLength = currentRange.days;
  const previousEnd = new Date(currentRange.start);
  previousEnd.setMilliseconds(previousEnd.getMilliseconds() - 1); // Just before current period starts
  
  const previousStart = new Date(previousEnd);
  previousStart.setUTCDate(previousStart.getUTCDate() - periodLength);
  previousStart.setUTCHours(0, 0, 0, 0);
  
  return {
    start: previousStart,
    end: previousEnd,
    startStr: previousStart.toISOString().split('T')[0],
    endStr: previousEnd.toISOString().split('T')[0],
    startTimestamp: Math.floor(previousStart.getTime() / 1000),
    endTimestamp: Math.floor(previousEnd.getTime() / 1000),
    days: periodLength,
  };
}

/**
 * Creates a date range for the last N days (for fixed window metrics)
 */
export function createLastNDaysRange(days: number): DateRange {
  const end = new Date();
  end.setUTCHours(23, 59, 59, 999);
  
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - days);
  start.setUTCHours(0, 0, 0, 0);
  
  return {
    start,
    end,
    startStr: start.toISOString().split('T')[0],
    endStr: end.toISOString().split('T')[0],
    startTimestamp: Math.floor(start.getTime() / 1000),
    endTimestamp: Math.floor(end.getTime() / 1000),
    days,
  };
}

/**
 * Gets DAU/MAU date ranges based on the selected period
 * - DAU: Last 1-2 days (or period if period < 7 days)
 * - MAU: Last 30 days (or period if period > 30 days)
 */
export function getEngagementDateRanges(periodDays: number): {
  dau: DateRange;
  mau: DateRange;
} {
  // For DAU: use last 2 days if period is short, otherwise use period
  const dauDays = periodDays < 7 ? 2 : Math.min(periodDays, 7);
  
  // For MAU: use 30 days standard, but if period is longer, use period
  const mauDays = periodDays > 30 ? periodDays : 30;
  
  return {
    dau: createLastNDaysRange(dauDays),
    mau: createLastNDaysRange(mauDays),
  };
}

/**
 * Gets churn calculation date ranges
 * Churn needs a lookback period and a current period
 */
export function getChurnDateRanges(periodDays: number): {
  cohortStart: DateRange; // Users who were active in this period
  cohortEnd: DateRange; // End of cohort period
  currentStart: DateRange; // Current period to check if they're still active
} {
  // For churn: look at users active 30-60 days ago, check if they're active now
  // But adapt based on period length
  const lookbackStart = periodDays > 60 ? periodDays * 2 : 60;
  const lookbackEnd = periodDays > 30 ? periodDays : 30;
  
  const cohortEnd = createLastNDaysRange(lookbackEnd);
  const cohortStart = createLastNDaysRange(lookbackStart);
  const currentStart = createLastNDaysRange(periodDays);
  
  return {
    cohortStart,
    cohortEnd,
    currentStart,
  };
}

