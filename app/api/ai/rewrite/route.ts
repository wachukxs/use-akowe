import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import OpenAI from 'openai';
import { checkAIWordLimit, checkParaphraseLimit, incrementParaphraseUses } from '@/lib/usage';
import { countWords } from '@/lib/utils';
import User from '@/models/User';
import connectDB from '@/lib/mongodb';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const VALID_MODES = ['academic', 'concise', 'expanded', 'simplified'] as const;
type RewriteMode = typeof VALID_MODES[number];

const MODE_PROMPTS: Record<RewriteMode, string> = {
  academic:
    'Rewrite the following text in a formal academic tone. Maintain the original meaning and key points. Use scholarly vocabulary and passive voice where appropriate. Do not add new information.',
  concise:
    'Rewrite the following text to be more concise. Remove redundancy, tighten sentences, and eliminate filler words while preserving the core meaning. Aim for roughly 60-70% of the original length.',
  expanded:
    'Expand the following text with more detail, explanation, and supporting context. Elaborate on key points while maintaining the original tone and meaning. Aim for roughly 140-160% of the original length.',
  simplified:
    'Rewrite the following text using simpler words and shorter sentences. Make it accessible and easy to understand while preserving the core meaning. Avoid jargon and complex sentence structures.',
};

const PROMPT_SUFFIX = '\n\nReturn ONLY the rewritten text, no explanations or labels.';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { text, mode } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    if (text.length < 10) {
      return NextResponse.json({ error: 'Text is too short' }, { status: 400 });
    }

    if (text.length > 4000) {
      return NextResponse.json({ error: 'Text is too long' }, { status: 400 });
    }

    if (!mode || !VALID_MODES.includes(mode)) {
      return NextResponse.json(
        { error: 'Invalid mode. Must be one of: academic, concise, expanded, simplified' },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findById(session.user.id).lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check rewrite-specific limit (2/day free, unlimited pro/team)
    const paraphraseCheck = await checkParaphraseLimit(session.user.id);

    if (!paraphraseCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Daily rewrite limit reached',
          limitType: 'paraphrase',
          remaining: paraphraseCheck.remaining,
          limit: paraphraseCheck.limit,
        },
        { status: 429 }
      );
    }

    // Also check shared AI word limit
    const usageCheck = await checkAIWordLimit(session.user.id, 500);

    if (!usageCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Daily AI word limit reached',
          remaining: usageCheck.remaining,
          limit: usageCheck.limit,
        },
        { status: 429 }
      );
    }

    const model = user.plan === 'free' ? 'gpt-3.5-turbo' : 'gpt-4o-mini';

    const systemPrompt = MODE_PROMPTS[mode as RewriteMode] + PROMPT_SUFFIX;

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const rewrittenText = completion.choices[0]?.message?.content?.trim() || '';

    if (!rewrittenText) {
      return NextResponse.json({ error: 'Failed to generate rewrite' }, { status: 500 });
    }

    const wordCount = countWords(rewrittenText);
    const originalWordCount = countWords(text);

    await incrementParaphraseUses(session.user.id, wordCount);

    // Track activation (idempotent — only records first time)
    import('@/lib/activation-tracking').then(({ recordFirstOutputGenerated, extractAttributionFromRequest }) => {
      const attribution = extractAttributionFromRequest(request);
      recordFirstOutputGenerated(session.user!.id!, attribution).catch(() => {});
    });

    // Return remaining rewrites (after increment)
    const remainingRewrites = paraphraseCheck.limit === Infinity
      ? Infinity
      : Math.max(0, paraphraseCheck.remaining - 1);

    return NextResponse.json({
      rewrittenText,
      wordCount,
      originalWordCount,
      remainingRewrites,
      rewriteLimit: paraphraseCheck.limit,
    });
  } catch (error) {
    console.error('Error in rewrite API:', error);
    return NextResponse.json({ error: 'Failed to generate rewrite' }, { status: 500 });
  }
}
