import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import { tryIncrementPlagiarismChecks } from '@/lib/usage';
import { Section } from '@/types';

// Enhanced similarity calculation using multiple methods
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const words2 = text2.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  // Jaccard similarity
  const jaccard = union.size > 0 ? (intersection.size / union.size) * 100 : 0;
  
  // Word order similarity (simple)
  let orderSimilarity = 0;
  const minLength = Math.min(words1.length, words2.length);
  if (minLength > 0) {
    let matches = 0;
    for (let i = 0; i < minLength; i++) {
      if (words1[i] === words2[i]) matches++;
    }
    orderSimilarity = (matches / minLength) * 100;
  }
  
  // Combined similarity (weighted)
  return Math.round((jaccard * 0.7) + (orderSimilarity * 0.3));
}

// N-gram analysis for better phrase matching
function generateNGrams(text: string, n: number): string[] {
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const ngrams: string[] = [];
  
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.push(words.slice(i, i + n).join(' '));
  }
  
  return ngrams;
}

// Detect paraphrasing using n-gram overlap
function detectParaphrasing(text: string, sourceText: string): { similarity: number; matchedPhrases: string[] } {
  const textNGrams = generateNGrams(text, 3); // 3-word phrases
  const sourceNGrams = generateNGrams(sourceText, 3);
  
  const matchedPhrases: string[] = [];
  let totalSimilarity = 0;
  
  for (const ngram of textNGrams) {
    let maxSimilarity = 0;
    
    for (const sourceNGram of sourceNGrams) {
      const sim = calculateSimilarity(ngram, sourceNGram);
      if (sim > maxSimilarity) {
        maxSimilarity = sim;
      }
    }
    
    if (maxSimilarity > 50) { // 50% similarity threshold for paraphrasing
      matchedPhrases.push(ngram);
      totalSimilarity += maxSimilarity;
    }
  }
  
  const avgSimilarity = matchedPhrases.length > 0 ? totalSimilarity / matchedPhrases.length : 0;
  
  return {
    similarity: Math.round(avgSimilarity),
    matchedPhrases: matchedPhrases.slice(0, 5) // Limit to 5 matched phrases
  };
}

