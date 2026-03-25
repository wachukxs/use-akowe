import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Announcement from '@/models/Announcement';
import User from '@/models/User';

/** GET /api/admin/announcements — list all announcements with dismiss stats */
export async function GET() {
  try {
    await connectDB();

    const announcements = await Announcement.find()
      .sort({ createdAt: -1 })
      .lean();

    // For each announcement, count how many users have dismissed it
    const ids = announcements.map((a) => a._id);
    const dismissCounts = await User.aggregate([
      { $match: { dismissedAnnouncements: { $in: ids } } },
      { $unwind: '$dismissedAnnouncements' },
      { $match: { dismissedAnnouncements: { $in: ids } } },
      { $group: { _id: '$dismissedAnnouncements', count: { $sum: 1 } } },
    ]);
    const dismissMap: Record<string, number> = {};
    for (const d of dismissCounts) {
      dismissMap[d._id.toString()] = d.count;
    }

    const result = announcements.map((a) => ({
      ...a,
      dismissCount: dismissMap[a._id!.toString()] ?? 0,
    }));

    return NextResponse.json({ announcements: result });
  } catch (err) {
    console.error('[admin/announcements] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** POST /api/admin/announcements — create a new announcement */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, body: bodyText, ctaText, ctaUrl, type, target, active, expiresAt } = body;

    if (!title?.trim() || !bodyText?.trim()) {
      return NextResponse.json({ error: 'title and body are required' }, { status: 400 });
    }
    if (!['banner', 'modal'].includes(type)) {
      return NextResponse.json({ error: 'type must be banner or modal' }, { status: 400 });
    }
    if (!['all', 'free', 'paid'].includes(target)) {
      return NextResponse.json({ error: 'target must be all, free, or paid' }, { status: 400 });
    }

    await connectDB();

    const announcement = await Announcement.create({
      title: title.trim(),
      body: bodyText.trim(),
      ctaText: ctaText?.trim() || undefined,
      ctaUrl: ctaUrl?.trim() || undefined,
      type,
      target,
      active: Boolean(active),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (err) {
    console.error('[admin/announcements] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
