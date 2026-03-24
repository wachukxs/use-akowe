/**
 * Keyword-based page structure for scaling to 20k+ pages
 * This allows programmatic generation of pages based on keyword research
 */

import { generateKeywordContent } from './generate-keyword-content';

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

let keywordsListCache: KeywordPage[] | null = null;

/**
 * Load keywords from CSV or database
 * Uses dynamic import to avoid circular dependency with keywords-data.ts
 */
export async function loadKeywordsFromSource(): Promise<KeywordPage[]> {
  if (keywordsListCache) return keywordsListCache;
  try {
    const { loadKeywords } = await import('./keywords-data');
    const keywords = loadKeywords();
    keywordsListCache = keywords.map((k: KeywordPage) => ({
      ...k,
      slug: k.slug || keywordToSlug(k.keyword),
    }));
    return keywordsListCache;
  } catch {
    console.warn('No keyword data found. Add keywords to lib/seo/keywords-data.ts');
    keywordsListCache = [];
    return [];
  }
}

/**
 * Get keyword page by slug
 * Cache uses compound key `${category}:${slug}` so duplicate keywords across
 * categories (e.g. "research impact" in both 'guide' and 'topic') don't collide.
 */
let keywordCache: Map<string, KeywordPage> | null = null;

function ensureKeywordCache(keywords: KeywordPage[]): Map<string, KeywordPage> {
  if (!keywordCache) {
    keywordCache = new Map();
    for (const k of keywords) {
      keywordCache.set(`${k.category}:${k.slug}`, k);
    }
  }
  return keywordCache;
}

/** Look up a keyword page by slug AND category (preferred, avoids ambiguity). */
export async function getKeywordPageBySlugAndCategory(
  slug: string,
  category: KeywordPage['category']
): Promise<KeywordPage | undefined> {
  const keywords = await loadKeywordsFromSource();
  const cache = ensureKeywordCache(keywords);
  const page = cache.get(`${category}:${slug}`);
  if (page && !page.content?.introduction && !page.content?.sections) {
    page.content = generateKeywordContent(page);
  }
  return page;
}

/** @deprecated Use getKeywordPageBySlugAndCategory when the category is known. */
export async function getKeywordPageBySlug(slug: string): Promise<KeywordPage | undefined> {
  const keywords = await loadKeywordsFromSource();
  const cache = ensureKeywordCache(keywords);
  // Return the first match across all categories (first-wins deduplication).
  for (const [key, page] of cache) {
    if (key.endsWith(`:${slug}`)) {
      if (page && !page.content?.introduction && !page.content?.sections) {
        page.content = generateKeywordContent(page);
      }
      return page;
    }
  }
  return undefined;
}

/**
 * Get all keyword slugs by category
 */
export async function getAllKeywordSlugs(category?: KeywordPage['category']): Promise<string[]> {
  const keywords = await loadKeywordsFromSource();
  const filtered = category 
    ? keywords.filter((k) => k.category === category)
    : keywords;
  return filtered.map((k) => k.slug);
}

/**
 * Get all keyword pages for a category (for index pages)
 */
export async function getAllKeywordPages(category: KeywordPage['category']): Promise<KeywordPage[]> {
  const keywords = await loadKeywordsFromSource();
  return keywords.filter((k) => k.category === category);
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
