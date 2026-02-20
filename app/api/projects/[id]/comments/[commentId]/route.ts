import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import ReviewComment from '@/models/ReviewComment';
import mongoose from 'mongoose';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id, commentId } = await context.params;
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(commentId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    await connectDB();

    // Verify project ownership
    const project = await Project.findOne({
      _id: id,
      userId: session.user.email,
    }).select('_id').lean();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Verify comment belongs to this project
    const comment = await ReviewComment.findOne({
      _id: commentId,
      projectId: id,
    }).lean();

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const body = await request.json();
    const { action, content } = body;

    if (action === 'resolve') {
      await ReviewComment.updateOne(
        { _id: commentId },
        { $set: { status: 'resolved' } }
      );
      return NextResponse.json({ success: true, status: 'resolved' });
    }

    if (action === 'reopen') {
      await ReviewComment.updateOne(
        { _id: commentId },
        { $set: { status: 'open' } }
      );
      return NextResponse.json({ success: true, status: 'open' });
    }

    if (action === 'reply') {
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return NextResponse.json({ error: 'Reply content is required' }, { status: 400 });
      }

      if (content.length > 5000) {
        return NextResponse.json({ error: 'Reply must be under 5000 characters' }, { status: 400 });
      }

      const reply = await ReviewComment.create({
        shareLinkId: comment.shareLinkId,
        projectId: id,
        sectionId: comment.sectionId,
        advisorName: comment.advisorName,
        advisorSessionId: comment.advisorSessionId,
        commentType: comment.commentType,
        content: content.trim(),
        parentCommentId: commentId,
        authorType: 'student',
        authorEmail: session.user.email,
        status: 'open',
      });

      return NextResponse.json({ reply: reply.toObject() }, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
  }
}
