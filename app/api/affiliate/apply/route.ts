import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AffiliateApplication from '@/models/AffiliateApplication';

export async function POST(request: NextRequest) {
  try {
    const { name, email, website, promotionMethod, audienceSize, message } = await request.json();

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (!promotionMethod) {
      return NextResponse.json(
        { error: 'Promotion method is required' },
        { status: 400 }
      );
    }

    const validMethods = ['blog', 'youtube', 'social_media', 'paid_ads', 'newsletter', 'other'];
    if (!validMethods.includes(promotionMethod)) {
      return NextResponse.json(
        { error: 'Invalid promotion method' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check for duplicate pending or approved application
    const existing = await AffiliateApplication.findOne({
      email: email.toLowerCase(),
      status: { $in: ['pending', 'approved'] },
    });

    if (existing) {
      const msg =
        existing.status === 'approved'
          ? 'An affiliate account with this email already exists.'
          : 'An application with this email is already pending review.';
      return NextResponse.json({ error: msg }, { status: 409 });
    }

    await AffiliateApplication.create({
      name,
      email: email.toLowerCase(),
      website: website || undefined,
      promotionMethod,
      audienceSize: audienceSize || undefined,
      message: message || undefined,
      status: 'pending',
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error submitting affiliate application:', error);
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}
