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
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageLimits {
  aiWordsPerDay: number;
  plagiarismChecksPerDay: number;
  maxProjects?: number;
}

export const PLAN_LIMITS: Record<PlanType, UsageLimits> = {
  free: {
    aiWordsPerDay: 1500,
    plagiarismChecksPerDay: 3,
    maxProjects: 3,
  },
  pro: {
    aiWordsPerDay: Infinity,
    plagiarismChecksPerDay: Infinity,
  },
  team: {
    aiWordsPerDay: Infinity,
    plagiarismChecksPerDay: Infinity,
  },
};

