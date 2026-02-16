import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import ReviewComment from '@/models/ReviewComment';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    await connectDB();

    // Verify ownership
    const project = await Project.findOne({
      _id: id,
      userId: session.user.email,
    }).select('_id').lean();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Fetch all comments for this project (top-level and replies)
    const comments = await ReviewComment.find({
      projectId: id,
    })
      .sort({ createdAt: 1 })
      .lean();

    // Separate top-level and replies
    const topLevel = comments.filter((c) => !c.parentCommentId);
    const replies = comments.filter((c) => c.parentCommentId);

    // Attach replies to parent comments
    const replyMap = new Map<string, any[]>();
    for (const reply of replies) {
      const parentId = reply.parentCommentId!.toString();
      if (!replyMap.has(parentId)) replyMap.set(parentId, []);
      replyMap.get(parentId)!.push(reply);
    }

    const commentsWithReplies = topLevel.map((comment) => ({
      ...comment,
      replies: replyMap.get(comment._id!.toString()) || [],
    }));

    return NextResponse.json({ comments: commentsWithReplies });
  } catch (error) {
    console.error('Error fetching project comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}
