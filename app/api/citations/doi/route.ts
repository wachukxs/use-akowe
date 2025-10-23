import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { getCitationByDOI } from '@/lib/citations';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const doi = searchParams.get('doi');

    if (!doi) {
      return NextResponse.json({ error: 'DOI is required' }, { status: 400 });
    }

    const citation = await getCitationByDOI(doi);

    if (!citation) {
      return NextResponse.json({ error: 'Citation not found' }, { status: 404 });
    }

    return NextResponse.json(citation);
  } catch (error) {
    console.error('Error fetching citation:', error);
    return NextResponse.json({ error: 'Failed to fetch citation' }, { status: 500 });
  }
}

