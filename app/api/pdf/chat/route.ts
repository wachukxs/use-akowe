import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Note: In production, implement proper PDF text extraction and embedding
// Use libraries like pdf-parse for extraction and vector DB for semantic search
async function extractPDFContext(pdfUrl: string, question: string): Promise<string> {
  // Mock implementation - replace with actual PDF parsing and vector search
  return `This is context from the PDF at ${pdfUrl} related to: ${question}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { pdfUrl, question } = body;

    if (!pdfUrl || !question) {
      return NextResponse.json(
        { error: 'PDF URL and question are required' },
        { status: 400 }
      );
    }

    // Extract relevant context from PDF
    const context = await extractPDFContext(pdfUrl, question);

    // Generate answer using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an academic research assistant. Answer questions based on the provided PDF context. Always cite specific sections when possible.',
        },
        {
          role: 'user',
          content: `Context from PDF:\n${context}\n\nQuestion: ${question}`,
        },
      ],
      temperature: 0.5,
      max_tokens: 800,
    });

    const answer = completion.choices[0]?.message?.content || '';

    return NextResponse.json({
      answer,
      source: pdfUrl,
    });
  } catch (error) {
    console.error('Error in PDF chat:', error);
    return NextResponse.json({ error: 'Failed to process question' }, { status: 500 });
  }
}

