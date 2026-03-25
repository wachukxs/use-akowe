import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import connectDB from '@/lib/mongodb';
import Announcement from '@/models/Announcement';
import User from '@/models/User';
import mongoose from 'mongoose';

/** GET /api/announcements
 * Returns the active announcements for the current user.
 * Excludes already-dismissed announcements and expired ones.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();

    const user = await User.findOne({ email: session.user.email })
      .select('plan dismissedAnnouncements')
      .lean();

    if (!user) {
      return NextResponse.json({ announcements: [] });
    }

    const dismissed = (user.dismissedAnnouncements ?? []).map((id) => id.toString());

    const now = new Date();
    const announcements = await Announcement.find({
      active: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
      target: { $in: ['all', user.plan === 'free' ? 'free' : 'paid'] },
    })
      .sort({ createdAt: -1 })
      .lean();

    const filtered = announcements.filter(
      (a) => !dismissed.includes(a._id!.toString())
    );

    return NextResponse.json({ announcements: filtered });
  } catch (err) {
    console.error('[announcements] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** POST /api/announcements
 * Body: { id: string }  — dismisses an announcement for the current user.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await request.json();
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    await connectDB();

    await User.updateOne(
      { email: session.user.email },
      { $addToSet: { dismissedAnnouncements: new mongoose.Types.ObjectId(id) } }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[announcements] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
