import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import EditEvent from '@/models/EditEvent';
import mongoose from 'mongoose';
import { extractCitationsFromProject, mergeCitations } from '@/lib/citation-parser';
import crypto from 'crypto';

/** Simple content hash so we only record events when content actually changed. */
function hashSections(sections: Array<{ id: string; content?: string }>): string {
  const raw = sections.map(s => `${s.id}:${(s.content || '').length}`).join('|');
  return crypto.createHash('md5').update(raw).digest('hex').slice(0, 12);
}

/** Record an edit event asynchronously — does not block the PUT response. */
async function recordEditEvent(
  projectId: string,
  userId: string,
  sections: Array<{ id: string; title: string; content?: string }>,
  citationCount: number,
  contentHash: string
) {
  try {
    const totalWordCount = sections.reduce((sum, s) => {
      return sum + (s.content || '').split(/\s+/).filter(Boolean).length;
    }, 0);

    const sectionSnapshots = sections.map(s => ({
      sectionId: s.id,
      title: s.title,
      wordCount: (s.content || '').split(/\s+/).filter(Boolean).length,
    }));

    // Only record if content hash differs from the last event
    const lastEvent = await EditEvent.findOne({ projectId })
      .sort({ createdAt: -1 })
      .select('contentHash')
      .lean();

    if (lastEvent?.contentHash === contentHash) return; // No real change

    await EditEvent.create({
      projectId: new mongoose.Types.ObjectId(projectId),
      userId,
      totalWordCount,
      citationCount,
      sectionSnapshots,
      contentHash,
    });
  } catch {
    // Silent fail — authorship trail is non-critical
  }
}

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
    const project = await Project.findOne({ 
      _id: id, 
      userId: session.user.email 
    }).lean();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

export async function PUT(
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
    const updateData = { ...body, lastEditedAt: new Date() };

    console.log('Project update API - Received data:', { 
      citations: body.citations?.length || 0, 
      wordCount: body.wordCount,
      sections: body.sections?.length || 0 
    });

    await connectDB();
    
    // Get current project to access citation style
    const currentProject = await Project.findOne({ 
      _id: id, 
      userId: session.user.email 
    }).lean();
    
    if (!currentProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // Auto-detect citations from sections if they exist
    if (body.sections && body.sections.length > 0) {
      console.log('🔍 Auto-detecting citations from sections...');
      console.log('🔍 Citation style:', currentProject.citationStyle);
      console.log('🔍 Sections count:', body.sections.length);
      
      const detectedCitations = extractCitationsFromProject(body.sections, currentProject.citationStyle);
      console.log('🔍 Detected citations:', detectedCitations.length);
      
      if (detectedCitations.length > 0) {
        // Merge with existing citations
        const existingCitations = body.citations || currentProject.citations || [];
        console.log('🔍 Existing citations:', existingCitations.length);
        
        const mergedCitations = mergeCitations(existingCitations, detectedCitations);
        
        console.log('🔍 Merged citations:', mergedCitations.length);
        updateData.citations = mergedCitations;
      } else {
        console.log('🔍 No citations detected, keeping existing:', (body.citations || currentProject.citations || []).length);
      }
    }
    const project = await Project.findOneAndUpdate(
      { _id: id, userId: session.user.email },
      updateData,
      { new: true, runValidators: true }
    ).lean();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Fire-and-forget authorship trail recording
    if (body.sections && body.sections.length > 0) {
      const hash = hashSections(body.sections);
      const citationCount = (project.citations || []).length;
      recordEditEvent(id, session.user.email, body.sections, citationCount, hash);
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(
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
    const result = await Project.findOneAndDelete({ 
      _id: id, 
      userId: session.user.email 
    });

    if (!result) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}