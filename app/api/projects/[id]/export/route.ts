import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import connectDB from '@/lib/mongodb';
import ProjectModel from '@/models/Project';
import { generateAcademicHTML, generateLaTeX, CitationStyle, AcademicTemplate, detectExportSettings } from '@/lib/export';
import { Project } from '@/types';
import puppeteer from 'puppeteer';
// @ts-expect-error - html-docx-js doesn't have TypeScript definitions
import htmlDocx from 'html-docx-js';

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

    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'html';
    
    // Get URL parameters for manual overrides
    const manualCitationStyle = searchParams.get('citationStyle') as CitationStyle;
    const manualTemplate = searchParams.get('template') as AcademicTemplate;

    await connectDB();

    const project = await ProjectModel.findOne({
      _id: id,
      userId: session.user.email,
    }).lean();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Auto-detect settings from project data
    const detectedSettings = detectExportSettings({
      ...project,
      _id: String(project._id),
    } as unknown as Project);

    // Use manual overrides if provided, otherwise use detected settings
    const finalCitationStyle = manualCitationStyle || detectedSettings.citationStyle;
    const finalTemplate = manualTemplate || detectedSettings.template;

    // Generate HTML with academic template and citation style
    const html = generateAcademicHTML({
      ...project,
      _id: String(project._id),
    } as unknown as Project, finalTemplate, finalCitationStyle);

    if (format === 'pdf') {
      try {
        // Generate PDF using puppeteer
        const browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        
        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: {
            top: '1in',
            right: '1in',
            bottom: '1in',
            left: '1in'
          }
        });
        
        await browser.close();
        
        return new NextResponse(pdfBuffer as any, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${project.name}.pdf"`,
          },
        });
      } catch (error) {
        console.error('PDF generation error:', error);
        // Fallback to HTML if PDF generation fails
        return new NextResponse(html, {
          headers: {
            'Content-Type': 'text/html',
            'Content-Disposition': `attachment; filename="${project.name}.html"`,
          },
        });
      }
    }

    if (format === 'docx') {
      try {
        // Convert HTML to DOCX using html-docx-js
        const docxBuffer = await htmlDocx.asBlob(html);
        
        return new NextResponse(docxBuffer, {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename="${project.name}.docx"`,
          },
        });
      } catch (error) {
        console.error('DOCX generation error:', error);
        // Fallback to HTML if DOCX generation fails
        return new NextResponse(html, {
          headers: {
            'Content-Type': 'text/html',
            'Content-Disposition': `attachment; filename="${project.name}.html"`,
          },
        });
      }
    }

    if (format === 'latex') {
      try {
        // Generate LaTeX document
        const latex = generateLaTeX({
          ...project,
          _id: String(project._id),
        } as unknown as Project, finalTemplate, finalCitationStyle);
        
        return new NextResponse(latex, {
          headers: {
            'Content-Type': 'text/plain',
            'Content-Disposition': `attachment; filename="${project.name}.tex"`,
          },
        });
      } catch (error) {
        console.error('LaTeX generation error:', error);
        // Fallback to HTML if LaTeX generation fails
        return new NextResponse(html, {
          headers: {
            'Content-Type': 'text/html',
            'Content-Disposition': `attachment; filename="${project.name}.html"`,
          },
        });
      }
    }

    // Default: return HTML
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${project.name}.html"`,
      },
    });
  } catch (error) {
    console.error('Error exporting project:', error);
    return NextResponse.json({ error: 'Failed to export project' }, { status: 500 });
  }
}

