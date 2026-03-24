import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import ShareLink from '@/models/ShareLink';
import ReviewComment from '@/models/ReviewComment';
import mongoose from 'mongoose';
import { generateShareToken } from '@/lib/share-token';

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

    // Get all share links for this project
    const links = await ShareLink.find({
      projectId: id,
      userId: session.user.email,
    })
      .sort({ createdAt: -1 })
      .lean();

    // Get comment counts per share link
    const linkIds = links.map((l) => l._id);
    const commentCounts = await ReviewComment.aggregate([
      { $match: { shareLinkId: { $in: linkIds }, authorType: 'advisor' } },
      { $group: { _id: '$shareLinkId', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(commentCounts.map((c: any) => [c._id.toString(), c.count]));

    const linksWithCounts = links.map((link) => ({
      ...link,
      commentCount: countMap.get(link._id!.toString()) || 0,
    }));

    return NextResponse.json({ links: linksWithCounts });
  } catch (error) {
    console.error('Error fetching share links:', error);
    return NextResponse.json({ error: 'Failed to fetch share links' }, { status: 500 });
  }
}

export async function POST(
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

    const body = await request.json();
    const { advisorName, advisorEmail, sectionIds, expiryDays, rubric } = body;

    if (!advisorName || typeof advisorName !== 'string' || !advisorName.trim()) {
      return NextResponse.json({ error: 'Advisor name is required' }, { status: 400 });
    }

    await connectDB();

    // Verify ownership
    const project = await Project.findOne({
      _id: id,
      userId: session.user.email,
    }).select('_id sections').lean();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Validate sectionIds if provided
    if (sectionIds && Array.isArray(sectionIds) && sectionIds.length > 0) {
      const validIds = new Set(project.sections.map((s: any) => s.id));
      const invalid = sectionIds.filter((id: string) => !validIds.has(id));
      if (invalid.length > 0) {
        return NextResponse.json({ error: 'Invalid section IDs' }, { status: 400 });
      }
    }

    const days = Math.min(Math.max(expiryDays || 30, 1), 90);
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const token = generateShareToken();

    // Validate and sanitize rubric questions if provided
    const sanitizedRubric =
      Array.isArray(rubric)
        ? rubric
            .filter((q: unknown) => typeof q === 'string' && (q as string).trim())
            .map((q: string) => q.trim().slice(0, 300))
            .slice(0, 8)
        : undefined;

    const shareLink = await ShareLink.create({
      projectId: id,
      userId: session.user.email,
      token,
      advisorName: advisorName.trim(),
      advisorEmail: advisorEmail?.trim() || undefined,
      sectionIds: sectionIds || [],
      expiresAt,
      rubric: sanitizedRubric && sanitizedRubric.length > 0 ? sanitizedRubric : undefined,
    });

    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://useakowe.com';
    const shareUrl = `${baseUrl}/review/${token}`;

    return NextResponse.json({
      link: shareLink.toObject(),
      shareUrl,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating share link:', error);
    return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 });
  }
}
