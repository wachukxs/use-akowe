import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import { generateId } from '@/lib/utils';
import { formatCitationAPA, generateCitationKey } from '@/lib/citations';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { doi, title, authors, year, journal, publisher, url } = body;

    if (!title || !authors || authors.length === 0) {
      return NextResponse.json(
        { error: 'Title and at least one author are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const citationKey = generateCitationKey({ doi, title, authors, year, journal, publisher, url });
    const citationText = formatCitationAPA({ doi, title, authors, year, journal, publisher, url });

    const newCitation = {
      id: generateId(),
      doi,
      title,
      authors,
      year,
      journal,
      publisher,
      url,
      citationKey,
      citationText,
      addedAt: new Date(),
    };

    const project = await Project.findOneAndUpdate(
      { _id: id, userId: session.user.email },
      { 
        $push: { citations: newCitation },
        lastEditedAt: new Date(),
      },
      { new: true }
    ).lean();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(newCitation);
  } catch (error) {
    console.error('Error adding citation:', error);
    return NextResponse.json({ error: 'Failed to add citation' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const citationId = searchParams.get('citationId');

    if (!citationId) {
      return NextResponse.json({ error: 'Citation ID is required' }, { status: 400 });
    }

    await connectDB();

    const project = await Project.findOneAndUpdate(
      { _id: id, userId: session.user.email },
      { 
        $pull: { citations: { id: citationId } },
        lastEditedAt: new Date(),
      },
      { new: true }
    ).lean();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing citation:', error);
    return NextResponse.json({ error: 'Failed to remove citation' }, { status: 500 });
  }
}

