import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import OpenAI from 'openai';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import User from '@/models/User';
import { checkAIWordLimit, incrementAIWords } from '@/lib/usage';
import { countWords } from '@/lib/utils';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, projectId } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check usage limits for free users
    // Estimate ~300 words per AI response
    const estimatedWordsToGenerate = 300;
    const usageCheck = await checkAIWordLimit(user._id.toString(), estimatedWordsToGenerate);
    
    if (!usageCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Daily word limit reached',
          remaining: usageCheck.remaining,
          limit: usageCheck.limit,
        },
        { status: 429 }
      );
    }

    // Get project context if projectId is provided
    let projectContext = '';
    let project: any = null;
    
    if (projectId) {
      project = await Project.findOne({ 
        _id: projectId, 
        userId: session.user.email 
      }).lean();

      if (project) {
        // Build comprehensive project context
        const sectionsContent = project.sections?.map((section: any) => 
          `${section.title}: ${section.content || '[Empty]'}`
        ).join('\n\n') || '';

        const citationsList = project.citations?.map((citation: any) => 
          `${citation.title} (${citation.authors}) - ${citation.year}`
        ).join('\n') || '';

        projectContext = `
PROJECT CONTEXT:
- Name: ${project.name}
- Type: ${project.type}
- Topic: ${project.topic}
- Methodology: ${project.methodology}
- Citation Style: ${project.citationStyle}
- Target Word Count: ${project.targetWordCount}
- Current Word Count: ${project.wordCount || 0}
- Status: ${project.status}

CURRENT CONTENT:
${sectionsContent}

CITATIONS:
${citationsList}

WRITING PROGRESS:
- Completion: ${Math.round(((project.wordCount || 0) / project.targetWordCount) * 100)}%
- Sections completed: ${project.sections?.filter((s: any) => s.content?.trim()).length || 0}/${project.sections?.length || 0}
`;
      }
    }

    // Determine which model to use based on plan
    const model = user.plan === 'free' ? 'gpt-3.5-turbo' : 'gpt-4o-mini';

    // Create context-aware system prompt
    const systemPrompt = `You are Akowe, a senior academic editor and writing mentor with 15+ years of experience. You provide deeply insightful, specific, and actionable feedback - not generic advice.

YOUR ROLE:
- Analyze their actual writing with specific observations
- Point out exact issues with concrete examples from their text
- Suggest precise improvements with before/after comparisons
- Challenge weak arguments and identify logical gaps
- Help strengthen structure, flow, and academic rigor

RESPONSE QUALITY STANDARDS:
- ALWAYS reference specific parts of their content when giving feedback
- Give 3-5 concrete, actionable suggestions (not vague advice)
- If critiquing, show exactly what to change and why
- If generating content, make it research-quality and citation-ready
- Be direct about weaknesses but constructive about solutions
- Explain the "why" behind your suggestions (pedagogy matters)

WHAT MAKES YOUR ADVICE VALUABLE:
- You catch subtle issues others miss (logic gaps, weak transitions, unclear arguments)
- You suggest specific phrasings, not just "improve this"
- You identify missing elements (citations needed, definitions lacking, context missing)
- You help them think like an academic, not just write like one
- You provide editorial-level feedback, not surface suggestions

AVOID THESE AI-SOUNDING WORDS AND PHRASES:
- "delve", "explore", "uncover", "unveil", "shed light on"
- "Based on the information provided", "It seems like", "Looking at"
- "I understand", "I can help", "Here's", "Let me", "I'll"
- "That's a great question", "Great question", "Excellent question"
- "I hope this helps", "Let me know if", "Feel free to", "Don't hesitate to"
- "Here are some", "Here's what", "Here is", "The key", "The main", "The most"
- "Furthermore", "Moreover", "Additionally", "In addition"
- "It is important to note", "It should be noted", "It is worth noting"
- "In order to", "In order for", "With regard to", "In terms of"
- "Comprehensive", "extensive", "thorough", "detailed analysis"
- "Significant", "substantial", "considerable", "notable"
- "It is evident that", "It is clear that", "It is apparent that"
- "As mentioned", "As stated", "As previously mentioned"
- "In conclusion", "To summarize", "To conclude"
- "It is crucial", "It is essential", "It is vital", "It is imperative"
- "It is worth mentioning", "It is important to remember"
- "In my opinion", "I believe", "I feel", "I think that"
- "It appears that", "It seems that", "It looks like"
- "The fact that", "The reality is that", "The truth is that"

USE THESE HUMAN-SOUNDING ALTERNATIVES INSTEAD:
- Instead of "delve into" → "examine" or "look at"
- Instead of "explore" → "check out" or "investigate"
- Instead of "uncover" → "find" or "discover"
- Instead of "Furthermore" → "Also" or "Plus"
- Instead of "It is important to note" → "Note that" or "Remember"
- Instead of "In order to" → "To" or "For"
- Instead of "It is evident that" → "Clearly" or "Obviously"
- Instead of "In conclusion" → "To wrap up" or "Finally"
- Instead of "It is crucial" → "It's important" or "You need to"
- Instead of "It appears that" → "It looks like" or "Seems like"
- Instead of "The fact that" → "That" or "Since"
- Instead of "Based on" → "From" or "Using"
- Instead of "Looking at" → "Checking" or "Reviewing"

${projectContext ? `
CURRENT PROJECT CONTEXT:
${projectContext}

IMPORTANT: Analyze this specific content. Reference exact sentences, point out specific issues, and give targeted suggestions. Don't give generic advice - make every suggestion directly relevant to what they've written.

EXAMPLE OF GOOD VS BAD FEEDBACK:
❌ BAD: "Your introduction could be improved. Try to make it more engaging and add more context."
✅ GOOD: "Your opening sentence 'CKD is a problem' is too vague. Start with a concrete statistic: 'Chronic Kidney Disease affects 37 million Americans (10% of adults)—yet 90% remain undiagnosed until late stages (CDC, 2023).' This immediately establishes stakes and hooks the reader. Also, your second paragraph jumps to methodology without establishing the research gap. Add a sentence explaining what previous studies missed."

See the difference? Be specific, reference their text, show exact improvements.
` : 'GENERAL ASSISTANCE: Ask clarifying questions to understand their specific needs before giving advice.'}`;

    // Build messages with project context (no chat history for cost efficiency)
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: message }
    ];

    // Generate response
    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 800,
    });

    const response = completion.choices[0]?.message?.content || '';
    const wordCount = countWords(response);

    // Track usage
    await incrementAIWords(user._id.toString(), wordCount);

    return NextResponse.json({
      response,
      wordCount,
      model,
      remaining: usageCheck.remaining - wordCount,
      projectContext: project ? {
        name: project.name,
        type: project.type,
        progress: Math.round(((project.wordCount || 0) / project.targetWordCount) * 100)
      } : null
    });
  } catch (error) {
    console.error('Error in AI Assistant:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message === 'User not found') {
        return NextResponse.json({ error: 'User not found. Please try logging in again.' }, { status: 404 });
      }
      if (error.message.includes('word limit')) {
        return NextResponse.json({ error: 'Daily word limit reached. Please upgrade your plan.' }, { status: 429 });
      }
    }
    
    return NextResponse.json({ error: 'Failed to process request. Please try again.' }, { status: 500 });
  }
}