// Enhanced CrossRef API integration with better matching
async function checkCrossRef(text: string): Promise<Array<{ 
  text: string; 
  source: string; 
  url?: string; 
  similarity?: number;
  section?: string;
  suggestion?: string;
}>> {
  const matches: Array<{ text: string; source: string; url?: string; similarity?: number; section?: string; suggestion?: string }> = [];
  
  try {
    // Extract key phrases using n-grams for better matching
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const keyPhrases = sentences.slice(0, 5); // Check more sentences
    
    for (const phrase of keyPhrases) {
      const cleanPhrase = phrase.trim().substring(0, 100);
      
      // Try multiple search strategies
      const searchQueries = [
        cleanPhrase, // Full phrase
        cleanPhrase.split(' ').slice(0, 5).join(' '), // First 5 words
        cleanPhrase.split(' ').slice(0, 3).join(' '), // First 3 words
      ];
      
      for (const query of searchQueries) {
        const response = await fetch(`https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=5`, {
          headers: {
            'User-Agent': 'Akowe Research Tool (mailto:ola@placeholderllc.name.ng)'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const works = data.message?.items || [];
          
          for (const work of works) {
            const title = work.title?.[0] || '';
            const abstract = work.abstract || '';
            const fullText = `${title} ${abstract}`;
            
            // Check similarity with title
            const titleSimilarity = calculateSimilarity(cleanPhrase, title);
            
            // Check paraphrasing
            const paraphrase = detectParaphrasing(cleanPhrase, fullText);
            
            if (titleSimilarity > 25 || paraphrase.similarity > 40) {
              const similarity = Math.max(titleSimilarity, paraphrase.similarity);
              
              matches.push({
                text: `Similar to: "${title}"`,
                source: 'CrossRef Database',
                url: work.URL || (work.DOI ? `https://doi.org/${work.DOI}` : undefined),
                similarity: Math.round(similarity),
                section: cleanPhrase.substring(0, 50) + '...',
                suggestion: paraphrase.similarity > 40 
                  ? `This appears to be paraphrased from the source. Consider adding a citation: (${work.author?.[0]?.family || 'Author'}, ${work.published?.['date-parts']?.[0]?.[0] || 'Year'})`
                  : `Consider citing this source: ${title}`
              });
            }
          }
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  } catch (error) {
    console.error('CrossRef API error:', error);
  }
  
  return matches.slice(0, 5); // Return top 5 matches
}

// Enhanced arXiv API integration
async function checkArxiv(text: string): Promise<Array<{ 
  text: string; 
  source: string; 
  url?: string; 
  similarity?: number;
  section?: string;
  suggestion?: string;
}>> {
  const matches: Array<{ text: string; source: string; url?: string; similarity?: number; section?: string; suggestion?: string }> = [];
  
  try {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const keyPhrases = sentences.slice(0, 4); // Check more sentences
    
    for (const phrase of keyPhrases) {
      const cleanPhrase = phrase.trim().substring(0, 80);
      
      const response = await fetch(`http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(cleanPhrase)}&start=0&max_results=5`);
      
      if (response.ok) {
        const xmlText = await response.text();
        const entries = xmlText.match(/<entry>[\s\S]*?<\/entry>/g) || [];
        
        for (const entry of entries) {
          const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
          const summaryMatch = entry.match(/<summary>([^<]+)<\/summary>/);
          const idMatch = entry.match(/<id>([^<]+)<\/id>/);
          
          if (titleMatch) {
            const title = titleMatch[1].replace(/\s+/g, ' ').trim();
            const summary = summaryMatch ? summaryMatch[1].replace(/\s+/g, ' ').trim() : '';
            const fullText = `${title} ${summary}`;
            
            const titleSimilarity = calculateSimilarity(cleanPhrase, title);
            const paraphrase = detectParaphrasing(cleanPhrase, fullText);
            
            if (titleSimilarity > 20 || paraphrase.similarity > 35) {
              const similarity = Math.max(titleSimilarity, paraphrase.similarity);
              const arxivId = idMatch ? idMatch[1].split('/').pop() : '';
              
              matches.push({
                text: `Similar to: "${title}"`,
                source: 'arXiv Preprints',
                url: arxivId ? `https://arxiv.org/abs/${arxivId}` : 'https://arxiv.org',
                similarity: Math.round(similarity),
                section: cleanPhrase.substring(0, 50) + '...',
                suggestion: `This preprint may be relevant. Consider citing if used: ${title}`
              });
            }
          }
        }
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  } catch (error) {
    console.error('arXiv API error:', error);
  }
  
  return matches.slice(0, 4); // Return top 4 matches
}

// Citation intelligence: detect uncited claims and suggest citations
function analyzeCitations(text: string, _existingCitations: unknown[]): Array<{
  text: string;
  source: string;
  url?: string;
  similarity?: number;
  section?: string;
  suggestion?: string;
}> {
  void _existingCitations;
  const matches: Array<{ text: string; source: string; url?: string; similarity?: number; section?: string; suggestion?: string }> = [];
  
  // Patterns that typically require citations
  // Note: No global flag for patterns used with .test() in loops to avoid lastIndex issues
  const claimPatterns = [
    /(?:studies|research|findings|evidence|data|analysis|results?|investigation|study|paper|article|author|researcher|scholar)\s+(?:show|shows|indicate|indicates|demonstrate|demonstrates|reveal|reveals|suggest|suggests|prove|proves|confirm|confirms|establish|establishes|found|finds|discovered|discover)/i,
    /(?:according to|based on|as shown|as demonstrated|as indicated|as revealed|as suggested|as found|as established)/i,
    /(?:previous|prior|earlier|recent|past|existing|published|peer-reviewed)\s+(?:studies?|research|findings?|work|papers?|articles?|investigations?)/i,
  ];
  
  // Extract citations from text (global flag OK here since we use .match())
  const citationPatternsForMatch = [
    /\([A-Za-z]+(?:,?\s+et\s+al\.?)?,?\s*\d{4}\)/g,
    /\[[A-Za-z]+(?:,?\s+et\s+al\.?)?,?\s*\d{4}\]/g,
    /\([A-Za-z]+\s+&\s+[A-Za-z]+,?\s*\d{4}\)/g,
  ];
  
  // Patterns for testing individual sentences (no global flag)
  const citationPatternsForTest = [
    /\([A-Za-z]+(?:,?\s+et\s+al\.?)?,?\s*\d{4}\)/,
    /\[[A-Za-z]+(?:,?\s+et\s+al\.?)?,?\s*\d{4}\]/,
    /\([A-Za-z]+\s+&\s+[A-Za-z]+,?\s*\d{4}\)/,
  ];
  
  const foundCitations = new Set<string>();
  citationPatternsForMatch.forEach(pattern => {
    const matches = text.match(pattern) || [];
    matches.forEach(citation => foundCitations.add(citation.toLowerCase()));
  });
  
  // Find sentences with claims
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  for (const sentence of sentences) {
    let hasClaim = false;
    let hasCitation = false;
    
    // Check if sentence contains a claim pattern
    for (const pattern of claimPatterns) {
      if (pattern.test(sentence)) {
        hasClaim = true;
        break;
      }
    }
    
    // Check if sentence has a citation
    for (const pattern of citationPatternsForTest) {
      if (pattern.test(sentence)) {
        hasCitation = true;
        break;
      }
    }
    
    // If claim exists but no citation, flag it
    if (hasClaim && !hasCitation) {
      matches.push({
        text: sentence.trim().substring(0, 100) + (sentence.length > 100 ? '...' : ''),
        source: 'Citation Intelligence',
        section: sentence.trim().substring(0, 50) + '...',
        suggestion: 'This claim may need a citation. Consider adding a reference to support this statement.'
      });
    }
  }
  
  return matches.slice(0, 5); // Limit to 5 citation suggestions
}

import { Citation } from '@/types';

// Section-level analysis
function analyzeSection(section: Section, allSections: Section[], existingCitations: Citation[]): {
  sectionId: string;
  sectionTitle: string;
  matchPercentage: number;
  matches: Array<{ text: string; source: string; url?: string; similarity?: number; section?: string; suggestion?: string }>;
  wordCount: number;
} {
  // Ensure content is always a string to prevent .split() errors
  const content = typeof section.content === 'string' ? section.content : String(section.content || '');
  const words = content.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  
  if (wordCount < 10) {
    return {
      sectionId: section.id,
      sectionTitle: section.title,
      matchPercentage: 0,
      matches: [],
      wordCount: wordCount // Return actual word count, not 0
    };
  }
  
  // Analyze this section
  const citationMatches = analyzeCitations(content, existingCitations);
  
  // Check for repetition within section
  const wordCountMap: { [key: string]: number } = {};
  words.forEach(word => {
    if (word.length > 3) {
      wordCountMap[word] = (wordCountMap[word] || 0) + 1;
    }
  });
  
  const repetitionIssues = Object.entries(wordCountMap)
    .filter(([, count]) => count > 3)
    .slice(0, 2)
    .map(([word, count]) => ({
      text: `"${word}" appears ${count} times in this section`,
      source: 'Repetition Analysis',
      section: section.title,
      suggestion: `Consider using synonyms or rephrasing to reduce repetition of "${word}"`
    }));
  
  const matches = [...citationMatches, ...repetitionIssues];
  
  // Calculate section match percentage
  const matchPercentage = Math.min(
    Math.floor((matches.length / wordCount) * 100), // Accurate percentage without inflation
    95
  );
  
  return {
    sectionId: section.id,
    sectionTitle: section.title,
    matchPercentage,
    matches: matches.slice(0, 8),
    wordCount
  };
}

// Enhanced plagiarism detection with section-level analysis
async function checkPlagiarism(
  text: string, 
  sections?: Section[], 
  existingCitations?: Citation[]
): Promise<{
  matchPercentage: number;
  matches: Array<{ text: string; source: string; url?: string; similarity?: number; section?: string; suggestion?: string }>;
  sectionAnalysis?: Array<{
    sectionId: string;
    sectionTitle: string;
    matchPercentage: number;
    matches: Array<{ text: string; source: string; url?: string; similarity?: number; section?: string; suggestion?: string }>;
    wordCount: number;
  }>;
  analysis: {
    overusedPhrases: number;
    repetitionIssues: number;
    citationProblems: number;
    aiPatterns: number;
    wordDiversity: number;
    externalMatches: number;
    paraphrasingDetected: number;
  };
  sources: {
    crossref: number;
    arxiv: number;
  };
}> {
  // Extract citations from the text to exclude them from plagiarism check
  const citationPatterns = [
    /\([A-Za-z]+,\s*\d{4}\)/g,
    /\[[A-Za-z]+,\s*\d{4}\]/g,
    /\([A-Za-z]+\s+et\s+al\.\s*,\s*\d{4}\)/g,
    /\[[A-Za-z]+\s+et\s+al\.\s*,\s*\d{4}\]/g,
    /\([A-Za-z]+\s+&\s+[A-Za-z]+,\s*\d{4}\)/g,
    /\[[A-Za-z]+\s+&\s+[A-Za-z]+,\s*\d{4}\]/g,
  ];
  
  // Remove citations from text for analysis
  let textToAnalyze = text;
  citationPatterns.forEach(pattern => {
    textToAnalyze = textToAnalyze.replace(pattern, '');
  });
  
  // Clean up extra spaces
  textToAnalyze = textToAnalyze.replace(/\s+/g, ' ').trim();
  
  const words = textToAnalyze.toLowerCase().split(/\s+/);
  const totalWords = words.length;
  
  if (totalWords < 10) {
    return {
      matchPercentage: 0,
      matches: [],
      analysis: {
        overusedPhrases: 0,
        repetitionIssues: 0,
        citationProblems: 0,
        aiPatterns: 0,
        wordDiversity: 100,
        externalMatches: 0,
        paraphrasingDetected: 0
      },
      sources: {
        crossref: 0,
        arxiv: 0
      }
    };
  }

  // Check external sources in parallel
  const [crossrefMatches, arxivMatches] = await Promise.all([
    checkCrossRef(textToAnalyze),
    checkArxiv(textToAnalyze)
  ]);

  // Enhanced plagiarism detection
  let suspiciousPhrases = 0;
  let aiPatterns = 0;
  let paraphrasingDetected = 0;
  const matches: Array<{ text: string; source: string; url?: string; similarity?: number; section?: string; suggestion?: string }> = [];
  
  // Add external matches
  matches.push(...crossrefMatches, ...arxivMatches);
  
  // Count paraphrasing detected
  paraphrasingDetected = crossrefMatches.filter(m => m.similarity && m.similarity > 40).length +
                         arxivMatches.filter(m => m.similarity && m.similarity > 35).length;
  
  // Academic clichés
  const academicPatterns = [
    'according to recent studies',
    'research has shown that',
    'studies have demonstrated',
    'it has been established that',
    'previous research indicates',
    'the literature suggests',
    'empirical evidence shows',
    'findings reveal that',
    'data analysis indicates',
    'statistical analysis shows',
    'the results demonstrate',
    'investigation reveals',
    'examination shows that',
    'analysis indicates that',
    'research findings suggest',
    'the study found that',
    'results indicate that',
    'evidence suggests that',
    'the data shows that',
    'findings indicate that',
    'it has been proven that',
    'studies confirm that',
    'research demonstrates that',
    'evidence indicates that',
    'findings support the notion',
    'the research reveals that'
  ];
  
  // AI-generated patterns
  const aiPatternsList = [
    'it is worth noting that',
    'it should be emphasized that',
    'it is crucial to understand',
    'in today\'s fast-paced world',
    'it is important to remember',
    'it is essential to understand',
    'it is vital to consider',
    'it is necessary to acknowledge',
    'it is imperative to realize',
    'it is fundamental to grasp',
    'it is basic to comprehend',
    'in today\'s competitive market',
    'as we move forward',
    'going forward, it is essential',
    'in order to achieve success',
    'the key to success is',
    'in the current climate',
    'in this day and age',
    'it is important to note that',
    'it should be noted that',
    'it is crucial to recognize'
  ];
  
  // Check academic patterns
  academicPatterns.forEach(pattern => {
    if (textToAnalyze.toLowerCase().includes(pattern)) {
      suspiciousPhrases++;
      matches.push({
        text: pattern,
        source: 'Academic Cliché Database',
        url: 'https://academic-writing-tips.com',
        suggestion: `Consider rephrasing this common academic phrase: "${pattern}"`
      });
    }
  });
  
  // Check AI patterns
  aiPatternsList.forEach(pattern => {
    if (textToAnalyze.toLowerCase().includes(pattern)) {
      aiPatterns++;
      matches.push({
        text: pattern,
        source: 'AI Pattern Database',
        url: 'https://ai-detection-tools.com',
        suggestion: `This phrase is commonly used in AI-generated text. Consider rephrasing: "${pattern}"`
      });
    }
  });
  
  // Detect word repetition
  const wordCount: { [key: string]: number } = {};
  words.forEach(word => {
    if (word.length > 3) {
      wordCount[word] = (wordCount[word] || 0) + 1;
    }
  });
  
  const repetitionIssues = Object.entries(wordCount)
    .filter(([, count]) => count > 3)
    .length;
  
  // Add repetition matches
  Object.entries(wordCount)
    .filter(([, count]) => count > 3)
    .slice(0, 3)
    .forEach(([word, count]) => {
      matches.push({
        text: `"${word}" appears ${count} times`,
        source: 'Repetition Analysis',
        url: 'https://writing-tools.com/repetition',
        suggestion: `Consider using synonyms or rephrasing to reduce repetition of "${word}"`
      });
    });
  
  // Citation analysis
  const citations = textToAnalyze.match(/\([^)]+\d{4}\)/g) || [];
  const claims = textToAnalyze.match(/studies show|research indicates|it has been proven|according to|research has shown|studies demonstrate/gi) || [];
  const citationProblems = Math.max(0, claims.length - citations.length);
  
  // Add citation problem matches
  if (citationProblems > 0) {
    matches.push({
      text: `${citationProblems} uncited claims detected`,
      source: 'Citation Analysis',
      url: 'https://citation-tools.com',
      suggestion: `You have ${citationProblems} claim(s) that may need citations. Review your text and add appropriate references.`
    });
  }
  
  // Word diversity analysis
  const uniqueWords = new Set(words.filter(word => word.length > 3));
  const wordDiversity = Math.round((uniqueWords.size / words.length) * 100);
  
  // Section-level analysis if sections provided
  let sectionAnalysis: Array<{
    sectionId: string;
    sectionTitle: string;
    matchPercentage: number;
    matches: Array<{ text: string; source: string; url?: string; similarity?: number; section?: string; suggestion?: string }>;
    wordCount: number;
  }> = [];
  
  if (sections && sections.length > 0) {
    sectionAnalysis = sections.map(section => 
      analyzeSection(section, sections, existingCitations || [])
    );
  }
  
  // Calculate overall match percentage
  const externalMatches = crossrefMatches.length + arxivMatches.length;
  const totalIssues = suspiciousPhrases + aiPatterns + repetitionIssues + citationProblems + externalMatches;
  const matchPercentage = Math.min(Math.floor((totalIssues / totalWords) * 100), 95);
  
  return {
    matchPercentage,
    matches: matches.slice(0, 12), // Show more matches
    sectionAnalysis: sectionAnalysis.length > 0 ? sectionAnalysis : undefined,
    analysis: {
      overusedPhrases: suspiciousPhrases,
      repetitionIssues,
      citationProblems,
      aiPatterns,
      wordDiversity,
      externalMatches,
      paraphrasingDetected
    },
    sources: {
      crossref: crossrefMatches.length,
      arxiv: arxivMatches.length
    }
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, text, sections } = body;

    if (!projectId || !text) {
      return NextResponse.json(
        { error: 'Project ID and text are required' },
        { status: 400 }
      );
    }

    // Atomically check and increment usage limits BEFORE doing expensive work
    // This prevents race conditions where multiple concurrent requests could exceed the limit
    const usageCheck = await tryIncrementPlagiarismChecks(session.user.email);
    
    if (!usageCheck || !usageCheck.success) {
      return NextResponse.json(
        { 
          error: 'Daily plagiarism check limit reached',
          remaining: usageCheck?.remaining ?? 0,
          limit: usageCheck?.limit ?? 3,
        },
        { status: 429 }
      );
    }

    // Get project to access sections and citations
    await connectDB();
    const project = await Project.findOne({ 
      _id: projectId, 
      userId: session.user.email 
    }).lean();

    if (!project) {
      // If project not found, we need to rollback the increment
      // However, since this is rare and the user already consumed a check, we'll let it slide
      // The check was already counted, which is acceptable UX-wise
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Use provided sections or project sections, with validation
    const rawSections = sections || project.sections || [];
    // Validate and sanitize sections to ensure content is always a string
    const sectionsToAnalyze = rawSections
      .filter((section: unknown): section is Section => section !== null && typeof section === 'object' && 'id' in section && 'title' in section)
      .map((section: Section) => ({
        ...section,
        content: typeof section.content === 'string' ? section.content : String(section.content || ''),
        title: typeof section.title === 'string' ? section.title : String(section.title || ''),
        id: typeof section.id === 'string' ? section.id : String(section.id || ''),
        type: section.type || 'custom',
        order: typeof section.order === 'number' ? section.order : 0,
      }));
    const existingCitations = project.citations || [];

    // Perform enhanced plagiarism check
    // Note: If this fails, the check was already counted - this is acceptable UX
    // as the user initiated the check and it consumed resources
    const result = await checkPlagiarism(text, sectionsToAnalyze, existingCitations);

    // Store result in project
    const plagiarismCheck = {
      checkedAt: new Date(),
      matchPercentage: result.matchPercentage,
      matches: result.matches,
      analysis: result.analysis,
      sectionAnalysis: result.sectionAnalysis,
    };

    await Project.findOneAndUpdate(
      { _id: projectId, userId: session.user.email },
      { 
        $push: { plagiarismChecks: plagiarismCheck },
        lastEditedAt: new Date(),
      },
      { new: true }
    );

    // Usage was already incremented atomically above, so we don't need to increment again
    return NextResponse.json({
      matchPercentage: result.matchPercentage,
      matches: result.matches,
      sectionAnalysis: result.sectionAnalysis,
      analysis: result.analysis,
      sources: result.sources,
      remaining: usageCheck.remaining,
    });
  } catch (error) {
    console.error('Error checking plagiarism:', error);
    return NextResponse.json({ error: 'Failed to check plagiarism' }, { status: 500 });
  }
}
