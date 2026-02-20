import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import connectDB from '@/lib/mongodb';
import ShareLink from '@/models/ShareLink';
import mongoose from 'mongoose';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; linkId: string }> }
) {
  try {
    const { id, linkId } = await context.params;
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(linkId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    await connectDB();

    const result = await ShareLink.findOneAndUpdate(
      {
        _id: linkId,
        projectId: id,
        userId: session.user.email,
        revokedAt: { $exists: false },
      },
      { $set: { revokedAt: new Date() } },
      { new: true }
    );

    if (!result) {
      return NextResponse.json({ error: 'Share link not found or already revoked' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error revoking share link:', error);
    return NextResponse.json({ error: 'Failed to revoke share link' }, { status: 500 });
  }
}
