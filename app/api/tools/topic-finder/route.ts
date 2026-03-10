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
  aiInsights?: string;
  feasibilityNote?: string;
  isLocked?: boolean;
}

// Free tier: Return limited results to encourage signup
// Pro tier: Return full analysis with AI-powered gap detection
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const isAuthenticated = !!session?.user?.email;
    
    const body = await request.json();
    const { topic, projectType = 'thesis', methodology, areasOfInterest } = body;

    // Validate areasOfInterest if provided
    const validatedAreas: string[] = Array.isArray(areasOfInterest)
      ? areasOfInterest.filter((a: any) => typeof a === 'string' && a.trim()).map((a: string) => a.trim()).slice(0, 5)
      : [];

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

    let userPlan: 'free' | 'standard' | 'pro' | 'team' = 'free';
    let usageCount = 0;
    let limit = 1; // Free tier: 1 search per day

    if (isAuthenticated) {
      await connectDB();
      const user = await User.findOne({ email: session.user.email });
      if (user) {
        userPlan = (user.plan as 'free' | 'standard' | 'pro' | 'team') || 'free';
        
        // Track usage for free users with atomic operation to prevent race conditions
        if (userPlan === 'free') {
          // Use UTC date strings for timezone-safe day comparison
          const todayStr = new Date().toISOString().split('T')[0];
          const storedDate = user.topicFinderUsage?.date;
          const storedStr = storedDate ? new Date(storedDate).toISOString().split('T')[0] : null;
          const isNewDay = storedStr !== todayStr;
          const currentCount = isNewDay ? 0 : (user.topicFinderUsage?.count ?? 0);

          if (currentCount >= limit) {
            return NextResponse.json(
              {
                error: 'Daily limit reached',
                usageCount: currentCount,
                limit,
                message: 'Upgrade to Standard or Pro for unlimited topic suggestions',
              },
              { status: 429 }
            );
          }

          const updatedUser = await User.findOneAndUpdate(
            { _id: user._id },
            isNewDay
              ? { $set: { 'topicFinderUsage.date': new Date(), 'topicFinderUsage.count': 1 } }
              : { $inc: { 'topicFinderUsage.count': 1 } },
            { new: true }
          );

          usageCount = updatedUser?.topicFinderUsage?.count ?? 1;
        } else {
          limit = Infinity; // Pro users have unlimited
        }
      }
    }

    const isPro = userPlan === 'pro' || userPlan === 'team' || userPlan === 'standard';

    // Search for similar papers — include area-of-interest queries if provided
    const primarySearch = searchOpenAlex(trimmedTopic);
    const areaSearches = validatedAreas.slice(0, 2).map(area =>
      searchOpenAlex(`${trimmedTopic} ${area}`)
    );
    const [primaryPapers, ...areaPaperSets] = await Promise.all([primarySearch, ...areaSearches]);

    // Merge and deduplicate by title
    const allPapers = [...primaryPapers];
    for (const set of areaPaperSets) {
      for (const paper of set) {
        if (!allPapers.some(p => p.title === paper.title)) {
          allPapers.push(paper);
        }
      }
    }
    const similarPapers = allPapers;

    // Show up to 10 papers for all users
    const papersToAnalyze = isPro ? similarPapers.slice(0, 20) : similarPapers.slice(0, 10);
    
    // Calculate uniqueness score — logarithmic curve so 0 papers → 85, 50 papers → ~51
    const totalSimilar = similarPapers.length;
    const uniquenessScore = totalSimilar === 0
      ? 85
      : Math.max(20, Math.round(85 - Math.log10(totalSimilar + 1) * 20));
    
    // Identify research gaps
    const gaps: ResearchGap[] = await identifyGaps(
      papersToAnalyze,
      trimmedTopic,
      projectType,
      methodology,
      isPro
    );
    
    // Generate topic suggestions — always AI-powered, always 3 suggestions
    const suggestions: TopicSuggestion[] = await generateTopicSuggestions(
      trimmedTopic,
      projectType,
      methodology,
      papersToAnalyze,
      gaps,
      validatedAreas
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

        // Track activation (idempotent — only records first time)
        import('@/lib/activation-tracking').then(({ recordFirstOutputGenerated, extractAttributionFromRequest }) => {
          const attribution = extractAttributionFromRequest(request);
          recordFirstOutputGenerated(user._id!.toString(), attribution).catch(() => {});
        });
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
        journal: paper.journal,
        url: paper.url,
        similarity: Math.max(30, 100 - (index * 10)),
      })),
      // All users get 3 suggestions; free users have suggestions[1+] locked (titles visible, details hidden)
      suggestions: isPro
        ? suggestions
        : suggestions.map((s, i) =>
            i === 0
              ? s
              : { ...s, isLocked: true, researchQuestion: '', whyUnique: '', aiInsights: undefined, feasibilityNote: undefined }
          ),
      gaps: isPro ? gaps : gaps.slice(0, 2), // Pro: all, Free: 2
      totalSimilarPapers: totalSimilar,
      isLimited: !isPro,
      isPro,
      usageCount: isPro ? undefined : usageCount,
      limit: isPro ? undefined : limit,
      message: isPro 
        ? undefined 
        : 'Upgrade to Standard or Pro for unlimited suggestions + AI-powered research gap analysis',
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
  areasOfInterest: string[] = []
): Promise<TopicSuggestion[]> {
  const papersContext = similarPapers.slice(0, 10)
    .map(p => `- "${p.title}"${p.year ? ` (${p.year})` : ''}${p.journal ? `, ${p.journal}` : ''}`)
    .join('\n') || 'No similar papers found — this may be a relatively unexplored area.';

  const gapsContext = gaps.length > 0
    ? gaps.map(g => `- ${g.type}: ${g.description}`).join('\n')
    : 'No specific gaps detected — broad opportunity for original research.';

  const areasContext = areasOfInterest.length > 0
    ? `\nAreas to blend in: ${areasOfInterest.join(', ')} — at least one suggestion should take an interdisciplinary angle combining these with the main topic.`
    : '';

  const prompt = `You are an expert academic advisor helping a student find a unique, researchable topic.

Student topic area: "${topic}"
Project type: ${projectType}
Methodology: ${methodology || 'any'}${areasContext}

Existing literature found (${similarPapers.length} papers):
${papersContext}

Identified research gaps:
${gapsContext}

Generate exactly 3 specific, unique research topic suggestions. Requirements:
1. Each topic must NOT duplicate what the papers above already cover
2. Research questions must be specific and supervisor-approvable — use precise framing like "To what extent does [X] affect [Y] among [specific population] in [context]?" rather than vague questions
3. whyUnique MUST reference the actual papers found above by author/year where possible — e.g. "While Smith (2019) examined X, no study has addressed Y"
4. Vary the angles across the 3 suggestions: e.g. one methodological, one geographic/demographic, one theoretical or interdisciplinary
5. feasibilityNote should guide the student on scope and data availability — e.g. "Strong literature base of ${similarPapers.length} papers to build on" or "Emerging area — original data collection will likely be needed"

Respond ONLY with this JSON structure:
{"suggestions": [{"title": "", "researchQuestion": "", "uniquenessScore": 70, "whyUnique": "", "aiInsights": "", "feasibilityNote": ""}]}`;

  if (process.env.OPENAI_API_KEY) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an expert academic advisor. Always respond with valid JSON only, no extra text.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      });

      const raw = completion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(raw);
      const items: any[] = Array.isArray(parsed)
        ? parsed
        : (parsed.suggestions || parsed.topics || Object.values(parsed).find(Array.isArray) || []);

      if (Array.isArray(items) && items.length > 0) {
        return items.slice(0, 3).map((s: any) => ({
          title: String(s.title || topic),
          researchQuestion: String(s.researchQuestion || ''),
          uniquenessScore: Math.min(95, Math.max(50, Number(s.uniquenessScore) || 70)),
          whyUnique: String(s.whyUnique || ''),
          aiInsights: s.aiInsights ? String(s.aiInsights) : undefined,
          feasibilityNote: s.feasibilityNote ? String(s.feasibilityNote) : undefined,
          gaps: [],
        }));
      }
    } catch (aiError) {
      console.error('AI topic generation error:', aiError);
    }
  }

  // Fallback to templates if AI fails or API key missing
  return buildFallbackSuggestions(topic, methodology, gaps);
}

