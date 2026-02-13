export type ProjectType = 'essay' | 'thesis' | 'journal' | 'research';
export type ProjectStatus = 'draft' | 'in_progress' | 'completed' | 'archived';
export type PlanType = 'free' | 'pro' | 'team';
export type SectionType = 'introduction' | 'literature_review' | 'methodology' | 'results' | 'discussion' | 'conclusion' | 'custom';

export interface User {
  _id: string;
  name: string;
  email: string;
  image?: string;
  plan: PlanType;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
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
  paraphrasePerDay: number;
  litReviewAnalysesPerDay: number;
  maxProjects?: number;
}

export const PLAN_LIMITS: Record<PlanType, UsageLimits> = {
  free: {
    aiWordsPerDay: 1500,
    plagiarismChecksPerDay: 3,
    paraphrasePerDay: 2,
    litReviewAnalysesPerDay: 2,
    maxProjects: 3,
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

