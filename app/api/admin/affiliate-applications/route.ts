import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AffiliateApplication from '@/models/AffiliateApplication';
import Influencer from '@/models/Influencer';
import User from '@/models/User';
import { createWithReferralCode } from '@/lib/referral';
import { verifyAdminSession, requireFullAccess } from '@/lib/admin-auth';
import { sendAffiliateApprovedEmail, sendAffiliateDeniedEmail } from '@/lib/email';

export async function GET() {
  try {
    const session = await verifyAdminSession();
    if (!session.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const [applications, pending, approved, denied] = await Promise.all([
      AffiliateApplication.find().sort({ createdAt: -1 }).lean(),
      AffiliateApplication.countDocuments({ status: 'pending' }),
      AffiliateApplication.countDocuments({ status: 'approved' }),
      AffiliateApplication.countDocuments({ status: 'denied' }),
    ]);

    // Populate referral codes for approved applications
    const influencerIds = applications
      .filter((a) => a.influencerId)
      .map((a) => a.influencerId);

    const influencers =
      influencerIds.length > 0
        ? await Influencer.find({ _id: { $in: influencerIds } })
            .select('_id referralCode')
            .lean()
        : [];

    const influencerMap = new Map(
      influencers.map((i) => [i._id.toString(), i.referralCode])
    );

    // Cross-check all applicant emails against Influencer and User collections so
    // admin knows immediately if an applicant is already active in the referral system
    const allEmails = applications.map((a) => a.email.toLowerCase());

    const [existingInfluencersByEmail, existingUsersByEmail] = await Promise.all([
      allEmails.length > 0
        ? Influencer.find({ email: { $in: allEmails } }).select('email referralCode').lean()
        : [],
      allEmails.length > 0
        ? User.find({ email: { $in: allEmails } }).select('email referralCode').lean()
        : [],
    ]);

    const existingInfluencerEmailMap = new Map(
      existingInfluencersByEmail.map((i) => [i.email, i.referralCode])
    );
    const existingUserEmailMap = new Map(
      existingUsersByEmail.map((u) => [u.email, (u as any).referralCode ?? null])
    );

    const applicationsWithCode = applications.map((a) => {
      const emailLower = a.email.toLowerCase();
      const existingInfluencerCode = existingInfluencerEmailMap.get(emailLower);
      const existingUserCode = existingUserEmailMap.get(emailLower);
      return {
        ...a,
        _id: a._id.toString(),
        influencerId: a.influencerId?.toString(),
        influencerReferralCode: a.influencerId
          ? influencerMap.get(a.influencerId.toString())
          : undefined,
        alreadyInfluencer: existingInfluencerCode !== undefined,
        existingReferralCode: existingInfluencerCode ?? null,
        alreadyUser: existingUserCode !== undefined,
        userReferralCode: existingUserCode ?? null,
      };
    });

    return NextResponse.json({
      stats: { pending, approved, denied },
      applications: applicationsWithCode,
    });
  } catch (error) {
    console.error('Error fetching affiliate applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireFullAccess();
    if (!session) {
      return NextResponse.json(
        { error: 'Forbidden: full access required' },
        { status: 403 }
      );
    }

    const { id, action } = await request.json();

    if (!id || !action) {
      return NextResponse.json(
        { error: 'id and action are required' },
        { status: 400 }
      );
    }

    if (action !== 'approve' && action !== 'deny') {
      return NextResponse.json(
        { error: 'action must be approve or deny' },
        { status: 400 }
      );
    }

    await connectDB();

    const application = await AffiliateApplication.findById(id);
    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    if (application.status !== 'pending') {
      return NextResponse.json(
        { error: 'Application has already been reviewed' },
        { status: 409 }
      );
    }

    if (action === 'deny') {
      application.status = 'denied';
      application.reviewedAt = new Date();
      application.reviewedByAdminId = session.adminId;
      await application.save();

      // Fire-and-forget — don't block the response on email delivery
      sendAffiliateDeniedEmail(application.email, application.name).catch((err) =>
        console.error('[affiliate] Failed to send denial email:', err)
      );

      return NextResponse.json({ success: true });
    }

    // Approve: create Influencer record
    const existingInfluencer = await Influencer.findOne({
      email: application.email,
    });
    if (existingInfluencer) {
      // Link the existing influencer instead of creating a new one
      application.status = 'approved';
      application.reviewedAt = new Date();
      application.reviewedByAdminId = session.adminId;
      application.influencerId = existingInfluencer._id;
      await application.save();

      sendAffiliateApprovedEmail(application.email, application.name, existingInfluencer.referralCode).catch((err) =>
        console.error('[affiliate] Failed to send approval email:', err)
      );

      return NextResponse.json({
        success: true,
        referralCode: existingInfluencer.referralCode,
      });
    }

    const influencer = await createWithReferralCode(async (referralCode) => {
      return Influencer.create({
        name: application.name,
        email: application.email,
        referralCode,
        notes: `Approved via affiliate application. ${application.promotionMethod}${application.website ? ` — ${application.website}` : ''}`,
      });
    });

    application.status = 'approved';
    application.reviewedAt = new Date();
    application.reviewedByAdminId = session.adminId;
    application.influencerId = influencer._id;
    await application.save();

    sendAffiliateApprovedEmail(application.email, application.name, influencer.referralCode).catch((err) =>
      console.error('[affiliate] Failed to send approval email:', err)
    );

    return NextResponse.json({
      success: true,
      referralCode: influencer.referralCode,
    });
  } catch (error) {
    console.error('Error reviewing affiliate application:', error);
    return NextResponse.json(
      { error: 'Failed to process application' },
      { status: 500 }
    );
  }
}
