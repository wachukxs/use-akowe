import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { searchOpenAlex } from '@/lib/citations';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const results = await searchOpenAlex(query);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching citations:', error);
    return NextResponse.json({ error: 'Failed to search citations' }, { status: 500 });
  }
}

