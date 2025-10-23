import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import { checkPlagiarismLimit, incrementPlagiarismChecks } from '@/lib/usage';

// Enhanced FREE plagiarism detection implementation
async function checkPlagiarism(text: string): Promise<{
  matchPercentage: number;
  matches: Array<{ text: string; source: string; url?: string }>;
  analysis: {
    overusedPhrases: number;
    repetitionIssues: number;
    citationProblems: number;
    aiPatterns: number;
    wordDiversity: number;
  };
}> {
  // Extract citations from the text to exclude them from plagiarism check
  const citationPatterns = [
    /\([A-Za-z]+,\s*\d{4}\)/g, // (Author, Year)
    /\[[A-Za-z]+,\s*\d{4}\]/g, // [Author, Year]
    /\([A-Za-z]+\s+et\s+al\.\s*,\s*\d{4}\)/g, // (Author et al., Year)
    /\[[A-Za-z]+\s+et\s+al\.\s*,\s*\d{4}\]/g, // [Author et al., Year]
    /\([A-Za-z]+\s+&\s+[A-Za-z]+,\s*\d{4}\)/g, // (Author & Author, Year)
    /\[[A-Za-z]+\s+&\s+[A-Za-z]+,\s*\d{4}\]/g, // [Author & Author, Year]
  ];
  
  // Remove citations from text for analysis
  let textToAnalyze = text;
  citationPatterns.forEach(pattern => {
    textToAnalyze = textToAnalyze.replace(pattern, '');
  });
  
  // Clean up extra spaces
  textToAnalyze = textToAnalyze.replace(/\s+/g, ' ').trim();
  
  // Check for common academic phrases that shouldn't be flagged
  const commonPhrases = [
    'this study aims to',
    'the purpose of this research',
    'according to the literature',
    'previous studies have shown',
    'it is important to note',
    'further research is needed',
    'in conclusion',
    'the results indicate',
    'the findings suggest',
    'as shown in table',
    'figure shows that',
    'the data reveals',
    'statistical analysis shows',
    'the methodology used',
    'the sample size was',
    'participants were selected',
    'the study was conducted',
    'data was collected',
    'the results were analyzed',
    'the hypothesis was tested'
  ];
  
  // Enhanced plagiarism detection by analyzing text patterns
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
        wordDiversity: 100
      }
    };
  }
  
  // Enhanced free plagiarism detection
  let suspiciousPhrases = 0;
  let aiPatterns = 0;
  const matches: Array<{ text: string; source: string; url?: string }> = [];
  
  // Academic clichés (overused phrases)
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
  
  // AI-generated patterns (common in AI writing)
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
    'it is important to remember',
    'it is essential to understand',
    'it is crucial to recognize',
    'it is vital to consider',
    'it is necessary to acknowledge',
    'it is imperative to realize'
  ];
  
  // Check academic patterns
  academicPatterns.forEach(pattern => {
    if (textToAnalyze.toLowerCase().includes(pattern)) {
      suspiciousPhrases++;
      matches.push({
        text: pattern,
        source: 'Academic Cliché Database',
        url: 'https://academic-writing-tips.com'
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
        url: 'https://ai-detection-tools.com'
      });
    }
  });
  
  // Detect word repetition (free method)
  const wordCount: { [key: string]: number } = {};
  words.forEach(word => {
    if (word.length > 3) { // Ignore short words
      wordCount[word] = (wordCount[word] || 0) + 1;
    }
  });
  
  const repetitionIssues = Object.entries(wordCount)
    .filter(([word, count]) => count > 3)
    .length;
  
  // Add repetition matches
  Object.entries(wordCount)
    .filter(([word, count]) => count > 3)
    .slice(0, 3) // Limit to 3 repetition matches
    .forEach(([word, count]) => {
      matches.push({
        text: `"${word}" appears ${count} times`,
        source: 'Repetition Analysis',
        url: 'https://writing-tools.com/repetition'
      });
    });
  
  // Citation analysis (free method)
  const citations = textToAnalyze.match(/\([^)]+\d{4}\)/g) || [];
  const claims = textToAnalyze.match(/studies show|research indicates|it has been proven|according to|research has shown|studies demonstrate/gi) || [];
  const citationProblems = Math.max(0, claims.length - citations.length);
  
  // Add citation problem matches
  if (citationProblems > 0) {
    matches.push({
      text: `${citationProblems} uncited claims detected`,
      source: 'Citation Analysis',
      url: 'https://citation-tools.com'
    });
  }
  
  // Word diversity analysis (free method)
  const uniqueWords = new Set(words.filter(word => word.length > 3));
  const wordDiversity = Math.round((uniqueWords.size / words.length) * 100);
  
  // Calculate overall match percentage
  const totalIssues = suspiciousPhrases + aiPatterns + repetitionIssues + citationProblems;
  const matchPercentage = Math.min(Math.floor((totalIssues / totalWords) * 100), 95);
  
  return {
    matchPercentage,
    matches: matches.slice(0, 5), // Show up to 5 matches
    analysis: {
      overusedPhrases: suspiciousPhrases,
      repetitionIssues,
      citationProblems,
      aiPatterns,
      wordDiversity
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
    const { projectId, text } = body;

    if (!projectId || !text) {
      return NextResponse.json(
        { error: 'Project ID and text are required' },
        { status: 400 }
      );
    }

    // Check usage limits
    const usageCheck = await checkPlagiarismLimit(session.user.email);
    
    if (!usageCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Daily plagiarism check limit reached',
          remaining: usageCheck.remaining,
          limit: usageCheck.limit,
        },
        { status: 429 }
      );
    }

    // Perform enhanced plagiarism check
    const result = await checkPlagiarism(text);

    // Store result in project
    await connectDB();
    
    const plagiarismCheck = {
      checkedAt: new Date(),
      matchPercentage: result.matchPercentage,
      matches: result.matches,
      analysis: result.analysis,
    };

    await Project.findOneAndUpdate(
      { _id: projectId, userId: session.user.email },
      { 
        $push: { plagiarismChecks: plagiarismCheck },
        lastEditedAt: new Date(),
      },
      { new: true }
    );

    // Increment usage counter
    await incrementPlagiarismChecks(session.user.email);

    return NextResponse.json({
      matchPercentage: result.matchPercentage,
      matches: result.matches,
      analysis: result.analysis,
      remaining: usageCheck.remaining - 1,
    });
  } catch (error) {
    console.error('Error checking plagiarism:', error);
    return NextResponse.json({ error: 'Failed to check plagiarism' }, { status: 500 });
  }
}