import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { formatYearForDisplay } from '@/lib/citation-year';
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

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { citation, citationStyle = 'APA', sectionTitle } = body;

    if (!citation) {
      return NextResponse.json({ error: 'Citation is required' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email }).lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const estimatedWordsToGenerate = 50;
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

    const model = user.plan === 'free' ? 'gpt-3.5-turbo' : 'gpt-4o-mini';

    const authorsText = Array.isArray(citation.authors)
      ? citation.authors.join(', ')
      : citation.authors || 'Unknown Author';
    const yearDisplay = formatYearForDisplay(citation.year);

    let citationText = '';
    switch (citationStyle) {
      case 'APA':
        citationText = `(${authorsText}, ${yearDisplay})`;
        break;
      case 'MLA':
        citationText = `(${authorsText} ${yearDisplay})`;
        break;
      case 'Chicago':
        citationText = `(${authorsText} ${yearDisplay})`;
        break;
      case 'IEEE':
        citationText = `[${yearDisplay}]`;
        break;
      case 'Harvard':
        citationText = `(${authorsText} ${yearDisplay})`;
        break;
      default:
        citationText = `(${authorsText}, ${yearDisplay})`;
    }

    const abstractContext = citation.abstract
      ? `Abstract: ${citation.abstract}`
      : 'No abstract available. Use only the title to infer the contribution.';

    const systemPrompt = `You are an academic writing assistant. Generate 1–2 concise sentences that make a specific claim supported by the given citation. The sentences should read naturally if inserted into an academic paper.

CITATION DETAILS:
- Authors: ${authorsText}
- Year: ${yearDisplay}
- Title: ${citation.title}
- ${abstractContext}
- Citation reference: ${citationText}
- Style: ${citationStyle}
- Section context: ${sectionTitle || 'General'}

RULES:
1. Write 1–2 sentences only. Do NOT rewrite or reference any existing section content.
2. End the passage with the citation reference ${citationText}.
3. Make a specific, substantive claim drawn from the title or abstract — not a generic statement.
4. Use formal academic tone appropriate for the section context.
5. Return ONLY the generated sentences, no labels or prefixes.`;

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate a supporting passage for the citation "${citation.title}" by ${authorsText} (${yearDisplay}).` },
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    let generatedText = completion.choices[0]?.message?.content?.trim() || '';

    // Strip any unwanted prefixes the model may add
    const unwantedPrefixes = [
      'Here is',
      'Here\'s',
      'Generated passage:',
      'Supporting passage:',
    ];
    for (const prefix of unwantedPrefixes) {
      if (generatedText.toLowerCase().startsWith(prefix.toLowerCase())) {
        generatedText = generatedText.substring(prefix.length).replace(/^[:\s]+/, '').trim();
        break;
      }
    }

    const wordCount = countWords(generatedText);

    const isFirstOutput = usageCheck.remaining === usageCheck.limit;

    await incrementAIWords(user._id.toString(), wordCount);

    if (isFirstOutput) {
      const { recordFirstOutputGenerated, extractAttributionFromRequest } = await import('@/lib/activation-tracking');
      const attribution = extractAttributionFromRequest(request);
      await recordFirstOutputGenerated(user._id.toString(), attribution).catch(err => {
        console.error('Activation tracking failed:', err);
      });
    }

    return NextResponse.json({
      generatedText,
      wordCount,
      model,
      remaining: usageCheck.remaining - wordCount,
      limit: usageCheck.limit,
    });
  } catch (error) {
    console.error('Error generating citation context:', error);
    return NextResponse.json({ error: 'Failed to generate context' }, { status: 500 });
  }
}
