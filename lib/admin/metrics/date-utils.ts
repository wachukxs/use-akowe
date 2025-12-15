// Date utility functions for metrics calculations

import { DateRange } from './types';

/**
 * Creates a date range for the specified number of days
 */
export function createDateRange(days: number): DateRange {
  const end = new Date();
  end.setHours(23, 59, 59, 999); // End of today
  
  const start = new Date();
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0); // Start of day
  
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
 * Creates a date range for the previous period (same length as current period)
 */
export function createPreviousPeriodRange(currentRange: DateRange): DateRange {
  const periodLength = currentRange.days;
  const previousEnd = new Date(currentRange.start);
  previousEnd.setMilliseconds(previousEnd.getMilliseconds() - 1); // Just before current period starts
  
  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousStart.getDate() - periodLength);
  previousStart.setHours(0, 0, 0, 0);
  
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
  end.setHours(23, 59, 59, 999);
  
  const start = new Date();
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);
  
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

