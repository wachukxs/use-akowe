import mongoose from 'mongoose';
import User from '@/models/User';
import WiseWebhookReceipt from '@/models/WiseWebhookReceipt';
import WisePaymentEvent from '@/models/WisePaymentEvent';
import WiseCheckoutAttempt from '@/models/WiseCheckoutAttempt';
import { extractMongoIdFromWiseReference } from '@/lib/wise-webhook';
import type { WiseTransferDetails } from '@/lib/wise-api';
import { wiseGetTransfer } from '@/lib/wise-api';
import {
  type WisePaymentLinkSku,
  WISE_SKU_USD_TARGET,
  planBillingFromWiseSku,
} from '@/lib/wise-payment-links';
import { computeWiseSubscriptionPeriod } from '@/lib/wise-billing';

/** "Completed" in the Wise UI maps to this API status for outbound transfers. */
const STATUS_SUCCESS = 'outgoing_payment_sent';
/** Inbound / pay-in flows may credit the balance while status is still processing. */
const STATUS_PAID_IN_PROGRESS = new Set(['processing', 'funds_converted', 'outgoing_payment_sent']);

const FAILURE_STATES = new Set(['cancelled', 'funds_refunded', 'charged_back']);

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function refsLikelyMatch(incoming: string, expected: string): boolean {
  const a = incoming.replace(/\s/g, '').toUpperCase();
  const b = expected.replace(/\s/g, '').toUpperCase();
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

function combinedReferenceText(t: WiseTransferDetails): string {
  const parts = [t.details?.reference, t.reference, t.originator?.reference].filter(
    (x): x is string => typeof x === 'string' && x.length > 0
  );
  return parts.join(' ');
}

function extractTransferAmountForLedger(
  transfer: WiseTransferDetails,
  fallbackUsd: number | null = null
): {
  amount: number;
  currency: string;
  amountUsd: number | null;
} | null {
  const targetValue = typeof transfer.targetValue === 'number' ? transfer.targetValue : null;
  const sourceValue = typeof transfer.sourceValue === 'number' ? transfer.sourceValue : null;
  const targetCurrency = transfer.targetCurrency?.toUpperCase();
  const sourceCurrency = transfer.sourceCurrency?.toUpperCase();

  const usdFromTarget = targetCurrency === 'USD' && targetValue != null ? targetValue : null;
  const usdFromSource = sourceCurrency === 'USD' && sourceValue != null ? sourceValue : null;
  const computedUsd = usdFromTarget ?? usdFromSource ?? fallbackUsd;

  if (targetValue != null && targetCurrency) {
    return {
      amount: targetValue,
      currency: targetCurrency,
      amountUsd: computedUsd,
    };
  }

  if (sourceValue != null && sourceCurrency) {
    return {
      amount: sourceValue,
      currency: sourceCurrency,
      amountUsd: computedUsd,
    };
  }

  return null;
}

async function recordWisePaymentEvent(params: {
  transfer: WiseTransferDetails;
  eventKind: 'payment' | 'refund';
  eventType: string;
  user?: InstanceType<typeof User> | null;
  matchedSku?: WisePaymentLinkSku | null;
}) {
  const transferId = params.transfer.id != null ? String(params.transfer.id) : '';
  if (!transferId) return;

  let fallbackUsd: number | null = null;
  if (params.matchedSku) {
    fallbackUsd = WISE_SKU_USD_TARGET[params.matchedSku];
  } else if (params.eventKind === 'refund') {
    const priorPayment = await WisePaymentEvent.findOne({
      provider: 'wise',
      transferId,
      eventKind: 'payment',
      amountUsd: { $ne: null },
    })
      .select('amountUsd')
      .lean();
    fallbackUsd = typeof priorPayment?.amountUsd === 'number' ? priorPayment.amountUsd : null;
  }

  const amountData = extractTransferAmountForLedger(params.transfer, fallbackUsd);
  if (!amountData) return;

  const user = params.user || null;
  const plan = user?.wisePendingPlan || user?.plan || null;
  const billingCycle = user?.wisePendingBillingCycle || user?.billingCycle || null;

  await WisePaymentEvent.findOneAndUpdate(
    { provider: 'wise', transferId, eventKind: params.eventKind },
    {
      $set: {
        eventType: params.eventType,
        userId: user?._id || null,
        amount: amountData.amount,
        currency: amountData.currency,
        amountUsd: amountData.amountUsd,
        status: params.transfer.status || undefined,
        plan,
        billingCycle,
        occurredAt: new Date(),
      },
      $setOnInsert: {
        provider: 'wise',
        transferId,
        eventKind: params.eventKind,
      },
    },
    { upsert: true, new: true }
  );
}

export function isWiseTransferFailureState(state: string | undefined): boolean {
  return !!state && FAILURE_STATES.has(state);
}

async function findUserByReferenceBlob(blob: string) {
  const trimmed = blob.trim();
  if (!trimmed) return null;

  const exact = await User.findOne({
    wisePaymentReference: { $regex: new RegExp(`^${escapeRegex(trimmed)}$`, 'i') },
  });
  if (exact) return exact;

  const withRef = await User.find({
    wisePaymentReference: { $exists: true, $nin: [null, ''] },
  })
    .limit(400)
    .exec();

  for (const u of withRef) {
    if (u.wisePaymentReference && refsLikelyMatch(trimmed, u.wisePaymentReference)) {
      return u;
    }
  }
  return null;
}

type WiseTransferMatch = {
  user: InstanceType<typeof User> | null;
  matchedSku: WisePaymentLinkSku | null;
  matchedReference: string | null;
};

async function findPendingAttemptByReferenceBlob(blob: string) {
  const trimmed = blob.trim();
  if (!trimmed) return null;

  const exact = await WiseCheckoutAttempt.findOne({
    status: 'pending',
    reference: { $regex: new RegExp(`^${escapeRegex(trimmed)}$`, 'i') },
  })
    .sort({ createdAt: -1 })
    .lean();
  if (exact) return exact;

  const attempts = await WiseCheckoutAttempt.find({
    status: 'pending',
    reference: { $exists: true, $nin: [null, ''] },
    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  })
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();

  for (const attempt of attempts) {
    if (attempt.reference && refsLikelyMatch(trimmed, attempt.reference)) {
      return attempt;
    }
  }
  return null;
}

async function resolveWiseTransferMatch(transfer: WiseTransferDetails): Promise<WiseTransferMatch> {
  /**
   * User mapping decision order for Wise transfer events:
   * 1) Pending WiseCheckoutAttempt by reference (authoritative, supports retries/multiple attempts).
   * 2) Legacy user.wisePaymentReference matching.
   * 3) Embedded Mongo ObjectId in reference text.
   * 4) Last-resort SKU amount heuristic (only when uniquely matchable).
   *
   * This keeps checkout-attempt linkage stable even if the user starts checkout multiple times
   * before completing payment.
   */
  const blob = combinedReferenceText(transfer);
  if (blob) {
    const matchedAttempt = await findPendingAttemptByReferenceBlob(blob);
    if (matchedAttempt) {
      const userByAttempt = await User.findById(matchedAttempt.userId);
      if (userByAttempt) {
        return {
          user: userByAttempt,
          matchedSku: matchedAttempt.sku,
          matchedReference: matchedAttempt.reference,
        };
      }
    }

    const byRef = await findUserByReferenceBlob(blob);
    if (byRef) return { user: byRef, matchedSku: null, matchedReference: byRef.wisePaymentReference || null };
  }

  const oid = extractMongoIdFromWiseReference(blob);
  if (oid && mongoose.Types.ObjectId.isValid(oid)) {
    const byId = await User.findById(oid);
    if (byId) return { user: byId, matchedSku: null, matchedReference: null };
  }

  const targetUsd = transfer.targetCurrency === 'USD' ? transfer.targetValue : undefined;
  const sourceUsd = transfer.sourceCurrency === 'USD' ? transfer.sourceValue : undefined;
  const usd = targetUsd ?? sourceUsd;
  if (usd == null || Number.isNaN(usd)) return null;

  const tolerance = 0.02;
  const matchingSkus = (Object.keys(WISE_SKU_USD_TARGET) as WisePaymentLinkSku[]).filter(
    (sku) => Math.abs(WISE_SKU_USD_TARGET[sku] - usd) <= tolerance
  );
  if (matchingSkus.length !== 1) return null;
  const sku = matchingSkus[0];

  const since = new Date(Date.now() - 72 * 60 * 60 * 1000);
  const pending = await User.find({
    wisePendingSku: sku,
    wisePaymentReference: { $exists: true, $nin: [null, ''] },
    updatedAt: { $gte: since },
  })
    .sort({ updatedAt: -1 })
    .limit(2)
    .exec();

  if (pending.length === 1) {
    return { user: pending[0], matchedSku: sku, matchedReference: pending[0].wisePaymentReference || null };
  }

  return { user: null, matchedSku: null, matchedReference: null };
}

export async function findUserForWiseTransfer(transfer: WiseTransferDetails): Promise<InstanceType<typeof User> | null> {
  const match = await resolveWiseTransferMatch(transfer);
  return match.user;
}

function transferStatusAllowsUpgrade(
  status: string | undefined,
  mode: 'transfer_completed' | 'balance_credit'
): boolean {
  const s = status?.toLowerCase() || '';
  if (mode === 'transfer_completed') return s === STATUS_SUCCESS;
  return STATUS_PAID_IN_PROGRESS.has(s);
}

export async function applyWisePaymentUpgrade(
  user: InstanceType<typeof User>,
  options?: { transferId?: number }
): Promise<'upgraded' | 'team'> {
  if (user.plan === 'team') return 'team';

  let plan: 'standard' | 'pro';
  let billingCycle: 'monthly' | 'annual';

  if (user.wisePendingPlan === 'standard' || user.wisePendingPlan === 'pro') {
    plan = user.wisePendingPlan;
    billingCycle = user.wisePendingBillingCycle === 'annual' ? 'annual' : 'monthly';
  } else if (user.wisePendingSku) {
    const pb = planBillingFromWiseSku(user.wisePendingSku);
    plan = pb.plan;
    billingCycle = pb.billingCycle;
  } else {
    plan = 'pro';
    billingCycle = 'monthly';
  }

  const { start, end } = computeWiseSubscriptionPeriod(
    billingCycle,
    user.paymentProvider === 'wise' ? user.subscriptionEndDate ?? undefined : undefined
  );

  user.plan = plan;
  user.billingCycle = billingCycle;
  user.subscriptionStartDate = start;
  user.subscriptionEndDate = end;
  user.paymentProvider = 'wise';
  if (options?.transferId != null) {
    user.wisePurchaseTransferId = options.transferId;
  }
  user.wiseRenewalReminderSentAt = null;

  user.wisePaymentReference = undefined;
  user.wisePendingPlan = undefined;
  user.wisePendingBillingCycle = undefined;
  user.wisePendingSku = undefined;

  await user.save();
  return 'upgraded';
}

export async function downgradeWisePaidUserToFree(user: InstanceType<typeof User>): Promise<void> {
  user.plan = 'free';
  user.subscriptionStartDate = null;
  user.subscriptionEndDate = null;
  user.wisePurchaseTransferId = undefined;
  user.paymentProvider = undefined;
  user.wiseRenewalReminderSentAt = null;
  user.wisePaymentReference = undefined;
  user.wisePendingPlan = undefined;
  user.wisePendingBillingCycle = undefined;
  user.wisePendingSku = undefined;
  await user.save();
  await WiseCheckoutAttempt.updateMany(
    { userId: user._id, status: 'pending' },
    { $set: { status: 'cancelled' } }
  );
}

/** If the Wise-paid term has ended, downgrade. Returns whether the user document was changed. */
export async function syncWiseTermExpiryIfNeeded(user: InstanceType<typeof User>): Promise<boolean> {
  if (user.paymentProvider !== 'wise' || !user.subscriptionEndDate) return false;
  if (!['standard', 'pro'].includes(user.plan)) return false;
  if (new Date() <= user.subscriptionEndDate) return false;
  await downgradeWisePaidUserToFree(user);
  return true;
}

export async function processWiseRefund(transferId: number, eventType: string): Promise<{ ok: boolean; result?: string }> {
  const dedupeKey = `wise:refund:${transferId}`;
  const isNew = await recordWiseDedupe(dedupeKey, eventType);
  if (!isNew) return { ok: true, result: 'duplicate' };

  const transfer = await wiseGetTransfer(transferId);
  if (!transfer) return { ok: true, result: 'no_transfer_api' };

  let user =
    (await User.findOne({
      paymentProvider: 'wise',
      wisePurchaseTransferId: transferId,
    })) || null;

  if (!user) {
    const match = await resolveWiseTransferMatch(transfer);
    user = match.user;
  }

  await recordWisePaymentEvent({
    transfer,
    eventKind: 'refund',
    eventType,
    user,
  });

  if (!user) {
    console.log('[wise webhook] refund: no user for transfer', transferId);
    return { ok: true, result: 'no_user' };
  }

  if (user.paymentProvider !== 'wise') {
    return { ok: true, result: 'not_wise_billing' };
  }

  await downgradeWisePaidUserToFree(user);
  console.log('[wise webhook] refund downgrade', user._id);
  return { ok: true, result: 'downgraded' };
}

export async function clearWisePendingForUser(user: InstanceType<typeof User>): Promise<void> {
  user.wisePaymentReference = undefined;
  user.wisePendingPlan = undefined;
  user.wisePendingBillingCycle = undefined;
  user.wisePendingSku = undefined;
  await user.save();
  await WiseCheckoutAttempt.updateMany(
    { userId: user._id, status: 'pending' },
    { $set: { status: 'cancelled' } }
  );
}

export async function recordWiseDedupe(dedupeKey: string, eventType: string): Promise<boolean> {
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

/**
 * Payment link / transfer reconciliation: load transfer, match user, upgrade if status allows.
 */
export async function processWiseTransferForPayment(
  transferId: string | number,
  eventType: string,
  mode: 'transfer_completed' | 'balance_credit'
): Promise<{ ok: boolean; result?: string }> {
  const tid = typeof transferId === 'string' ? transferId : String(transferId);
  const dedupeKey = `transfer:upgrade:${tid}`;
  const isNew = await recordWiseDedupe(dedupeKey, eventType);
  if (!isNew) return { ok: true, result: 'duplicate' };

  const transfer = await wiseGetTransfer(tid);
  if (!transfer) return { ok: true, result: 'no_transfer_api' };

  const st = transfer.status?.toLowerCase();
  if (!transferStatusAllowsUpgrade(st, mode)) {
    return { ok: true, result: `status:${st || 'unknown'}` };
  }

  const match = await resolveWiseTransferMatch(transfer);
  const user = match.user;
  await recordWisePaymentEvent({
    transfer,
    eventKind: 'payment',
    eventType,
    user,
    matchedSku: match.matchedSku,
  });

  if (!user) {
    console.log('[wise webhook] no user matched transfer', tid);
    return { ok: true, result: 'no_user' };
  }

  if (!user.wisePaymentReference && !user.wisePendingSku && !user.wisePendingPlan) {
    return { ok: true, result: 'no_pending_checkout' };
  }

  const transferNumericId = typeof transfer.id === 'number' ? transfer.id : Number(transfer.id);
  if (match.matchedSku) {
    const pb = planBillingFromWiseSku(match.matchedSku);
    user.wisePendingSku = match.matchedSku;
    user.wisePendingPlan = pb.plan;
    user.wisePendingBillingCycle = pb.billingCycle;
    if (match.matchedReference) {
      user.wisePaymentReference = match.matchedReference;
    }
  }
  const out = await applyWisePaymentUpgrade(
    user,
    Number.isFinite(transferNumericId) ? { transferId: transferNumericId } : undefined
  );
  if (Number.isFinite(transferNumericId)) {
    await WiseCheckoutAttempt.updateMany(
      {
        userId: user._id,
        status: 'pending',
      },
      {
        $set: {
          status: 'cancelled',
          transferId: transferNumericId,
        },
      }
    );
    if (match.matchedReference) {
      await WiseCheckoutAttempt.updateOne(
        { reference: match.matchedReference },
        { $set: { status: 'completed', transferId: transferNumericId } }
      );
    }
  }
  console.log('[wise webhook] transfer payment →', out, user._id);
  return { ok: true, result: out };
}

export async function processWiseTransferFailure(transferId: string | number): Promise<void> {
  const transfer = await wiseGetTransfer(transferId);
  if (!transfer) return;
  const user = await findUserForWiseTransfer(transfer);
  if (!user?.wisePaymentReference && !user?.wisePendingSku) return;
  if (user.plan !== 'free') return;
  await clearWisePendingForUser(user);
  console.log('[wise webhook] cleared pending after failure for user', user._id);
}

export function parseTransferIdFromBalanceReference(ref: string | undefined | null): string | null {
  if (!ref || typeof ref !== 'string') return null;
  const t = ref.trim();
  if (/^\d+$/.test(t)) return t;
  const digits = t.replace(/\D/g, '');
  if (digits.length >= 6) return digits;
  return null;
}
