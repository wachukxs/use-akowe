import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { createProjectInternal } from '@/lib/project-creation';
import { Section, Citation } from '@/types';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import { extractCitationsFromProject, mergeCitations } from '@/lib/citation-parser';

/**
 * POST /api/projects/import/confirm
 * Creates a project from imported data
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      type,
      topic,
      targetWordCount,
      citationStyle,
      methodology,
      sections: importedSections,
      citations: importedCitations,
    } = body;

    // Validate required fields
    if (!name || !type || !topic || !methodology) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Convert imported sections to Section format
    interface ImportedSection {
      title: string;
      content?: string;
      order?: number;
    }
    const sections: Section[] = (importedSections || []).map((section: ImportedSection, index: number) => ({
      id: `section-${Date.now()}-${index}`,
      type: mapSectionType(section.title),
      title: section.title,
      content: section.content || '',
      order: section.order || index + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Calculate word count from imported content
    const wordCount = sections.reduce((total, section) => {
      const words = (section.content || '').split(/\s+/).filter(w => w.length > 0).length;
      return total + words;
    }, 0);

    // Create project using shared function
    const project = await createProjectInternal(session.user.email, {
      name,
      type,
      topic,
      targetWordCount: targetWordCount || wordCount,
      citationStyle: citationStyle || 'APA',
      methodology,
      sections,
      status: 'in_progress', // Imported projects are in progress, not draft
      wordCount,
    });

    // Auto-detect citations from imported sections
    await connectDB();
    let finalCitations: Citation[] = [];
    
    // First, try to detect citations from the imported content
    const detectedCitations = extractCitationsFromProject(sections, citationStyle || 'APA');
    
    // Merge with any manually imported citations
    if (importedCitations && importedCitations.length > 0) {
      finalCitations = mergeCitations(importedCitations, detectedCitations);
    } else {
      finalCitations = detectedCitations;
    }
    
    // Update project with citations if any were found
    if (finalCitations.length > 0) {
      await Project.findOneAndUpdate(
        { _id: project._id, userId: session.user.email },
        { 
          citations: finalCitations,
          lastEditedAt: new Date()
        },
        { new: true }
      );
    }

    // Return project with citations
    const updatedProject = await Project.findOne({ 
      _id: project._id, 
      userId: session.user.email 
    }).lean();

    return NextResponse.json({ 
      project: updatedProject,
      citationsDetected: finalCitations.length 
    }, { status: 201 });
  } catch (error) {
    console.error('Error confirming import:', error);
    
    // Handle specific errors from createProjectInternal
    if (error instanceof Error) {
      if (error.message.includes('Project limit reached') || error.message.includes('Free plan allows')) {
        return NextResponse.json(
          { 
            error: 'Project limit reached',
            message: error.message
          },
          { status: 429 }
        );
      }
      if (error.message === 'User not found') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      if (error.message === 'Missing required fields') {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }
    }
    
    return NextResponse.json({ error: 'Failed to create project from import' }, { status: 500 });
  }
}

/**
 * Map section title to SectionType
 */
function mapSectionType(title: string): Section['type'] {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('introduction') || lowerTitle.includes('intro')) {
    return 'introduction';
  }
  if (lowerTitle.includes('literature') || lowerTitle.includes('review')) {
    return 'literature_review';
  }
  if (lowerTitle.includes('methodology') || lowerTitle.includes('method')) {
    return 'methodology';
  }
  if (lowerTitle.includes('result')) {
    return 'results';
  }
  if (lowerTitle.includes('discussion') || lowerTitle.includes('analysis')) {
    return 'discussion';
  }
  if (lowerTitle.includes('conclusion')) {
    return 'conclusion';
  }
  
  return 'custom';
}
