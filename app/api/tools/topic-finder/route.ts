import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import DailyUsage from '@/models/DailyUsage';
import { searchOpenAlex } from '@/lib/citations';
import { format } from 'date-fns';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ResearchGap {
  type: 'methodology' | 'geographic' | 'temporal' | 'demographic' | 'theoretical';
  description: string;
  severity: 'high' | 'medium' | 'low';
  aiAnalysis?: string; // Pro feature
}

interface TopicSuggestion {
  title: string;
  researchQuestion: string;
  uniquenessScore: number;
  whyUnique: string;
  gaps: ResearchGap[];
  aiInsights?: string; // Pro feature
}

// Free tier: Return limited results to encourage signup
// Pro tier: Return full analysis with AI-powered gap detection
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const isAuthenticated = !!session?.user?.email;
    
    const body = await request.json();
    const { topic, projectType = 'thesis', methodology } = body;

    // Validate topic
    const trimmedTopic = typeof topic === 'string' ? topic.trim() : '';
    if (!trimmedTopic || trimmedTopic.length < 3) {
      return NextResponse.json(
        { error: 'Please provide a valid research topic (at least 3 characters)' },
        { status: 400 }
      );
    }
    
    // Prevent extremely long topics that could cause performance issues
    if (trimmedTopic.length > 500) {
      return NextResponse.json(
        { error: 'Topic is too long. Please keep it under 500 characters.' },
        { status: 400 }
      );
    }

    // Validate projectType
    const validProjectTypes = ['essay', 'thesis', 'research', 'journal'];
    if (projectType && !validProjectTypes.includes(projectType)) {
      return NextResponse.json(
        { error: `Invalid project type. Must be one of: ${validProjectTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate methodology (if provided)
    const validMethodologies = ['qualitative', 'quantitative', 'mixed methods', ''];
    if (methodology && !validMethodologies.includes(methodology)) {
      return NextResponse.json(
        { error: `Invalid methodology. Must be one of: ${validMethodologies.filter(m => m).join(', ')}` },
        { status: 400 }
      );
    }

    let userPlan: 'free' | 'pro' | 'team' = 'free';
    let usageCount = 0;
    let limit = 3; // Free tier: 3 searches per day

    if (isAuthenticated) {
      await connectDB();
      const user = await User.findOne({ email: session.user.email });
      if (user) {
        userPlan = (user.plan as 'free' | 'pro' | 'team') || 'free';
        
        // Track usage for free users with atomic operation to prevent race conditions
        if (userPlan === 'free') {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todayTime = today.getTime();
          
          // Initialize usage tracking if needed
          if (!user.topicFinderUsage) {
            user.topicFinderUsage = { date: today, count: 0 };
          }
          
          // Reset if new day (compare timestamps)
          const lastUsageDate = user.topicFinderUsage.date instanceof Date 
            ? user.topicFinderUsage.date.getTime()
            : new Date(user.topicFinderUsage.date).getTime();
          
          if (lastUsageDate !== todayTime) {
            user.topicFinderUsage = { date: today, count: 0 };
          }
          
          // Check limit BEFORE incrementing (first check)
          if (user.topicFinderUsage.count >= limit) {
            return NextResponse.json(
              {
                error: 'Daily limit reached',
                usageCount: user.topicFinderUsage.count,
                limit,
                message: 'Upgrade to Pro for unlimited topic suggestions',
              },
              { status: 429 }
            );
          }
          
          // Atomically increment only if count is below limit
          // This prevents race conditions where multiple requests could exceed the limit
          const updatedUser = await User.findOneAndUpdate(
            {
              _id: user._id,
              'topicFinderUsage.count': { $lt: limit }, // Only match if count is below limit
            },
            {
              $inc: { 'topicFinderUsage.count': 1 },
              $set: { 'topicFinderUsage.date': today }, // Ensure date is set
            },
            { new: true }
          );
          
          // If update failed (null returned), it means count was already at or above limit
          if (!updatedUser) {
            // Re-fetch to get current count
            const currentUser = await User.findById(user._id);
            const currentCount = currentUser?.topicFinderUsage?.count || limit;
            
            return NextResponse.json(
              {
                error: 'Daily limit reached',
                usageCount: currentCount,
                limit,
                message: 'Upgrade to Pro for unlimited topic suggestions',
              },
              { status: 429 }
            );
          }
          
          usageCount = updatedUser.topicFinderUsage?.count || 0;
        } else {
          limit = Infinity; // Pro users have unlimited
        }
      }
    }

    const isPro = userPlan === 'pro' || userPlan === 'team';

    // Search for similar papers
    const similarPapers = await searchOpenAlex(trimmedTopic);
    
    // Use more papers for Pro users
    const papersToAnalyze = isPro ? similarPapers.slice(0, 20) : similarPapers.slice(0, 5);
    
    // Calculate uniqueness score based on similarity
    // More similar papers = lower uniqueness score
    const totalSimilar = similarPapers.length;
    const uniquenessScore = Math.max(0, Math.min(100, 100 - (totalSimilar * 2)));
    
    // Identify research gaps
    const gaps: ResearchGap[] = await identifyGaps(
      papersToAnalyze,
      trimmedTopic,
      projectType,
      methodology,
      isPro
    );
    
    // Generate topic suggestions
    const suggestions: TopicSuggestion[] = await generateTopicSuggestions(
      trimmedTopic,
      projectType,
      methodology,
      papersToAnalyze,
      gaps,
      isPro
    );

    // Track usage in DailyUsage for authenticated users
    if (isAuthenticated && session?.user?.email) {
      const user = await User.findOne({ email: session.user.email }).select('_id').lean();
      if (user) {
        const today = format(new Date(), 'yyyy-MM-dd');
        await DailyUsage.findOneAndUpdate(
          { userId: user._id.toString(), date: today },
          { $inc: { topicFinderSearches: 1 } },
          { upsert: true }
        );
      }
    }

    // Return results based on plan
    return NextResponse.json({
      topic: trimmedTopic,
      uniquenessScore: Math.round(uniquenessScore),
      similarPapers: papersToAnalyze.map((paper, index) => ({
        title: paper.title,
        year: paper.year,
        authors: paper.authors.slice(0, 2).join(', ') + (paper.authors.length > 2 ? ' et al.' : ''),
        similarity: Math.max(30, 100 - (index * 10)), // Simulated similarity scores
      })),
      suggestions: isPro ? suggestions : suggestions.slice(0, 1), // Pro: all, Free: 1
      gaps: isPro ? gaps : gaps.slice(0, 2), // Pro: all, Free: 2
      totalSimilarPapers: totalSimilar,
      isLimited: !isPro,
      isPro,
      usageCount: isPro ? undefined : usageCount,
      limit: isPro ? undefined : limit,
      message: isPro 
        ? undefined 
        : 'Upgrade to Pro for unlimited suggestions + AI-powered research gap analysis',
    });
  } catch (error: any) {
    console.error('Error in topic finder:', error);
    
    // Handle specific error types
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }
    
    // Handle database errors
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      console.error('Database error in topic finder:', error);
      return NextResponse.json(
        { error: 'Database error. Please try again later.' },
        { status: 500 }
      );
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: error.message || 'Validation error' },
        { status: 400 }
      );
    }
    
    // Generic error fallback
    return NextResponse.json(
      { error: error.message || 'Failed to analyze topic. Please try again.' },
      { status: 500 }
    );
  }
}

async function identifyGaps(
  papers: any[],
  topic: string,
  projectType: string,
  methodology?: string,
  useAI: boolean = false
): Promise<ResearchGap[]> {
  const gaps: ResearchGap[] = [];
  
  // Check temporal gaps (recent papers)
  const recentPapers = papers.filter(p => p.year && p.year >= new Date().getFullYear() - 5);
  if (recentPapers.length < 2) {
    gaps.push({
      type: 'temporal',
      description: `Limited recent research (last 5 years) - opportunity for current analysis`,
      severity: 'high',
    });
  }

  // Check methodology gaps
  if (methodology) {
    const methodKeywords = {
      'qualitative': ['qualitative', 'interview', 'case study', 'observation', 'ethnography', 'phenomenology'],
      'quantitative': ['quantitative', 'statistical', 'survey', 'experiment', 'regression', 'correlation'],
      'mixed methods': ['mixed methods', 'triangulation', 'convergent', 'sequential'],
    };
    
    const keywords = methodKeywords[methodology as keyof typeof methodKeywords] || [];
    const hasMethodMatch = papers.some(p => {
      const content = `${p.title} ${p.journal || ''}`.toLowerCase();
      return keywords.some(kw => content.includes(kw));
    });
    
    if (!hasMethodMatch) {
      gaps.push({
        type: 'methodology',
        description: `Limited ${methodology} research - opportunity for methodological contribution`,
        severity: 'high',
      });
    }
  }

  // Check geographic gaps (if topic suggests geographic focus)
  const geographicKeywords = ['region', 'country', 'nation', 'local', 'global', 'international', 'africa', 'asia', 'europe', 'america'];
  const hasGeographicFocus = geographicKeywords.some(kw => topic.toLowerCase().includes(kw));
  
  if (hasGeographicFocus && papers.length < 3) {
    gaps.push({
      type: 'geographic',
      description: 'Limited geographic coverage - opportunity for regional analysis',
      severity: 'medium',
    });
  }

  // Check demographic gaps
  const demographicKeywords = ['youth', 'elderly', 'children', 'adolescent', 'women', 'men', 'gender', 'age'];
  const hasDemographicFocus = demographicKeywords.some(kw => topic.toLowerCase().includes(kw));
  if (hasDemographicFocus && papers.filter(p => {
    const content = `${p.title} ${p.journal || ''}`.toLowerCase();
    return demographicKeywords.some(kw => content.includes(kw));
  }).length < 2) {
    gaps.push({
      type: 'demographic',
      description: 'Limited demographic coverage - opportunity for targeted population analysis',
      severity: 'medium',
    });
  }

  // AI-powered gap analysis for Pro users
  if (useAI && gaps.length > 0 && process.env.OPENAI_API_KEY) {
    try {
      const papersSummary = papers.slice(0, 10).map(p => ({
        title: p.title,
        year: p.year,
        journal: p.journal,
      }));

      const aiPrompt = `Analyze these research papers on "${topic}" and identify deeper research gaps not immediately obvious. Consider:
- Theoretical frameworks not yet applied
- Interdisciplinary connections missing
- Emerging trends not yet explored
- Methodological innovations possible
- Context-specific applications

Papers found:
${JSON.stringify(papersSummary, null, 2)}

Existing gaps identified:
${gaps.map(g => `- ${g.type}: ${g.description}`).join('\n')}

Provide 2-3 additional research gaps with brief analysis (1-2 sentences each). Format as JSON array with {type, description, severity, aiAnalysis}.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert academic researcher specializing in identifying research gaps and opportunities.' },
          { role: 'user', content: aiPrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const aiResponse = completion.choices[0]?.message?.content || '';
      
      // Try to parse AI response as JSON, fallback to text extraction
      try {
        const aiGaps = JSON.parse(aiResponse);
        if (Array.isArray(aiGaps)) {
          gaps.push(...aiGaps);
        }
      } catch {
        // If not JSON, extract insights and add to existing gaps
        gaps.forEach(gap => {
          if (!gap.aiAnalysis && aiResponse.includes(gap.type)) {
            // Extract relevant analysis from AI response
            const lines = aiResponse.split('\n');
            const relevantLine = lines.find(l => 
              l.toLowerCase().includes(gap.type) || 
              l.toLowerCase().includes(gap.description.toLowerCase().substring(0, 20))
            );
            if (relevantLine) {
              gap.aiAnalysis = relevantLine.replace(/^[-•*]\s*/, '').trim();
            }
          }
        });
      }
    } catch (aiError) {
      console.error('AI gap analysis error:', aiError);
      // Continue without AI analysis
    }
  }

  return gaps;
}

async function generateTopicSuggestions(
  topic: string,
  projectType: string,
  methodology: string | undefined,
  similarPapers: any[],
  gaps: ResearchGap[],
  useAI: boolean = false
): Promise<TopicSuggestion[]> {
  const suggestions: TopicSuggestion[] = [];
  
  // Generate suggestions based on gaps
  if (gaps.length > 0) {
    // Generate multiple suggestions for Pro users
    const gapsToUse = useAI ? gaps : gaps.slice(0, 1);
    
    gapsToUse.forEach((gap, index) => {
      let title = topic;
      let researchQuestion = '';
      let whyUnique = '';
      
      switch (gap.type) {
        case 'temporal':
          title = `${topic}: A Contemporary Analysis (${new Date().getFullYear() - 4}-${new Date().getFullYear()})`;
          researchQuestion = `How has ${topic} evolved in recent years, and what are the current trends?`;
          whyUnique = 'Focuses on recent developments not covered in older research';
          break;
        case 'methodology':
          const methodLabel = methodology || 'qualitative';
          title = `${topic}: A ${methodLabel.charAt(0).toUpperCase() + methodLabel.slice(1)} Approach`;
          researchQuestion = `What insights can ${methodLabel} research methods provide about ${topic}?`;
          whyUnique = `Uses ${methodology || methodLabel} methodology not commonly applied to this topic`;
          break;
        case 'geographic':
          title = `${topic}: A Regional Perspective`;
          researchQuestion = `How does ${topic} manifest in different geographic contexts?`;
          whyUnique = 'Addresses geographic gap in existing research';
          break;
        case 'demographic':
          title = `${topic}: A Demographic-Specific Analysis`;
          researchQuestion = `How does ${topic} affect specific demographic groups?`;
          whyUnique = 'Addresses demographic gap in existing research';
          break;
        default:
          title = `${topic}: An Integrated Analysis`;
          researchQuestion = `What are the key factors influencing ${topic}?`;
          whyUnique = 'Synthesizes multiple perspectives not found in existing research';
      }
      
      suggestions.push({
        title,
        researchQuestion,
        uniquenessScore: Math.max(70 - (index * 5), 60),
        whyUnique,
        gaps: [gap],
      });
    });
  } else {
    // Default suggestion if no gaps found
    suggestions.push({
      title: `${topic}: A Comprehensive Analysis`,
      researchQuestion: `What are the current state and future directions of ${topic}?`,
      uniquenessScore: Math.max(60, 100 - (similarPapers.length * 3)),
      whyUnique: 'Provides comprehensive analysis combining multiple research perspectives',
      gaps: [],
    });
  }

  // AI-powered topic generation for Pro users
  if (useAI && process.env.OPENAI_API_KEY && suggestions.length > 0) {
    try {
      const aiPrompt = `Generate 2-3 additional unique research topic suggestions for "${topic}" that:
- Address identified research gaps: ${gaps.map(g => g.type).join(', ')}
- Are specific and researchable
- Have clear research questions
- Explain why they're unique

Project type: ${projectType}
Methodology: ${methodology || 'any'}

Format as JSON array with {title, researchQuestion, uniquenessScore, whyUnique, aiInsights}.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert academic advisor helping researchers find unique, impactful topics.' },
          { role: 'user', content: aiPrompt },
        ],
        temperature: 0.8,
        max_tokens: 600,
      });

      const aiResponse = completion.choices[0]?.message?.content || '';
      
      try {
        const aiSuggestions = JSON.parse(aiResponse);
        if (Array.isArray(aiSuggestions)) {
          suggestions.push(...aiSuggestions.map((s: any) => ({
            ...s,
            gaps: gaps.slice(0, 1), // Associate with primary gap
          })));
        }
      } catch {
        // If not JSON, extract insights and add to existing suggestions
        suggestions.forEach(suggestion => {
          if (!suggestion.aiInsights && aiResponse.toLowerCase().includes(suggestion.title.toLowerCase().substring(0, 20))) {
            const lines = aiResponse.split('\n');
            const relevantLine = lines.find(l => 
              l.toLowerCase().includes('insight') || 
              l.toLowerCase().includes('unique') ||
              l.toLowerCase().includes('opportunity')
            );
            if (relevantLine) {
              suggestion.aiInsights = relevantLine.replace(/^[-•*]\s*/, '').trim();
            }
          }
        });
      }
    } catch (aiError) {
      console.error('AI topic generation error:', aiError);
      // Continue without AI suggestions
    }
  }
  
  return suggestions;
}
