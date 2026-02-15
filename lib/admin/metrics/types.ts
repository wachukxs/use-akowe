// Types for admin metrics system

export interface DateRange {
  start: Date;
  end: Date;
  startStr: string; // YYYY-MM-DD format for DailyUsage queries
  endStr: string;
  startTimestamp: number; // Unix timestamp for Stripe queries
  endTimestamp: number;
  days: number;
}

// Executive Summary - Current state metrics (always visible, no filter)
export interface ExecutiveSummary {
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  activeSubscriptions: number;
  wau: number; // Weekly active users (rolling 7 days)
  wauChange: number; // Week-over-week % change
  healthStatus?: {
    mongodb: boolean;
    stripe: boolean;
  };
}

// Period Performance - Time-bound metrics (respect date filter)
export interface PeriodPerformance {
  users: {
    newInPeriod: number;
    newLast7Days: number;
    growth: Array<{ _id: string; count: number }>;
  };
  projects: {
    createdInPeriod: number;
    growth: Array<{ _id: string; count: number }>;
  };
  usage: {
    aiWordsInPeriod: number;
    plagiarismChecksInPeriod: number;
    topicFinderSearchesInPeriod: number;
    paraphraseUsesInPeriod: number;
    litReviewAnalysesInPeriod: number;
    growth: Array<{ _id: string; count: number }>;
    topUsersByUsage: Array<{
      userId: string;
      email: string;
      name: string;
      plan: string;
      totalAIWords: number;
      totalPlagiarismChecks: number;
      totalTopicFinderSearches: number;
      totalParaphraseUses: number;
      totalLitReviewAnalyses: number;
    }>;
  };
  revenue: {
    revenueInPeriod: number;
    revenueLast7Days: number;
    growth: Array<{ _id: string; count: number }>;
  };
  engagement: {
    activeUsers: number; // Users active in the period
    avgActiveDays: number; // Average active days per user in period
    powerUsers: number; // Users active 5+ days in period
    consistentUsers: number; // Users active 3+ days in period
  };
}

// Business Metrics - Mix of current state and all-time
export interface BusinessMetrics {
  revenue: {
    totalRevenue: number; // All-time
    monthlyRecurringRevenue: number; // Current
    annualRecurringRevenue: number; // Current
    activeSubscriptions: number; // Current
    paymentFailures: number; // Current
    pastDueSubscriptions: number; // Current
    canceledSubscriptions: number; // All-time
  };
  users: {
    total: number; // All-time
    free: number; // All-time
    pro: number; // All-time
    team: number; // All-time
    withSubscriptions: number; // All-time
    conversionRate: number; // All-time (calculated)
  };
  monetization: {
    arpu: number; // All-time ARPU
    arpuActive: number; // Current ARPU for active subscribers
    avgTimeToConversion: number; // All-time
  };
}

// Core Metrics - Key metrics for academic writing product health
export interface CoreMetrics {
  wau: number; // Weekly Active Users (rolling 7 days)
  wauChange: number; // Week-over-week % change
  activationRate: number; // % of users who reached activation
  activationTotal: number; // Total tracked users
  activationActivated: number; // Users who activated
  avgTimeToActivation: number | null; // Minutes
  week1Retention: number; // % of cohort active 7-14 days after signup
  week1CohortSize: number; // Size of the cohort measured
  week4Retention: number; // % of cohort active 21-28 days after signup
  week4CohortSize: number; // Size of the cohort measured
  projectsCompleted: number; // Projects completed in last 7 days
  projectsCompletedChange: number; // WoW change %
  wordsPerActiveDay: number; // Total AI words / total active user-days (7d)
  wowRetention: number; // % of last week's WAU who returned this week
}

// Product Health - Period metrics (respects date filter)
export interface ProductHealth {
  completionRate: number;
  avgProjectsPerUser: number;
  usersWithMultipleProjects: number;
  citationAdoption: number;
  pdfAdoption: number;
  plagiarismAdoption: number;
  litReviewAdoption: number;
  projects: {
    total: number;
    active: number;
    completed: number;
  };
}

// Retention Metrics - Fixed windows with cohort-based retention
export interface RetentionMetrics {
  churnRate: number;
  churnedUsers: number;
  week1Retention: number;
  week1CohortSize: number;
  week4Retention: number;
  week4CohortSize: number;
  wowRetention: number; // % of last week's active users who are active this week
}

// Detailed Lists - Searchable data
export interface DetailedLists {
  recentUsers: Array<{
    _id: string;
    name: string;
    email: string;
    plan: string;
    createdAt: string;
    stripeSubscriptionId?: string;
    totalAIWords?: number;
    totalPlagiarismChecks?: number;
    totalTopicFinderSearches?: number;
    totalLitReviewAnalyses?: number;
    activeDays?: number;
  }>;
  topUsersByUsage: Array<{
    userId: string;
    email: string;
    name: string;
    plan: string;
    totalAIWords: number;
    totalPlagiarismChecks: number;
    totalTopicFinderSearches: number;
    totalLitReviewAnalyses: number;
  }>;
  subscriptionDetails: Array<{
    id: string;
    status: string;
    customerEmail: string;
    amount: number;
    interval: string;
    createdAt: number;
    currentPeriodEnd: number;
  }>;
}

export interface ComparisonMetrics {
  previousPeriod: {
    newUsers: number;
    projectsCreated: number;
    aiWords: number;
    plagiarismChecks: number;
    topicFinderSearches: number;
    litReviewAnalyses: number;
    revenue: number;
  };
  changes: {
    newUsers: number;
    projectsCreated: number;
    aiWords: number;
    plagiarismChecks: number;
    topicFinderSearches: number;
    litReviewAnalyses: number;
    revenue: number;
  };
}

export interface AdminMetricsResponse {
  executiveSummary: ExecutiveSummary;
  periodPerformance: PeriodPerformance;
  businessMetrics: BusinessMetrics;
  coreMetrics: CoreMetrics;
  productHealth: ProductHealth;
  retention: RetentionMetrics;
  detailedLists: DetailedLists;
  comparisons: ComparisonMetrics;
  dateRange: {
    days: number;
    start: string;
    end: string;
  };
  timeContexts: {
    executiveSummary: 'current';
    periodPerformance: 'period';
    businessMetrics: 'mixed';
    coreMetrics: 'fixed-window';
    productHealth: 'period';
    retention: 'fixed-window';
  };
}