function buildFallbackSuggestions(
  topic: string,
  methodology: string | undefined,
  gaps: ResearchGap[]
): TopicSuggestion[] {
  const suggestions: TopicSuggestion[] = [];
  const year = new Date().getFullYear();

  if (gaps.length > 0) {
    gaps.slice(0, 3).forEach((gap, index) => {
      let title = topic;
      let researchQuestion = '';
      let whyUnique = '';

      switch (gap.type) {
        case 'temporal':
          title = `${topic}: A Contemporary Analysis (${year - 4}–${year})`;
          researchQuestion = `How has ${topic} changed over the last five years, and what are the emerging trends?`;
          whyUnique = 'Focuses on recent developments with limited coverage in older literature';
          break;
        case 'methodology':
          const methodLabel = (methodology || 'qualitative');
          title = `${topic}: A ${methodLabel.charAt(0).toUpperCase() + methodLabel.slice(1)} Study`;
          researchQuestion = `What does a ${methodLabel} approach reveal about ${topic} that quantitative studies have not captured?`;
          whyUnique = `Applies ${methodLabel} methodology rarely used in this area`;
          break;
        case 'geographic':
          title = `${topic}: A Regional Perspective`;
          researchQuestion = `How does ${topic} manifest differently across regional contexts?`;
          whyUnique = 'Addresses geographic gap in the existing literature';
          break;
        case 'demographic':
          title = `${topic}: A Population-Specific Analysis`;
          researchQuestion = `How does ${topic} affect a specific demographic group compared to the general population?`;
          whyUnique = 'Targets a demographic underrepresented in current research';
          break;
        default:
          title = `${topic}: An Integrated Perspective`;
          researchQuestion = `What are the key factors driving ${topic} and how do they interact?`;
          whyUnique = 'Synthesises multiple perspectives absent from existing single-focus studies';
      }

      suggestions.push({ title, researchQuestion, uniquenessScore: Math.max(65 - index * 5, 55), whyUnique, gaps: [gap] });
    });
  }

  while (suggestions.length < 3) {
    suggestions.push({
      title: `${topic}: A Comprehensive Analysis`,
      researchQuestion: `What are the current state and future directions of research on ${topic}?`,
      uniquenessScore: 60,
      whyUnique: 'Provides a broad synthesis not available in narrower existing studies',
      gaps: [],
    });
  }

  return suggestions.slice(0, 3);
}
