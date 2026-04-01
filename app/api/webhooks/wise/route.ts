/**
 * Wise Business webhooks — SWIFT inbound, payment links, and transfer lifecycle.
 *
 * Subscribe (application or profile) per Wise docs — same HTTPS URL for sandbox vs prod;
 * use `WISE_WEBHOOK_ENV` + signing key; point each Wise environment’s subscription at the matching deployment.
 *
 * Relevant event types:
 * - `swift-in#credit` — SWIFT deposit; match `data.resource.reference` to user.
 * - `transfers#state-change` — e.g. `outgoing_payment_sent` when a transfer completes ([tracking](https://docs.wise.com/guides/product/send-money/tracking-transfers)).
 * - `balances#update` — balance credited (needed when `transfers#state-change` does not fire for top-ups).
 * - `transfers#payout-failure` — payout failure details ([event reference](https://docs.wise.com/guides/developer/webhooks/event-types#transfer-payout-failure)).
 * - `transfers#refund` — funds refunded; downgrade Wise-term users tied to that transfer ([refund event](https://docs.wise.com/guides/developer/webhooks/event-types#transfer-refund)).
 *
 * Signing: `X-Signature-SHA256` — [event handling](https://docs.wise.com/guides/developer/webhooks/event-handling).
 * Webhook API: https://docs.wise.com/api-reference/webhook
 */
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import {
  extractMongoIdFromWiseReference,
  getWiseWebhookPublicKeyPem,
  verifyWiseWebhookSignature,
} from '@/lib/wise-webhook';
import {
  applyWisePaymentUpgrade,
  isWiseTransferFailureState,
  parseTransferIdFromBalanceReference,
  processWiseRefund,
  processWiseTransferFailure,
  processWiseTransferForPayment,
  recordWiseDedupe,
} from '@/lib/wise-webhook-handlers';

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

