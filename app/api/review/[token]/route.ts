import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ShareLink from '@/models/ShareLink';
import Project from '@/models/Project';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;

    if (!token || token.length < 10) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    await connectDB();

    const shareLink = await ShareLink.findOne({ token }).lean();

    if (!shareLink) {
      return NextResponse.json({ error: 'Review link not found' }, { status: 404 });
    }

    if (shareLink.revokedAt) {
      return NextResponse.json({ error: 'This review link has been revoked' }, { status: 410 });
    }

    if (new Date() > new Date(shareLink.expiresAt)) {
      return NextResponse.json({ error: 'This review link has expired' }, { status: 410 });
    }

    // Fetch project
    const project = await Project.findById(shareLink.projectId)
      .select('name type topic citationStyle sections wordCount')
      .lean();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Filter sections if selective sharing
    let sections = project.sections || [];
    if (shareLink.sectionIds && shareLink.sectionIds.length > 0) {
      const allowedIds = new Set(shareLink.sectionIds);
      sections = sections.filter((s: any) => allowedIds.has(s.id));
    }

    // Sort by order
    sections.sort((a: any, b: any) => a.order - b.order);

    // Update access tracking (fire-and-forget)
    ShareLink.updateOne(
      { _id: shareLink._id },
      {
        $set: { lastAccessedAt: new Date() },
        $inc: { accessCount: 1 },
      }
    ).catch(() => {});

    return NextResponse.json({
      project: {
        name: project.name,
        type: project.type,
        topic: project.topic,
        citationStyle: project.citationStyle,
        wordCount: project.wordCount,
      },
      sections,
      advisorName: shareLink.advisorName,
      shareLinkId: shareLink._id,
      expiresAt: shareLink.expiresAt,
    });
  } catch (error) {
    console.error('Error fetching review data:', error);
    return NextResponse.json({ error: 'Failed to load review' }, { status: 500 });
  }
}
