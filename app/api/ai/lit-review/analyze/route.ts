import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import OpenAI from 'openai';
import { checkAIWordLimit, checkLitReviewLimit, incrementLitReviewUses } from '@/lib/usage';
import { countWords } from '@/lib/utils';
import { validateAnalysisRequest, buildAnalysisPrompt, parseAnalysisResponse } from '@/lib/lit-review';
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
    const { citations, topic, methodology, citationStyle } = body;

    if (!topic || !citations) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate citation count
    const validation = validateAnalysisRequest(citations);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error, minCitations: 3 },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findById(session.user.id).lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check lit review analysis limit
    const litReviewCheck = await checkLitReviewLimit(session.user.id);
    if (!litReviewCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Daily analysis limit reached',
          limitType: 'litReview',
          remaining: litReviewCheck.remaining,
          limit: litReviewCheck.limit,
          upgradeRequired: true,
        },
        { status: 429 }
      );
    }

    // Check shared AI word limit (estimate ~800 words for analysis)
    const usageCheck = await checkAIWordLimit(session.user.id, 800);
    if (!usageCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Daily AI word limit reached',
          remaining: usageCheck.remaining,
          limit: usageCheck.limit,
          upgradeRequired: true,
        },
        { status: 429 }
      );
    }

    const model = user.plan === 'free' ? 'gpt-3.5-turbo' : 'gpt-4o-mini';
    const { system, user: userPrompt } = buildAnalysisPrompt(
      validation.filtered,
      topic,
      methodology || 'general',
      citationStyle || 'APA'
    );

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.4,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const rawResponse = completion.choices[0]?.message?.content || '';

    if (!rawResponse) {
      return NextResponse.json(
        { error: 'Analysis failed. Please try again.' },
        { status: 500 }
      );
    }

    const validIds = new Set(validation.filtered.map((c) => c.id));
    let analysis = parseAnalysisResponse(rawResponse, validIds);

    // Retry once with a simpler prompt if parsing failed
    if (!analysis) {
      const retryCompletion = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userPrompt + '\n\nIMPORTANT: Return ONLY valid JSON. No markdown, no code blocks.' },
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      });

      const retryRaw = retryCompletion.choices[0]?.message?.content || '';
      analysis = parseAnalysisResponse(retryRaw, validIds);

      if (!analysis) {
        return NextResponse.json(
          { error: 'Analysis failed. Please try again.' },
          { status: 500 }
        );
      }
    }

    const wordCount = countWords(rawResponse);

    // Track usage
    await incrementLitReviewUses(session.user.id, wordCount);

    // Track activation (idempotent — only records first time)
    import('@/lib/activation-tracking').then(({ recordFirstOutputGenerated, extractAttributionFromRequest }) => {
      const attribution = extractAttributionFromRequest(request);
      recordFirstOutputGenerated(session.user!.id!, attribution).catch(() => {});
    });

    // Calculate remaining after increment
    const remainingAnalyses = litReviewCheck.limit === Infinity
      ? Infinity
      : Math.max(0, litReviewCheck.remaining - 1);

    return NextResponse.json({
      analysis,
      remaining: remainingAnalyses,
      limit: litReviewCheck.limit,
      wordCount,
      model,
    });
  } catch (error) {
    console.error('Error in lit review analysis:', error);
    return NextResponse.json(
      { error: 'Analysis failed. Please try again.' },
      { status: 500 }
    );
  }
}
