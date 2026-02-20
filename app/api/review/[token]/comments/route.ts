import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ShareLink from '@/models/ShareLink';
import ReviewComment from '@/models/ReviewComment';

async function validateShareLink(token: string) {
  const shareLink = await ShareLink.findOne({ token }).lean();

  if (!shareLink) return { error: 'Review link not found', status: 404 };
  if (shareLink.revokedAt) return { error: 'This review link has been revoked', status: 410 };
  if (new Date() > new Date(shareLink.expiresAt)) return { error: 'This review link has expired', status: 410 };

  return { shareLink };
}

export async function GET(
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

    const comments = await ReviewComment.find({
      shareLinkId: result.shareLink._id,
    })
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error fetching review comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

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
    const body = await request.json();
    const { advisorName, advisorSessionId, sectionId, commentType, content, textAnchor } = body;

    // Validate required fields
    if (!advisorName || !advisorSessionId || !sectionId || !commentType || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['inline', 'general'].includes(commentType)) {
      return NextResponse.json({ error: 'Invalid comment type' }, { status: 400 });
    }

    if (typeof content !== 'string' || content.trim().length === 0 || content.length > 5000) {
      return NextResponse.json({ error: 'Comment must be 1-5000 characters' }, { status: 400 });
    }

    // Validate section is in shared scope
    if (shareLink.sectionIds && shareLink.sectionIds.length > 0) {
      if (!shareLink.sectionIds.includes(sectionId)) {
        return NextResponse.json({ error: 'Section not shared' }, { status: 403 });
      }
    }

    // Validate textAnchor for inline comments
    if (commentType === 'inline') {
      if (!textAnchor || !textAnchor.selectedText || typeof textAnchor.startOffset !== 'number') {
        return NextResponse.json({ error: 'Inline comments require text anchor data' }, { status: 400 });
      }
    }

    const comment = await ReviewComment.create({
      shareLinkId: shareLink._id,
      projectId: shareLink.projectId,
      sectionId,
      advisorName: advisorName.trim(),
      advisorSessionId,
      commentType,
      textAnchor: commentType === 'inline' ? textAnchor : undefined,
      content: content.trim(),
      authorType: 'advisor',
      status: 'open',
    });

    // Fire-and-forget: notify student
    import('@/lib/review-notification').then(({ maybeNotifyStudentOfComment }) => {
      maybeNotifyStudentOfComment(shareLink._id!.toString()).catch(() => {});
    }).catch(() => {});

    return NextResponse.json({ comment: comment.toObject() }, { status: 201 });
  } catch (error) {
    console.error('Error creating review comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
