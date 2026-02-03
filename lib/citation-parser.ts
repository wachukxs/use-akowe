import { Citation } from '@/types';
import { formatYearForDisplay, formatYearForCitationKey } from '@/lib/citation-year';

// Citation patterns for different styles
const CITATION_PATTERNS = {
  // APA: (Author, Year) or (Author et al., Year)
  apa: /\(([^,]+(?:,\s*et\s*al\.)?),\s*(\d{4})\)/gi,
  
  // MLA: (Author Page) or (Author)
  mla: /\(([^,]+)(?:,\s*(\d+))?\)/gi,
  
  // Chicago: Author (Year) or Author, Year - more restrictive
  chicago: /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\s*\((\d{4})\)/gi,
  
  // IEEE: [1], [2], etc.
  ieee: /\[(\d+)\]/gi,
  
  // Harvard: Author (Year) - more restrictive
  harvard: /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\s*\((\d{4})\)/gi,
  
  // Generic patterns - more precise and restrictive
  authorYear: /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*\((\d{4})\)/gi,
  authorYearParen: /\(([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*(\d{4})\)/gi,
  
  // More precise patterns with word boundaries and length limits
  preciseAuthorYear: /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\s*\((\d{4})\)/gi,
  wordBoundaryAuthor: /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\s*\((\d{4})\)/gi,
  
  // Additional patterns for common formats - more restrictive
  byAuthorYear: /by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\s*\((\d{4})\)/gi,
  researchByAuthor: /research\s+by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\s*\((\d{4})\)/gi,
  
  // Specific patterns for your text - more restrictive
  recentResearchBy: /recent\s+research\s+by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\s*\((\d{4})\)/gi,
  publishedIn: /published\s+in\s+[^(]*\(([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}),\s*(\d{4})\)/gi,
  
  // Pattern for "This study published in Journal (Author, Year)"
  studyPublishedIn: /this\s+study\s+published\s+in\s+[^(]*\(([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}),\s*(\d{4})\)/gi,
  
  // Pattern for WHO citations
  whoCitation: /\(WHO,\s*(\d{4})\)/gi,
};

export interface ParsedCitation {
  id: string;
  title: string;
  authors: string[];
  year?: number;
  journal?: string;
  doi?: string;
  url?: string;
  citationKey: string;
  citationText: string;
  addedAt: Date;
  source: 'parsed' | 'manual';
}

/**
 * Parse citations from text content based on citation style
 */
export function parseCitationsFromText(
  content: string, 
  citationStyle: string = 'APA'
): ParsedCitation[] {
  const citations: ParsedCitation[] = [];
  const seenCitations = new Set<string>();
  
  // Try multiple patterns to catch different citation formats
  // Order matters: most specific patterns first
  const patternsToTry = [
    CITATION_PATTERNS.studyPublishedIn,
    CITATION_PATTERNS.whoCitation,
    CITATION_PATTERNS.publishedIn,
    CITATION_PATTERNS.recentResearchBy,
    CITATION_PATTERNS.researchByAuthor,
    CITATION_PATTERNS.byAuthorYear,
    CITATION_PATTERNS[citationStyle.toLowerCase() as keyof typeof CITATION_PATTERNS],
    CITATION_PATTERNS.authorYearParen,
    CITATION_PATTERNS.preciseAuthorYear,
  ].filter(Boolean);
  
  for (const pattern of patternsToTry) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      let [, authorPart, yearPart] = match;
      
      // Special handling for WHO citations
      if (pattern === CITATION_PATTERNS.whoCitation) {
        authorPart = 'WHO';
        yearPart = match[1];
      }
      
      // Skip if author part is too long (likely captured too much)
      if (authorPart.length > 100) {
        continue;
      }
      
      // Skip if author part contains newlines or multiple sentences
      if (authorPart.includes('\n') || authorPart.includes('.') || authorPart.includes(';')) {
        continue;
      }
      
      // Skip template/example citations
      if (authorPart.toLowerCase().includes('smith') || 
          authorPart.toLowerCase().includes('johnson') ||
          authorPart.toLowerCase().includes('example') ||
          authorPart.toLowerCase().includes('sample') ||
          authorPart.toLowerCase().includes('template') ||
          authorPart.toLowerCase().includes('placeholder')) {
        continue;
      }
      
      // Skip if author part is too short (likely not a real citation)
      if (authorPart.length < 3) {
        continue;
      }
      
      // Extract author(s) and year (never use current year when year is missing)
      const authors = extractAuthors(authorPart);
      const year =
        yearPart != null && String(yearPart).trim() !== ''
          ? parseInt(String(yearPart), 10)
          : undefined;
      const yearForKey = Number.isInteger(year) ? year : formatYearForCitationKey(undefined);

      // Skip if we've already seen this citation
      const citationKey = `${authorPart}-${yearForKey}`.toLowerCase();
      if (seenCitations.has(citationKey)) {
        continue;
      }
      seenCitations.add(citationKey);

      // Create citation object
      const citation: ParsedCitation = {
        id: `parsed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: `Research by ${authors[0]} (${formatYearForDisplay(year)})`, // Placeholder title
        authors,
        year: Number.isInteger(year) ? year : undefined,
        journal: 'Unknown Journal', // Placeholder
        citationKey: `cite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        citationText: formatCitationText(authors, year, citationStyle),
        addedAt: new Date(),
        source: 'parsed'
      };

      citations.push(citation);
    }
  }
  
  return citations;
}

// Test function for debugging (silent - remove console logs for production)
export function testCitationParsing() {
  const testContent = 'Recent research by Andre Martinez (2025) demonstrates that machine learning approaches can effectively analyze complex datasets for diagnostic and predictive purposes.';
  const result = parseCitationsFromText(testContent, 'APA');
  return result;
}

/**
 * Extract authors from citation text
 */
function extractAuthors(authorText: string): string[] {
  // Handle "et al." cases
  if (authorText.includes('et al.')) {
    const mainAuthor = authorText.replace(/\s*et\s*al\.?/gi, '').trim();
    return [mainAuthor, 'et al.'];
  }
  
  // Handle multiple authors separated by commas
  if (authorText.includes(',')) {
    return authorText.split(',').map(author => author.trim());
  }
  
  // Single author
  return [authorText.trim()];
}

/**
 * Format citation text based on style (uses "n.d." when year is unknown)
 */
function formatCitationText(authors: string[], year: number | undefined, style: string): string {
  const yearDisplay = formatYearForDisplay(year);

  switch (style.toLowerCase()) {
    case 'apa':
      if (authors.length === 1) {
        return `${authors[0]} (${yearDisplay})`;
      } else if (authors.length === 2) {
        return `${authors[0]} & ${authors[1]} (${yearDisplay})`;
      } else {
        return `${authors[0]} et al. (${yearDisplay})`;
      }

    case 'mla':
      if (authors.length === 1) {
        return `${authors[0]}`;
      } else if (authors.length === 2) {
        return `${authors[0]} and ${authors[1]}`;
      } else {
        return `${authors[0]} et al.`;
      }

    case 'chicago':
    case 'harvard':
      if (authors.length === 1) {
        return `${authors[0]} (${yearDisplay})`;
      } else if (authors.length === 2) {
        return `${authors[0]} and ${authors[1]} (${yearDisplay})`;
      } else {
        return `${authors[0]} et al. (${yearDisplay})`;
      }

    case 'ieee':
      return `[${yearDisplay}]`; // IEEE uses numbers; use year or n.d. as placeholder

    default:
      return `${authors[0]} (${yearDisplay})`;
  }
}

/**
 * Merge parsed citations with existing citations, avoiding duplicates
 */
export function mergeCitations(
  existingCitations: Citation[], 
  parsedCitations: ParsedCitation[]
): Citation[] {
  const merged = [...existingCitations];
  
  for (const parsedCitation of parsedCitations) {
    // Check if citation already exists (year comparison handles undefined)
    const exists = existingCitations.some(
      (existing) =>
        existing.authors.some((author) =>
          parsedCitation.authors.some(
            (parsedAuthor) =>
              author.toLowerCase().includes(parsedAuthor.toLowerCase()) ||
              parsedAuthor.toLowerCase().includes(author.toLowerCase())
          )
        ) && existing.year === parsedCitation.year
    );
    
    if (!exists) {
      merged.push({
        id: parsedCitation.id,
        title: parsedCitation.title,
        authors: parsedCitation.authors,
        year: parsedCitation.year,
        journal: parsedCitation.journal,
        doi: parsedCitation.doi,
        url: parsedCitation.url,
        citationKey: parsedCitation.citationKey,
        citationText: parsedCitation.citationText,
        addedAt: parsedCitation.addedAt,
        source: parsedCitation.source
      });
    }
  }
  
  return merged;
}

/**
 * Extract citations from all sections of a project
 */
export function extractCitationsFromProject(sections: any[], citationStyle: string): ParsedCitation[] {
  const allCitations: ParsedCitation[] = [];
  
  for (const section of sections) {
    if (section.content) {
      const sectionCitations = parseCitationsFromText(section.content, citationStyle);
      allCitations.push(...sectionCitations);
    }
  }
  
  // Remove duplicates (year may be undefined)
  const uniqueCitations = allCitations.filter(
    (citation, index, self) =>
      index ===
      self.findIndex(
        (c) => c.authors[0] === citation.authors[0] && c.year === citation.year
      )
  );
  
  return uniqueCitations;
}
