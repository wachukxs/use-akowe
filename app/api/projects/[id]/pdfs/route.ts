import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import User from '@/models/User';
import { generateId } from '@/lib/utils';

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

    await connectDB();

    // Check user's plan and PDF limits
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const project = await Project.findOne({
      _id: id,
      userId: session.user.email,
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // PDF functionality removed - no limits needed
    // const limits = PLAN_LIMITS[user.plan];

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    // In production, upload to S3, GCS, or similar
    // For now, store metadata only
    const pdfData = {
      id: generateId(),
      filename: file.name,
      url: `/uploads/${id}/${file.name}`, // Mock URL
      uploadedAt: new Date(),
      size: file.size,
    };

    await Project.findOneAndUpdate(
      { _id: id, userId: session.user.email },
      { 
        $push: { pdfs: pdfData },
        lastEditedAt: new Date(),
      },
      { new: true }
    );

    return NextResponse.json(pdfData);
  } catch (error) {
    console.error('Error uploading PDF:', error);
    return NextResponse.json({ error: 'Failed to upload PDF' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const project = await Project.findOne({
      _id: id,
      userId: session.user.email,
    }).lean();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(project.pdfs || []);
  } catch (error) {
    console.error('Error fetching PDFs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
    const pdfId = searchParams.get('pdfId');

    if (!pdfId) {
      return NextResponse.json({ error: 'PDF ID is required' }, { status: 400 });
    }

    await connectDB();

    const project = await Project.findOneAndUpdate(
      { _id: id, userId: session.user.email },
      { 
        $pull: { pdfs: { id: pdfId } },
        lastEditedAt: new Date(),
      },
      { new: true }
    );

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting PDF:', error);
    return NextResponse.json({ error: 'Failed to delete PDF' }, { status: 500 });
  }
}

