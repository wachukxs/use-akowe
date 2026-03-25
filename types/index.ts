export type ProjectType = 'essay' | 'thesis' | 'journal' | 'research';
export type ProjectStatus = 'draft' | 'in_progress' | 'completed' | 'archived';
export type PlanType = 'free' | 'standard' | 'pro' | 'team';
export type SectionType = 'introduction' | 'literature_review' | 'methodology' | 'results' | 'discussion' | 'conclusion' | 'custom';

export interface User {
  _id: string;
  name: string;
  email: string;
  image?: string;
  plan: PlanType;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  wisePaymentReference?: string;
  wisePendingPlan?: 'standard' | 'pro';
  wisePendingBillingCycle?: 'monthly' | 'annual';
  wisePendingSku?:
    | 'annual_pro'
    | 'annual_standard'
    | 'monthly_standard'
    | 'monthly_pro';
  paymentProvider?: 'stripe' | 'wise';
  wisePurchaseTransferId?: number;
  wiseRenewalReminderSentAt?: Date | null;
  subscriptionStartDate?: Date | null;
  subscriptionEndDate?: Date | null;
  signupIp?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Section {
  id: string;
  type: SectionType;
  title: string;
  content: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Citation {
  id: string;
  doi?: string;
  title: string;
  authors: string[];
  year?: number;
  journal?: string;
  publisher?: string;
  url?: string;
  citationKey: string;
  citationText: string;
  addedAt: Date;
  source?: 'parsed' | 'manual' | 'discovered';
}

export interface PDF {
  id: string;
  filename: string;
  url: string;
  uploadedAt: Date;
  size: number;
}

export interface PlagiarismCheck {
  checkedAt: Date;
  matchPercentage: number;
  matches: Array<{
    text: string;
    source: string;
    url?: string;
    similarity?: number;
    section?: string;
    suggestion?: string;
  }>;
  sectionAnalysis?: Array<{
    sectionId: string;
    sectionTitle: string;
    matchPercentage: number;
    matches: Array<{
      text: string;
      source: string;
      url?: string;
      similarity?: number;
      section?: string;
      suggestion?: string;
    }>;
    wordCount: number;
  }>;
  analysis?: {
    overusedPhrases: number;
    repetitionIssues: number;
    citationProblems: number;
    aiPatterns: number;
    wordDiversity: number;
    externalMatches: number;
    paraphrasingDetected?: number;
  };
  reportUrl?: string;
}

export interface Project {
  _id: string;
  userId: string;
  name: string;
  type: ProjectType;
  topic: string;
  targetWordCount: number;
  citationStyle: string;
  methodology: string;
  status: ProjectStatus;
  sections: Section[];
  citations: Citation[];
  pdfs: PDF[];
  plagiarismChecks: PlagiarismCheck[];
  wordCount: number;
  lastEditedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyUsage {
  _id: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  aiWordsGenerated: number;
  plagiarismChecks: number;
  topicFinderSearches: number;
  paraphraseUses: number;
  litReviewAnalyses: number;
  createdAt: Date;
  updatedAt: Date;
}

// === Lit Review Assistant Types ===

export interface LitReviewThemePaper {
  citationId: string;
  stance: 'supports' | 'contradicts' | 'discusses';
  reasoning: string;
}

export interface LitReviewTheme {
  id: string;
  name: string;
  description: string;
  papers: LitReviewThemePaper[];
}

export interface LitReviewGap {
  id: string;
  title: string;
  description: string;
  suggestion: string;
  searchQuery?: string;
}

export interface LitReviewAnalysis {
  themes: LitReviewTheme[];
  gaps: LitReviewGap[];
  summary: string;
  analyzedAt: Date;
  citationCount: number;
  citationIds: string[];
}

export interface LitReviewSynthesis {
  paragraph: string;
  wordCount: number;
  citationsUsed: string[];
  sourceThemeId?: string;
  sourceGapId?: string;
}

export interface UsageLimits {
  aiWordsPerDay: number;
  plagiarismChecksPerDay: number;
  plagiarismChecksPerWeek?: number;
  paraphrasePerDay: number;
  litReviewAnalysesPerDay: number;
  maxProjects?: number;
}

export const PLAN_LIMITS: Record<PlanType, UsageLimits> = {
  free: {
    aiWordsPerDay: 500,
    plagiarismChecksPerDay: Infinity,
    plagiarismChecksPerWeek: 1,
    paraphrasePerDay: 2,
    litReviewAnalysesPerDay: 1,
    maxProjects: 1,
  },
  standard: {
    aiWordsPerDay: 2000,
    plagiarismChecksPerDay: 5,
    paraphrasePerDay: 10,
    litReviewAnalysesPerDay: 5,
    maxProjects: 10,
  },
  pro: {
    aiWordsPerDay: Infinity,
    plagiarismChecksPerDay: Infinity,
    paraphrasePerDay: Infinity,
    litReviewAnalysesPerDay: Infinity,
  },
  team: {
    aiWordsPerDay: Infinity,
    plagiarismChecksPerDay: Infinity,
    paraphrasePerDay: Infinity,
    litReviewAnalysesPerDay: Infinity,
  },
};

// === Advisor Review Types ===

export interface TextAnchor {
  selectedText: string;
  prefix: string;
  suffix: string;
  sectionId: string;
  startOffset: number;
  endOffset: number;
}

export interface ReviewCommentData {
  _id: string;
  shareLinkId: string;
  projectId: string;
  sectionId: string;
  advisorName: string;
  advisorSessionId: string;
  commentType: 'inline' | 'general';
  textAnchor?: TextAnchor;
  content: string;
  parentCommentId?: string;
  authorType: 'advisor' | 'student';
  authorEmail?: string;
  status: 'open' | 'resolved';
  replies?: ReviewCommentData[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ShareLinkData {
  _id: string;
  projectId: string;
  userId: string;
  token: string;
  advisorName: string;
  advisorEmail?: string;
  sectionIds: string[];
  expiresAt: Date;
  revokedAt?: Date;
  lastAccessedAt?: Date;
  accessCount: number;
  commentCount?: number;
  rubric?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RubricAnswerData {
  question: string;
  answer: string;
}

export interface RubricResponseData {
  _id: string;
  shareLinkId: string;
  projectId: string;
  advisorName: string;
  advisorSessionId: string;
  answers: RubricAnswerData[];
  createdAt: Date;
  updatedAt: Date;
}

