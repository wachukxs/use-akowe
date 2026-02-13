import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import OpenAI from 'openai';
import { checkAIWordLimit, incrementAIWords } from '@/lib/usage';
import { countWords } from '@/lib/utils';
import { buildSynthesisPrompt, cleanSynthesisResponse } from '@/lib/lit-review';
import User from '@/models/User';
import connectDB from '@/lib/mongodb';
import type { LitReviewSynthesis } from '@/types';

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
    const { type, theme, gap, topic, methodology, citationStyle, allCitationTexts } = body;

    if (!type || !topic) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (type === 'theme' && !theme) {
      return NextResponse.json({ error: 'Theme data is required' }, { status: 400 });
    }

    if (type === 'gap' && !gap) {
      return NextResponse.json({ error: 'Gap data is required' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(session.user.id).lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check shared AI word limit (estimate ~200 words for synthesis)
    const usageCheck = await checkAIWordLimit(session.user.id, 200);
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

    const promptData: {
      theme?: {
        name: string;
        description: string;
        papers: Array<{
          title: string;
          citationText: string;
          stance: string;
          reasoning: string;
        }>;
      };
      gap?: {
        title: string;
        description: string;
        suggestion: string;
      };
    } = {};

    if (type === 'theme' && theme) {
      // Map citation IDs to their formatted citation texts
      const citationTextMap = new Map<string, string>();
      if (allCitationTexts) {
        for (const ct of allCitationTexts) {
          citationTextMap.set(ct.citationId, ct.citationText);
        }
      }

      promptData.theme = {
        name: theme.name,
        description: theme.description,
        papers: (theme.papers || []).map((p: { citationId: string; title?: string; citationText?: string; stance: string; reasoning: string }) => ({
          title: p.title || 'Untitled',
          citationText: p.citationText || citationTextMap.get(p.citationId) || p.citationId,
          stance: p.stance,
          reasoning: p.reasoning,
        })),
      };
    } else {
      promptData.gap = {
        title: gap.title,
        description: gap.description,
        suggestion: gap.suggestion,
      };
    }

    const { system, user: userPrompt } = buildSynthesisPrompt(
      type,
      promptData,
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
      temperature: 0.7,
      max_tokens: 400,
    });

    const rawResponse = completion.choices[0]?.message?.content || '';

    if (!rawResponse) {
      return NextResponse.json(
        { error: 'Synthesis failed. Please try again.' },
        { status: 500 }
      );
    }

    const paragraph = cleanSynthesisResponse(rawResponse);
    const wordCount = countWords(paragraph);

    // Track AI word usage
    await incrementAIWords(session.user.id, wordCount);

    // Extract which citations were referenced in the output
    const citationsUsed: string[] = [];
    if (allCitationTexts) {
      for (const ct of allCitationTexts) {
        if (paragraph.includes(ct.citationText) || paragraph.includes(ct.citationId)) {
          citationsUsed.push(ct.citationId);
        }
      }
    }

    const synthesis: LitReviewSynthesis = {
      paragraph,
      wordCount,
      citationsUsed,
      sourceThemeId: type === 'theme' ? theme?.id : undefined,
      sourceGapId: type === 'gap' ? gap?.id : undefined,
    };

    return NextResponse.json({
      synthesis,
      remaining: usageCheck.remaining - wordCount,
      model,
    });
  } catch (error) {
    console.error('Error in lit review synthesis:', error);
    return NextResponse.json(
      { error: 'Synthesis failed. Please try again.' },
      { status: 500 }
    );
  }
}
