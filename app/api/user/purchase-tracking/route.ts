import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import User from '@/models/User';
import connectDB from '@/lib/mongodb';

/**
 * GET: Retrieve purchase tracking metadata for client-side tracking
 * DELETE: Clear purchase tracking metadata after tracking
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return tracking metadata if it exists
    const tracking = (user as any).lastPurchaseTracking || null;

    return NextResponse.json({ tracking });
  } catch (error) {
    console.error('Error fetching purchase tracking:', error);
    return NextResponse.json({ error: 'Failed to fetch tracking' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    await User.findOneAndUpdate(
      { email: session.user.email },
      { $unset: { lastPurchaseTracking: 1 } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing purchase tracking:', error);
    return NextResponse.json({ error: 'Failed to clear tracking' }, { status: 500 });
  }
}
