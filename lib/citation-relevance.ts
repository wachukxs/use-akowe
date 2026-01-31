/**
 * Topic-based relevance scoring for citations.
 * Ensures discovered results are ranked and filtered by how well they match
 * the user's topic (e.g. "comparative maritime law") so off-topic results
 * (e.g. "comparative health care") are down-ranked or excluded.
 */

/** Minimum word length to count as a significant topic token */
const MIN_TOKEN_LENGTH = 2;

/** Common stop words that dilute topic matching (English) */
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
  'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
  'it', 'its', 'they', 'them', 'their', 'we', 'our', 'you', 'your',
  'i', 'me', 'my', 'he', 'she', 'his', 'her', 'what', 'which', 'who',
  'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few',
  'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
  'own', 'same', 'so', 'than', 'too', 'very', 'just', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'between', 'under',
  'again', 'further', 'then', 'once', 'here', 'there', 'about',
]);

/** Citation-like shape for scoring (title and optional abstract) */
export interface CitationLike {
  title?: string | null;
  abstract?: string | null;
}

/**
 * Extract significant tokens from a topic string for matching.
 * Normalises to lowercase, splits on non-word characters, removes stop words
 * and very short tokens, and deduplicates.
 */
export function getTopicTokens(topic: string): string[] {
  if (!topic || typeof topic !== 'string') return [];

  const normalized = topic
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

  const rawTokens = normalized.split(/\W+/).filter(Boolean);
  const tokens = rawTokens.filter(
    (t) =>
      t.length >= MIN_TOKEN_LENGTH &&
      !STOP_WORDS.has(t) &&
      !/^\d+$/.test(t)
  );

  return [...new Set(tokens)];
}

/**
 * Score how well a citation matches the topic (0–100).
 * Uses token overlap in title and abstract; title matches are weighted higher
 * so domain-specific terms in the title (e.g. "maritime", "law") drive relevance.
 *
 * - Each topic token in the title adds more points than in the abstract.
 * - If no topic tokens exist (e.g. empty topic), returns 0.
 */
export function calculateTopicRelevanceScore(
  citation: CitationLike,
  topic: string
): number {
  const tokens = getTopicTokens(topic);
  if (tokens.length === 0) return 0;

  const title = (citation.title ?? '').toLowerCase();
  const abstract = (citation.abstract ?? '').toLowerCase();
  const content = `${title} ${abstract}`.trim();
  if (!content) return 0;

  let score = 0;
  const pointsPerTokenInTitle = 15;
  const pointsPerTokenInAbstract = 5;

  for (const token of tokens) {
    const inTitle = title.includes(token);
    const inAbstract = abstract.includes(token);
    if (inTitle) score += pointsPerTokenInTitle;
    if (inAbstract) score += pointsPerTokenInAbstract;
  }

  // Cap at 100
  return Math.min(100, score);
}

/**
 * Minimum topic relevance score (0–100) for a citation to be considered
 * topic-relevant. Citations below this can be filtered out or deprioritised.
 */
export const MIN_TOPIC_RELEVANCE_SCORE = 5;

/**
 * Returns true if the citation has at least minimal topic relevance.
 * Use this to filter out results that match only generic terms (e.g. "comparative")
 * but not the domain (e.g. "maritime", "law").
 */
export function isTopicRelevant(
  citation: CitationLike,
  topic: string,
  minScore: number = MIN_TOPIC_RELEVANCE_SCORE
): boolean {
  return calculateTopicRelevanceScore(citation, topic) >= minScore;
}
