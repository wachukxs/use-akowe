/**
 * Wise Business webhooks — inbound SWIFT / receive-money (India bank transfers).
 *
 * Subscriptions (Wise Dashboard / API per environment):
 * - `swift-in#credit` — money landed; we match `data.resource.reference` to the user and upgrade.
 * - `transfers#state-change` — informational; duplicates `swift-in#credit` per Wise docs (handle idempotency).
 *
 * Signing: `X-Signature-SHA256` (RSA-SHA256). Public keys: Wise event-handling guide.
 * Env: `WISE_WEBHOOK_ENV=sandbox|production` (or `WISE_WEBHOOK_PUBLIC_KEY`). Optional `WISE_PROFILE_ID`.
 *
 * @see https://docs.wise.com/guides/developer/webhooks/event-handling
 * @see https://docs.wise.com/guides/product/receive-money/subscribe-to-swift-in-credit
 * @see https://docs.wise.com/guides/product/receive-money/subscribe-to-transfer-state-change
 */
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import WiseWebhookReceipt from '@/models/WiseWebhookReceipt';
import {
  extractMongoIdFromWiseReference,
  getWiseWebhookPublicKeyPem,
  verifyWiseWebhookSignature,
} from '@/lib/wise-webhook';

export const runtime = 'nodejs';

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function refsLikelyMatch(incoming: string, expected: string): boolean {
  const a = incoming.replace(/\s/g, '').toUpperCase();
  const b = expected.replace(/\s/g, '').toUpperCase();
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

function shouldApplyWiseUpgrade(
  user: { _id: mongoose.Types.ObjectId; wisePaymentReference?: string; wisePendingPlan?: string },
  referenceRaw: string
): boolean {
  const ref = (referenceRaw || '').trim();
  if (!ref) return false;
  if (user.wisePaymentReference && refsLikelyMatch(ref, user.wisePaymentReference)) {
    return true;
  }
  const oid = extractMongoIdFromWiseReference(ref);
  if (oid && user._id.toString() === oid && user.wisePendingPlan) {
    return true;
  }
  return false;
}

async function findUserForSwiftCredit(referenceRaw: string | undefined) {
  const ref = (referenceRaw || '').trim();
  if (!ref) return null;

  const or: Record<string, unknown>[] = [
    { wisePaymentReference: { $regex: new RegExp(`^${escapeRegex(ref)}$`, 'i') } },
  ];
  const oid = extractMongoIdFromWiseReference(ref);
  if (oid && mongoose.Types.ObjectId.isValid(oid)) {
    or.push({ _id: new mongoose.Types.ObjectId(oid) });
  }

  return User.findOne({ $or: or });
}

async function recordDedupe(dedupeKey: string, eventType: string): Promise<boolean> {
  try {
    await WiseWebhookReceipt.create({ dedupeKey, eventType });
    return true;
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'code' in e && (e as { code?: number }).code === 11000) {
      return false;
    }
    throw e;
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('x-signature-sha256');
  const deliveryId = request.headers.get('x-delivery-id');
  const isTest = request.headers.get('x-test-notification') === 'true';

  const publicKey = getWiseWebhookPublicKeyPem();
  if (!verifyWiseWebhookSignature(body, signature, publicKey)) {
    console.error('[wise webhook] signature verification failed');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: {
    event_type?: string;
    data?: Record<string, unknown>;
    subscription_id?: string;
  };
  try {
    payload = JSON.parse(body) as typeof payload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventType = payload.event_type || '';

  await connectDB();

  // Test pings: acknowledge without side effects
  if (isTest) {
    console.log('[wise webhook] test notification ok', { eventType, deliveryId });
    return NextResponse.json({ received: true, test: true });
  }

  if (eventType === 'transfers#state-change') {
    // Upgrade is handled on `swift-in#credit`; this event may duplicate the same payment per Wise docs.
    return NextResponse.json({ received: true });
  }

  if (eventType !== 'swift-in#credit') {
    return NextResponse.json({ received: true, ignored: eventType });
  }

  const data = payload.data as {
    action?: { profile_id?: number; id?: number };
    resource?: {
      reference?: string;
      uetr?: string;
    };
  } | null;

  const profileId = data?.action?.profile_id;
  const expectedProfile = process.env.WISE_PROFILE_ID;
  if (expectedProfile && profileId !== undefined && String(profileId) !== expectedProfile) {
    console.warn('[wise webhook] profile_id mismatch', { profileId, expectedProfile });
    return NextResponse.json({ received: true, ignored: 'profile' });
  }

  const uetr = data?.resource?.uetr?.trim();
  const dedupeKey = uetr || (deliveryId ? `delivery:${deliveryId}` : '');
  if (!dedupeKey) {
    console.warn('[wise webhook] swift-in#credit missing uetr and x-delivery-id');
    return NextResponse.json({ received: true, warning: 'no dedupe key' });
  }

  const isNew = await recordDedupe(dedupeKey, eventType);
  if (!isNew) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  const reference = data?.resource?.reference;
  const user = await findUserForSwiftCredit(reference);

  if (!user) {
    console.log('[wise webhook] no user for reference', { reference: reference?.slice(0, 80) });
    return NextResponse.json({ received: true, matched: false });
  }

  if (!shouldApplyWiseUpgrade(user, String(reference || ''))) {
    console.log('[wise webhook] reference does not match pending Wise payment', { userId: user._id });
    return NextResponse.json({ received: true, matched: false });
  }

  const pendingPlan = user.wisePendingPlan === 'standard' ? 'standard' : 'pro';
  const billingCycle =
    user.wisePendingBillingCycle === 'annual' ? 'annual' : 'monthly';

  if (user.plan === 'team') {
    console.log(`[wise webhook] user ${user._id} is on team; not changing plan via Wise`);
    return NextResponse.json({ received: true, skipped: 'team' });
  }

  user.plan = pendingPlan;
  user.billingCycle = billingCycle;
  user.subscriptionStartDate = new Date();
  user.subscriptionEndDate = null;
  user.wisePaymentReference = undefined;
  user.wisePendingPlan = undefined;
  user.wisePendingBillingCycle = undefined;

  await user.save();
  console.log(`[wise webhook] upgraded user ${user._id} to ${pendingPlan} (${billingCycle})`);

  return NextResponse.json({ received: true, upgraded: true, userId: String(user._id) });
}
