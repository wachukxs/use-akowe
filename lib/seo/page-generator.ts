/**
 * Page generator utilities for programmatic SEO
 * Helps scale to 20k+ pages efficiently
 */

import { CitationSource } from './citation-sources';
import { KeywordPage } from './keywords';

export interface PageData {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  path: string;
  category: string;
  content?: any;
}

/**
 * Generate page data from various sources
 */
export class PageGenerator {
  /**
   * Generate pages from citation sources (already implemented)
   */
  static fromCitationSource(source: CitationSource, style: string): PageData {
    return {
      slug: `${style}/${source.sourceType}`,
      title: source.title,
      description: source.description,
      keywords: source.keywords,
      path: `/citation-sources/${style}/${source.sourceType}`,
      category: 'citation',
      content: {
        format: source.format,
        example: source.example,
        notes: source.notes,
      },
    };
  }

  /**
   * Generate pages from keywords (for scaling to 20k)
   */
  static fromKeyword(keyword: KeywordPage): PageData {
    return {
      slug: keyword.slug,
      title: keyword.title,
      description: keyword.description,
      keywords: keyword.keywords,
      path: `/${keyword.category}/${keyword.slug}`,
      category: keyword.category,
      content: keyword.content,
    };
  }

  /**
   * Batch generate pages (for build optimization)
   */
  static batchGenerate<T>(
    items: T[],
    generator: (item: T) => PageData,
    chunkSize: number = 1000
  ): PageData[] {
    const pages: PageData[] = [];
    
    // Process in chunks to avoid memory issues
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const chunkPages = chunk.map(generator);
      pages.push(...chunkPages);
    }
    
    return pages;
  }
}
