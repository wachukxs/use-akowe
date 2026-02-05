import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function GET() {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const url = `${baseUrl}/investor?pdf=true`;

    // Launch puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    
    // Set viewport for landscape PDF rendering
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 2,
    });
    
    // Set landscape orientation
    await page.emulateMediaFeatures([
      { name: 'prefers-color-scheme', value: 'light' }
    ]);

    // Navigate to the investor page
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 60000,
    });

    // Wait a bit for any dynamic content
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Scroll to bottom first to ensure all content is loaded
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Scroll back to top before generating PDF
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate PDF with landscape orientation - no margins for better content fit
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0',
      },
      preferCSSPageSize: false,
    });

    await browser.close();

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="akowe-investor-pitch-deck.pdf"',
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

