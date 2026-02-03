import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import OpenAI from 'openai';
import { checkAIWordLimit, incrementAIWords } from '@/lib/usage';
import { countWords } from '@/lib/utils';
import User from '@/models/User';
import connectDB from '@/lib/mongodb';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { prompt, context, sectionType } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(session.user.id);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check usage limits for free users
    const usageCheck = await checkAIWordLimit(session.user.id, 500);
    
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

    // Determine which model to use based on plan
    const model = user.plan === 'free' ? 'gpt-3.5-turbo' : 'gpt-4o-mini';

    // Create system prompt based on section type
    const systemPrompt = `You are a senior academic writer with expertise in ${sectionType || 'research writing'}. Your job is to produce high-quality, publication-ready content that demonstrates deep understanding and scholarly rigor.

YOUR WRITING STANDARDS:
- Write at a graduate/professional level with sophisticated analysis
- Every claim should be substantive and defensible
- Use precise academic language (not flowery or vague)
- Build logical arguments with clear reasoning
- Incorporate domain-specific terminology appropriately
- Show critical thinking, not just description

CONTENT REQUIREMENTS:
- Make specific, evidence-based arguments (not generic statements)
- Include concrete examples, data points, or theoretical frameworks
- Show awareness of academic debates and perspectives
- Write with authority and expertise in the subject matter
- Ensure every paragraph advances the argument
- Make content citation-ready (mark where citations are needed)

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

QUALITY CHECKLIST FOR YOUR OUTPUT:
1. Does this sound like it's from a published academic paper?
2. Are arguments specific and substantive (not generic)?
3. Is technical terminology used correctly and naturally?
4. Would a professor be impressed by the depth of analysis?
5. Are there clear logical connections between ideas?

Write with the authority of a subject matter expert. Produce content that demonstrates genuine understanding, not surface-level knowledge.`;

    // Generate content
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: context ? `Context: ${context}\n\nPrompt: ${prompt}` : prompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    let generatedText = completion.choices[0]?.message?.content || '';
    
    // Clean AI-sounding phrases from generated content
    generatedText = generatedText
      // Remove AI opening phrases
      .replace(/^(I understand|I can help|Here's|Let me|I'll|Based on|Looking at|I see that).*?[.!?]\s*/gm, '')
      .replace(/^(That's a great question|Great question|Good question|Excellent question).*?[.!?]\s*/gm, '')
      .replace(/^(I hope this helps|Let me know if|Feel free to|Don't hesitate to).*$/gm, '')
      .replace(/^(Here are some|Here's what|Here is|The key|The main|The most).*?[.!?]\s*/gm, '')
      // Remove AI-sounding academic phrases
      .replace(/delve into/gi, 'examine')
      .replace(/explore the/gi, 'look at the')
      .replace(/uncover/gi, 'find')
      .replace(/unveil/gi, 'reveal')
      .replace(/shed light on/gi, 'clarify')
      .replace(/Furthermore/gi, 'Also')
      .replace(/Moreover/gi, 'Additionally')
      .replace(/It is important to note/gi, 'Note that')
      .replace(/It should be noted/gi, 'Note that')
      .replace(/It is worth noting/gi, 'Note that')
      .replace(/In order to/gi, 'To')
      .replace(/With regard to/gi, 'About')
      .replace(/In terms of/gi, 'Regarding')
      .replace(/It is evident that/gi, 'Clearly')
      .replace(/It is clear that/gi, 'Clearly')
      .replace(/It is apparent that/gi, 'Clearly')
      .replace(/As mentioned/gi, 'As noted')
      .replace(/As stated/gi, 'As noted')
      .replace(/In conclusion/gi, 'To wrap up')
      .replace(/To summarize/gi, 'In summary')
      .replace(/It is crucial/gi, 'It\'s important')
      .replace(/It is essential/gi, 'It\'s important')
      .replace(/It is vital/gi, 'It\'s important')
      .replace(/It is imperative/gi, 'It\'s important')
      .replace(/It appears that/gi, 'It looks like')
      .replace(/It seems that/gi, 'It looks like')
      .replace(/The fact that/gi, 'That')
      .replace(/The reality is that/gi, 'In reality')
      .replace(/The truth is that/gi, 'Actually')
      .trim();
    
    const wordCount = countWords(generatedText);

    // Check if this is first output (before incrementing)
    const isFirstOutput = usageCheck.remaining === usageCheck.limit;

    // Track usage
    await incrementAIWords(session.user.id, wordCount);

    // Return tracking metadata for first output
    const { createTrackingMetadata } = await import('@/lib/gtag-server');
    const tracking = createTrackingMetadata(
      isFirstOutput,
      'first_output_generated',
      {
        user_id: session.user.id,
        output_type: 'write',
      }
    );

    return NextResponse.json({
      text: generatedText,
      wordCount,
      model,
      remaining: usageCheck.remaining - wordCount,
      ...(tracking && { tracking }),
    });
  } catch (error) {
    console.error('Error generating AI text:', error);
    return NextResponse.json({ error: 'Failed to generate text' }, { status: 500 });
  }
}

