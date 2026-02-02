/**
 * Keyword-based page structure for scaling to 20k+ pages
 * This allows programmatic generation of pages based on keyword research
 */

export interface KeywordPage {
  slug: string;
  keyword: string;
  title: string;
  description: string;
  keywords: string[];
  category: 'citation' | 'guide' | 'template' | 'faq' | 'comparison' | 'topic' | 'methodology' | 'field';
  content?: {
    introduction?: string;
    sections?: Array<{ heading: string; content: string }>;
    conclusion?: string;
  };
  relatedKeywords?: string[];
  searchVolume?: number;
  difficulty?: number; // KD score
  intent?: 'informational' | 'commercial' | 'transactional' | 'navigational';
}

/**
 * Load keywords from CSV or database
 * Uses keywords-data.ts which imports from your keyword source
 */
export function loadKeywordsFromSource(): KeywordPage[] {
  try {
    // Load from keywords-data.ts
    const { loadKeywords } = require('./keywords-data');
    const keywords = loadKeywords();
    
    // Ensure all keywords have slugs
    return keywords.map((k: KeywordPage) => ({
      ...k,
      slug: k.slug || keywordToSlug(k.keyword),
    }));
  } catch (error) {
    // Fallback: return empty array if keywords-data.ts doesn't exist or has no data
    console.warn('No keyword data found. Add keywords to lib/seo/keywords-data.ts');
    return [];
  }
}

/**
 * Get keyword page by slug
 */
let keywordCache: Map<string, KeywordPage> | null = null;

export function getKeywordPageBySlug(slug: string): KeywordPage | undefined {
  if (!keywordCache) {
    // Lazy load keywords when first accessed
    const keywords: KeywordPage[] = loadKeywordsFromSource();
    keywordCache = new Map(keywords.map((k) => [k.slug, k]));
  }
  return keywordCache.get(slug);
}

/**
 * Get all keyword slugs by category
 */
export function getAllKeywordSlugs(category?: KeywordPage['category']): string[] {
  const keywords: KeywordPage[] = loadKeywordsFromSource();
  const filtered = category 
    ? keywords.filter((k) => k.category === category)
    : keywords;
  return filtered.map((k) => k.slug);
}

/**
 * Generate page slug from keyword
 */
export function keywordToSlug(keyword: string): string {
  return keyword
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Validate keyword meets criteria (1k+ volume, KD <30)
 * Note: Some highly relevant keywords with lower volume may still be included
 */
export function isValidKeyword(keyword: KeywordPage): boolean {
  // Allow keywords with volume >= 500 if they're highly relevant (low KD)
  const minVolume = keyword.difficulty && keyword.difficulty < 25 ? 500 : 1000;
  if (keyword.searchVolume && keyword.searchVolume < minVolume) return false;
  if (keyword.difficulty && keyword.difficulty >= 30) return false;
  return true;
}
