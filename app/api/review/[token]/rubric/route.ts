import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ShareLink from '@/models/ShareLink';
import RubricResponse from '@/models/RubricResponse';

async function validateShareLink(token: string) {
  const shareLink = await ShareLink.findOne({ token }).lean();
  if (!shareLink) return { error: 'Review link not found', status: 404 };
  if (shareLink.revokedAt) return { error: 'This review link has been revoked', status: 410 };
  if (new Date() > new Date(shareLink.expiresAt)) return { error: 'This review link has expired', status: 410 };
  return { shareLink };
}

// GET — fetch existing rubric response for this share link (if any)
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    await connectDB();

    const result = await validateShareLink(token);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const response = await RubricResponse.findOne({
      shareLinkId: result.shareLink._id,
    }).lean();

    return NextResponse.json({ response: response || null });
  } catch (error) {
    console.error('Error fetching rubric response:', error);
    return NextResponse.json({ error: 'Failed to fetch rubric response' }, { status: 500 });
  }
}

// POST — create or update the rubric response for this share link
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    await connectDB();

    const result = await validateShareLink(token);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { shareLink } = result;

    if (!shareLink.rubric || shareLink.rubric.length === 0) {
      return NextResponse.json({ error: 'This review link has no rubric' }, { status: 400 });
    }

    const body = await request.json();
    const { advisorName, advisorSessionId, answers } = body;

    if (!advisorName || !advisorSessionId || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // answers must be [{question, answer}] and only contain questions from the rubric
    const rubricSet = new Set(shareLink.rubric);
    const sanitized = answers
      .filter((a: { question: unknown; answer: unknown }) =>
        typeof a.question === 'string' && rubricSet.has(a.question)
      )
      .map((a: { question: string; answer: unknown }) => ({
        question: a.question,
        answer: typeof a.answer === 'string' ? a.answer.trim().slice(0, 2000) : '',
      }));

    // Upsert: one response per share link
    const response = await RubricResponse.findOneAndUpdate(
      { shareLinkId: shareLink._id },
      {
        $set: {
          projectId: shareLink.projectId,
          advisorName: advisorName.trim(),
          advisorSessionId,
          answers: sanitized,
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ response: response.toObject() }, { status: 200 });
  } catch (error) {
    console.error('Error saving rubric response:', error);
    return NextResponse.json({ error: 'Failed to save rubric response' }, { status: 500 });
  }
}
