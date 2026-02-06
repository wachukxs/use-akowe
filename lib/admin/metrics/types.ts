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
  dau: number; // Daily active users (last 1-2 days)
  mau: number; // Monthly active users (last 30 days)
  stickiness: number; // DAU/MAU ratio
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
    growth: Array<{ _id: string; count: number }>;
    topUsersByUsage: Array<{
      userId: string;
      email: string;
      name: string;
      plan: string;
      totalAIWords: number;
      totalPlagiarismChecks: number;
      totalTopicFinderSearches: number;
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

// Engagement Metrics - Adaptive windows based on context
export interface EngagementMetrics {
  dau: number; // Daily active users (last 1-2 days)
  mau: number; // Monthly active users (last 30 days or period if > 30)
  stickiness: number; // DAU/MAU ratio
  powerUsers: number; // Users active 5+ days in period
  consistentUsers: number; // Users active 3+ days in period
  avgActiveDays: number; // Average active days per user
}

// Product Health - Period metrics (respects date filter)
export interface ProductHealth {
  completionRate: number;
  avgProjectsPerUser: number;
  usersWithMultipleProjects: number;
  citationAdoption: number;
  pdfAdoption: number;
  plagiarismAdoption: number;
  projects: {
    total: number;
    active: number;
    completed: number;
  };
}

// Retention Metrics - Fixed windows
export interface RetentionMetrics {
  churnRate: number;
  churnedUsers: number;
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
    revenue: number;
  };
  changes: {
    newUsers: number;
    projectsCreated: number;
    aiWords: number;
    plagiarismChecks: number;
    topicFinderSearches: number;
    revenue: number;
  };
}

export interface AdminMetricsResponse {
  executiveSummary: ExecutiveSummary;
  periodPerformance: PeriodPerformance;
  businessMetrics: BusinessMetrics;
  engagement: EngagementMetrics;
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
    engagement: 'adaptive';
    productHealth: 'period'; // Now respects date filter
    retention: 'fixed-window';
  };
}

