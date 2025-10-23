import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import connectDB from '@/lib/mongodb';
import ProjectModel from '@/models/Project';
import { generateProjectHTML } from '@/lib/export';
import { Project } from '@/types';
import puppeteer from 'puppeteer';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'html';

    await connectDB();

    const project = await ProjectModel.findOne({
      _id: id,
      userId: session.user.id,
    }).lean();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const html = generateProjectHTML({
      ...project,
      _id: String(project._id),
    } as unknown as Project);

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
      // In production, convert HTML to DOCX using html-docx-js or similar
      // For now, return HTML
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="${project.name}.html"`,
        },
      });
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

