import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LeadCapture from '@/models/LeadCapture';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, source, variant, metadata } = body;

    if (!email || !source || !variant) {
      return NextResponse.json(
        { error: 'Email, source, and variant are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    await connectDB();

    // Upsert: update if exists, create if not
    const lead = await LeadCapture.findOneAndUpdate(
      { email: email.toLowerCase(), source },
      {
        email: email.toLowerCase(),
        source,
        variant,
        metadata,
        capturedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, leadId: lead._id });
  } catch (error: any) {
    console.error('Error capturing lead:', error);
    
    // Handle duplicate key error gracefully
    if (error.code === 11000) {
      return NextResponse.json({ success: true, message: 'Email already captured' });
    }
    
    return NextResponse.json(
      { error: 'Failed to capture lead' },
      { status: 500 }
    );
  }
}