function shouldApplySwiftWiseUpgrade(
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

function profileMatches(profileId: number | undefined, expected: string | undefined): boolean {
  if (!expected) return true;
  if (profileId === undefined || profileId === null) return false;
  return String(profileId) === expected;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('x-signature-sha256');
  const deliveryId = request.headers.get('x-delivery-id');
  const isTest = request.headers.get('x-test-notification') === 'true';
  const webhookEnv = process.env.WISE_WEBHOOK_ENV || 'auto';
  const webhookDebugEnabled = process.env.WISE_WEBHOOK_DEBUG === 'true';

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

  if (webhookDebugEnabled) {
    // Debug logging to inspect incoming Wise webhook payload shape.
    // Keep this explicit and bounded so logs remain readable.
    try {
      const serialized = JSON.stringify(payload);
      const MAX_LOG_LENGTH = 12000;
      const clipped =
        serialized.length > MAX_LOG_LENGTH
          ? `${serialized.slice(0, MAX_LOG_LENGTH)}... [truncated]`
          : serialized;
      console.log('[wise webhook] payload debug', {
        env: webhookEnv,
        eventType,
        deliveryId,
        isTest,
        hasSignature: Boolean(signature),
        payload: clipped,
      });
    } catch (error) {
      console.warn('[wise webhook] payload debug serialization failed', {
        eventType,
        deliveryId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  await connectDB();

  if (isTest) {
    console.log('[wise webhook] test notification ok', { eventType, deliveryId });
    return NextResponse.json({ received: true, test: true });
  }

  const expectedProfile = process.env.WISE_PROFILE_ID;

  // --- Payment links / transfers ---
  if (eventType === 'transfers#state-change') {
    const data = payload.data as {
      resource?: { id?: number; profile_id?: number };
      current_state?: string;
    } | null;
    const transferId = data?.resource?.id;
    const profileId = data?.resource?.profile_id;
    const state = data?.current_state;

    if (!profileMatches(profileId, expectedProfile)) {
      return NextResponse.json({ received: true, ignored: 'profile' });
    }

    if (transferId != null && state === 'outgoing_payment_sent') {
      const r = await processWiseTransferForPayment(transferId, eventType, 'transfer_completed');
      return NextResponse.json({ received: true, transfer: r.result });
    }

    if (transferId != null && isWiseTransferFailureState(state)) {
      if (state === 'funds_refunded') {
        await processWiseRefund(transferId, eventType);
      }
      await processWiseTransferFailure(transferId);
      return NextResponse.json({ received: true, failure_cleared: true });
    }

    return NextResponse.json({ received: true });
  }

  if (eventType === 'balances#update') {
    const data = payload.data as {
      resource?: { profile_id?: number };
      transaction_type?: string;
      transfer_reference?: string;
    } | null;
    const profileId = data?.resource?.profile_id;
    if (!profileMatches(profileId, expectedProfile)) {
      return NextResponse.json({ received: true, ignored: 'profile' });
    }
    if (data?.transaction_type === 'credit' && data.transfer_reference) {
      const tid = parseTransferIdFromBalanceReference(data.transfer_reference);
      if (tid) {
        const r = await processWiseTransferForPayment(tid, eventType, 'balance_credit');
        return NextResponse.json({ received: true, balance: r.result });
      }
    }
    return NextResponse.json({ received: true });
  }

  if (eventType === 'transfers#payout-failure') {
    const data = payload.data as { transfer_id?: number; profile_id?: number } | null;
    const profileId = data?.profile_id;
    if (!profileMatches(profileId, expectedProfile)) {
      return NextResponse.json({ received: true, ignored: 'profile' });
    }
    const transferId = data?.transfer_id;
    if (transferId != null) {
      await processWiseTransferFailure(transferId);
    }
    return NextResponse.json({ received: true });
  }

  if (eventType === 'transfers#refund') {
    const data = payload.data as {
      resource?: { id?: number; profile_id?: number };
    } | null;
    const transferId = data?.resource?.id;
    const profileId = data?.resource?.profile_id;
    if (!profileMatches(profileId, expectedProfile)) {
      return NextResponse.json({ received: true, ignored: 'profile' });
    }
    if (transferId != null) {
      const r = await processWiseRefund(transferId, eventType);
      return NextResponse.json({ received: true, refund: r.result });
    }
    return NextResponse.json({ received: true });
  }

  // --- SWIFT inbound ---
  if (eventType === 'swift-in#credit') {
    const data = payload.data as {
      action?: { profile_id?: number; id?: number };
      resource?: {
        reference?: string;
        uetr?: string;
      };
    } | null;

    const profileId = data?.action?.profile_id;
    if (!profileMatches(profileId, expectedProfile)) {
      return NextResponse.json({ received: true, ignored: 'profile' });
    }

    const uetr = data?.resource?.uetr?.trim();
    const dedupeKey = uetr || (deliveryId ? `delivery:${deliveryId}` : '');
    if (!dedupeKey) {
      console.warn('[wise webhook] swift-in#credit missing uetr and x-delivery-id');
      return NextResponse.json({ received: true, warning: 'no dedupe key' });
    }

    const isNew = await recordWiseDedupe(dedupeKey, eventType);
    if (!isNew) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    const reference = data?.resource?.reference;
    const user = await findUserForSwiftCredit(reference);

    if (!user) {
      console.log('[wise webhook] no user for reference', { reference: reference?.slice(0, 80) });
      return NextResponse.json({ received: true, matched: false });
    }

    if (!shouldApplySwiftWiseUpgrade(user, String(reference || ''))) {
      console.log('[wise webhook] reference does not match pending Wise payment', { userId: user._id });
      return NextResponse.json({ received: true, matched: false });
    }

    const actionId = data?.action?.id;
    const out = await applyWisePaymentUpgrade(
      user,
      actionId != null ? { transferId: actionId } : undefined
    );
    console.log(`[wise webhook] swift-in upgrade → ${out}`, user._id);

    return NextResponse.json({
      received: true,
      upgraded: out === 'upgraded',
      userId: String(user._id),
    });
  }

  return NextResponse.json({ received: true, ignored: eventType });
}
