/**
 * Keyword loader - handles importing keywords from various sources
 * Supports CSV, JSON, and direct array input
 */

import { KeywordPage, keywordToSlug, isValidKeyword } from './keywords';
import fs from 'fs';
import path from 'path';

/**
 * Parse CSV keyword data
 * Expected format: keyword,title,description,keywords,category,searchVolume,difficulty,intent
 */
export function parseKeywordsFromCSV(csvContent: string): KeywordPage[] {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  const keywords: KeywordPage[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length < headers.length) continue;
    
    const keyword = values[0];
    const slug = keywordToSlug(keyword);
    
    const keywordPage: KeywordPage = {
      slug,
      keyword,
      title: values[1] || keyword,
      description: values[2] || `Complete guide to ${keyword} for academic writing.`,
      keywords: values[3] ? values[3].split('|').map(k => k.trim()) : [keyword],
      category: (values[4] as KeywordPage['category']) || 'topic',
      searchVolume: values[5] ? parseInt(values[5], 10) : undefined,
      difficulty: values[6] ? parseFloat(values[6]) : undefined,
      intent: (values[7] as KeywordPage['intent']) || 'informational',
    };
    
    if (isValidKeyword(keywordPage)) {
      keywords.push(keywordPage);
    }
  }
  
  return keywords;
}

/**
 * Parse JSON keyword data
 */
export function parseKeywordsFromJSON(jsonData: any[]): KeywordPage[] {
  return jsonData
    .map((item: any) => {
      const slug = item.slug || keywordToSlug(item.keyword || item.title);
      return {
        slug,
        keyword: item.keyword || item.title,
        title: item.title || item.keyword,
        description: item.description || `Complete guide to ${item.keyword || item.title} for academic writing.`,
        keywords: item.keywords || [item.keyword || item.title],
        category: item.category || 'topic',
        searchVolume: item.searchVolume || item.volume,
        difficulty: item.difficulty || item.kd,
        intent: item.intent || 'informational',
        content: item.content,
        relatedKeywords: item.relatedKeywords,
      } as KeywordPage;
    })
    .filter(isValidKeyword);
}

/**
 * Load keywords from file (CSV or JSON)
 */
export function loadKeywordsFromFile(filePath: string): KeywordPage[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.csv') {
    return parseKeywordsFromCSV(content);
  } else if (ext === '.json') {
    const jsonData = JSON.parse(content);
    return Array.isArray(jsonData) ? parseKeywordsFromJSON(jsonData) : [];
  }
  
  throw new Error(`Unsupported file format: ${ext}`);
}

/**
 * Load keywords from array (for direct import)
 */
export function loadKeywordsFromArray(keywords: Array<{
  keyword: string;
  slug?: string;
  title?: string;
  description?: string;
  keywords?: string[];
  category?: KeywordPage['category'];
  searchVolume?: number;
  volume?: number; // Alias for searchVolume
  difficulty?: number;
  kd?: number; // Alias for difficulty (keyword difficulty)
  intent?: KeywordPage['intent'];
  content?: KeywordPage['content'];
  relatedKeywords?: string[];
}>): KeywordPage[] {
  return keywords.map((item) => {
    const slug = item.slug || keywordToSlug(item.keyword || item.title || '');
    return {
      slug,
      keyword: item.keyword || item.title || '',
      title: item.title || item.keyword || '',
      description: item.description || `Complete guide to ${item.keyword || item.title} for academic writing.`,
      keywords: item.keywords || [item.keyword || item.title || ''],
      category: item.category || 'topic',
      searchVolume: item.searchVolume || item.volume,
      difficulty: item.difficulty || item.kd,
      intent: item.intent || 'informational',
      content: item.content,
      relatedKeywords: item.relatedKeywords,
    } as KeywordPage;
  }).filter(isValidKeyword);
}
