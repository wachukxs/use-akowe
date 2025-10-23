import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import mongoose from 'mongoose';
import { extractCitationsFromProject, mergeCitations } from '@/lib/citation-parser';

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

    await connectDB();
    
    // Get current project
    const project = await Project.findOne({ 
      _id: id, 
      userId: session.user.email 
    }).lean();
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    console.log('🔍 Manual citation detection triggered for project:', project.name);
    
    // Extract citations from all sections
    const detectedCitations = extractCitationsFromProject(project.sections, project.citationStyle);
    console.log('🔍 Detected citations:', detectedCitations.length);
    
    if (detectedCitations.length > 0) {
      // Clean up existing citations - remove malformed ones and template citations
      const existingCitations = project.citations || [];
      const cleanExistingCitations = existingCitations.filter(citation => {
        // Remove citations with malformed authors (too long or contain invalid characters)
        const hasMalformedAuthor = citation.authors.some(author => 
          author.length > 100 || 
          author.includes('\n') || 
          author.includes('.') || 
          author.includes(';')
        );
        
        // Remove template citations
        const isTemplateCitation = citation.authors.some(author => 
          author.toLowerCase().includes('smith') || 
          author.toLowerCase().includes('johnson') ||
          author.toLowerCase().includes('example') ||
          author.toLowerCase().includes('sample')
        );
        
        return !hasMalformedAuthor && !isTemplateCitation;
      });
      
      console.log('🔍 Cleaned existing citations:', cleanExistingCitations.length, 'from', existingCitations.length);
      
      // Merge clean existing citations with newly detected ones
      const mergedCitations = mergeCitations(cleanExistingCitations, detectedCitations);
      
      console.log('🔍 Final merged citations:', mergedCitations.length);
      
      // Update project with clean merged citations
      const updatedProject = await Project.findOneAndUpdate(
        { _id: id, userId: session.user.email },
        { 
          citations: mergedCitations,
          lastEditedAt: new Date()
        },
        { new: true, runValidators: true }
      ).lean();
      
      return NextResponse.json({ 
        success: true,
        detectedCount: detectedCitations.length,
        totalCount: mergedCitations.length,
        citations: mergedCitations,
        project: updatedProject
      });
    } else {
      // Even if no new citations detected, clean up existing malformed ones
      const existingCitations = project.citations || [];
      const cleanExistingCitations = existingCitations.filter(citation => {
        // Remove citations with malformed authors (too long or contain invalid characters)
        const hasMalformedAuthor = citation.authors.some(author => 
          author.length > 100 || 
          author.includes('\n') || 
          author.includes('.') || 
          author.includes(';')
        );
        
        // Remove template citations
        const isTemplateCitation = citation.authors.some(author => 
          author.toLowerCase().includes('smith') || 
          author.toLowerCase().includes('johnson') ||
          author.toLowerCase().includes('example') ||
          author.toLowerCase().includes('sample')
        );
        
        return !hasMalformedAuthor && !isTemplateCitation;
      });
      
      console.log('🔍 Cleaned existing citations (no new detected):', cleanExistingCitations.length, 'from', existingCitations.length);
      
      // Update project with cleaned citations if any were removed
      if (cleanExistingCitations.length !== existingCitations.length) {
        await Project.findOneAndUpdate(
          { _id: id, userId: session.user.email },
          { 
            citations: cleanExistingCitations,
            lastEditedAt: new Date()
          },
          { new: true, runValidators: true }
        ).lean();
      }
      
      return NextResponse.json({ 
        success: true,
        detectedCount: 0,
        totalCount: cleanExistingCitations.length,
        message: 'No citations detected in content',
        project: project
      });
    }
    
  } catch (error) {
    console.error('Error detecting citations:', error);
    return NextResponse.json({ error: 'Failed to detect citations' }, { status: 500 });
  }
}
