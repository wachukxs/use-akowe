import { Citation } from '@/types';

type ParsedCitation = Omit<Citation, 'addedAt'> & { addedAt: Date };

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

function buildCitationText(authors: string[], year?: number, title?: string): string {
  if (authors.length > 0 && year) {
    const surname = authors[0].split(',')[0].trim();
    return `(${surname}, ${year})`;
  }
  if (title) return title.slice(0, 40);
  return 'Citation';
}

/**
 * Parse RIS format. Records are delimited by "ER  -" (end of reference).
 * Each field is "TY  - value" (two-letter tag, two spaces, dash, space, value).
 */
export function parseRIS(text: string): ParsedCitation[] {
  const results: ParsedCitation[] = [];
  // Split on ER  - including optional line breaks before it
  const records = text.split(/\nER\s*-\s*(\n|$)/);

  for (const record of records) {
    if (!record.trim()) continue;

    const entry: Record<string, string[]> = {};
    for (const line of record.split('\n')) {
      const m = line.match(/^([A-Z][A-Z0-9])\s{1,2}-\s(.+)$/);
      if (m) {
        const tag = m[1];
        if (!entry[tag]) entry[tag] = [];
        entry[tag].push(m[2].trim());
      }
    }

    const title = (entry['TI'] ?? entry['T1'] ?? [])[0] ?? '';
    if (!title) continue;

    const authors = (entry['AU'] ?? entry['A1'] ?? []).map((a) => a.trim());
    const yearStr = (entry['PY'] ?? entry['Y1'] ?? [])[0] ?? '';
    const year = parseInt(yearStr) || undefined;
    const journal = (entry['JO'] ?? entry['JF'] ?? entry['T2'] ?? [])[0] ?? '';
    const doi = (entry['DO'] ?? entry['M3'] ?? [])[0] ?? '';
    const url = (entry['UR'] ?? [])[0] ?? '';
    const publisher = (entry['PB'] ?? [])[0] ?? '';

    const id = `ris_${Date.now()}_${makeId()}`;
    results.push({
      id,
      title,
      authors,
      year,
      journal,
      doi: doi || undefined,
      url: url || undefined,
      publisher: publisher || undefined,
      citationKey: `cite_${makeId()}`,
      citationText: buildCitationText(authors, year, title),
      addedAt: new Date(),
      source: 'manual',
    });
  }

  return results;
}

/**
 * Parse BibTeX format. Each entry is @type{key, field=value, ...}.
 * Handles braces and double-quoted values.
 */
export function parseBibTeX(text: string): ParsedCitation[] {
  const results: ParsedCitation[] = [];
  // Match each entry block (greedy within balanced braces is hard; use a simplified approach)
  // Split on @ to get individual entries (avoids the need for the /s dotAll flag)
  const entryRegex = /@\w+[^@]*/g;
  const entries = text.match(entryRegex) ?? [];

  for (const entry of entries) {
    const fields: Record<string, string> = {};
    // Extract field = {value} or field = "value"
    const fieldRegex =
      /\b(\w+)\s*=\s*(?:\{((?:[^{}]|\{[^{}]*\})*)\}|"([^"]*)")/gi;
    let m: RegExpExecArray | null;
    while ((m = fieldRegex.exec(entry)) !== null) {
      fields[m[1].toLowerCase()] = (m[2] ?? m[3] ?? '').trim();
    }

    const title = fields['title'] ?? '';
    if (!title) continue;

    const rawAuthors = fields['author'] ?? '';
    const authors = rawAuthors
      ? rawAuthors.split(/\s+and\s+/i).map((a) => a.trim())
      : [];
    const year = parseInt(fields['year'] ?? '') || undefined;
    const journal = fields['journal'] ?? fields['booktitle'] ?? '';
    const doi = fields['doi'] ?? '';
    const url = fields['url'] ?? '';
    const publisher = fields['publisher'] ?? '';

    const id = `bib_${Date.now()}_${makeId()}`;
    results.push({
      id,
      title,
      authors,
      year,
      journal,
      doi: doi || undefined,
      url: url || undefined,
      publisher: publisher || undefined,
      citationKey: `cite_${makeId()}`,
      citationText: buildCitationText(authors, year, title),
      addedAt: new Date(),
      source: 'manual',
    });
  }

  return results;
}

/**
 * Auto-detect format and parse.
 * Returns an empty array if format is unrecognised.
 */
export function detectAndParse(text: string): ParsedCitation[] {
  const trimmed = text.trim();
  if (trimmed.startsWith('@')) return parseBibTeX(trimmed);
  // RIS starts with a two-letter tag at column 0
  if (/^[A-Z][A-Z0-9]\s{1,2}-\s/.test(trimmed)) return parseRIS(trimmed);
  return [];
}
