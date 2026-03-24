# Wise (India / payment links + webhooks)

Use this when **Stripe checkout is not available** (e.g. India). Checkout is redirected to **Wise payment links**; access is granted when Wise notifies your app via **webhooks**.

References: [Webhook API](https://docs.wise.com/api-reference/webhook), [event types](https://docs.wise.com/guides/developer/webhooks/event-types), [event handling & signatures](https://docs.wise.com/guides/developer/webhooks/event-handling), [transfer tracking](https://docs.wise.com/guides/product/send-money/tracking-transfers).

## Endpoint

`POST /api/webhooks/wise` — same path in every deployment; use env vars to pick **sandbox vs production signing keys** and API hosts.

## Environment variables

### Webhook verification

| Variable | Description |
|----------|-------------|
| `WISE_WEBHOOK_ENV` | `sandbox` or `production` — which **public key** verifies `X-Signature-SHA256`. If unset: production when `VERCEL_ENV`/`NODE_ENV` is production, else sandbox. |
| `WISE_WEBHOOK_PUBLIC_KEY` | Optional PEM override. |
| `WISE_PROFILE_ID` | Optional. If set, events whose profile id does not match are ignored. |

### Payment link URLs (checkout)

Production (required for live India checkout):

- `PROD_WISE_PAYMENT_LINK_120_USD_ANNUAL_PRO`
- `PROD_WISE_PAYMENT_LINK_70_USD_ANNUAL_STANDARD`
- `PROD_WISE_PAYMENT_LINK_7_USD_MONTHLY_STANDARD`
- `PROD_WISE_PAYMENT_LINK_12_USD_MONTHLY_PRO`

Optional sandbox URLs (same amounts, `SANDBOX_WISE_PAYMENT_LINK_*`). If sandbox mode is on and a sandbox URL is missing, the code falls back to the `PROD_*` value.

| Variable | Description |
|----------|-------------|
| `WISE_PAYMENT_LINKS_ENV` | `sandbox` or `production` — which URL set to use. Defaults from `WISE_WEBHOOK_ENV`. |

### Transfer API (webhook matching)

Webhooks only include **transfer id** (and balance references). To load payer/reference fields, configure:

| Variable | Description |
|----------|-------------|
| `WISE_SANDBOX_TOKEN_KEY` | Bearer token for `GET /v1/transfers/{id}` when using sandbox API. |
| `WISE_PROD_TOKEN_KEY` | Bearer token for production API. |
| `WISE_API_BASE` | Optional override (default: live `https://api.wise.com`, sandbox `https://api.sandbox.transferwise.com`). |
| `WISE_API_ENV` | Optional: `sandbox` or `production` — picks token + host with `WISE_WEBHOOK_ENV` and deploy context. |

### Who gets Wise checkout vs Stripe

| Variable | Description |
|----------|-------------|
| `PAYMENT_USE_WISE` | `true` — always use Wise links (for local testing). `false` — never. |
| `PAYMENT_WISE_TEST_COUNTRY` | Optional ISO country code to treat like India (e.g. match edge `x-vercel-ip-country`). |

By default, users with edge country **`IN`** use Wise; everyone else uses Stripe.

## Webhook subscriptions (Wise dashboard / API)

Create subscriptions pointing at your public URL, with schema version **`4.0.0`** where applicable.

Recommended event types for this app:

| Event | Purpose |
|-------|---------|
| `transfers#state-change` | Final success `outgoing_payment_sent` ([tracking](https://docs.wise.com/guides/product/send-money/tracking-transfers)); failures `cancelled`, `funds_refunded`, `charged_back`. |
| `balances#update` | Credits when `transfers#state-change` does not fire for some top-ups ([Wise note](https://docs.wise.com/guides/developer/webhooks/event-types#transfer-state-change)). |
| `transfers#payout-failure` | Payout failure details ([docs](https://docs.wise.com/guides/developer/webhooks/event-types#transfer-payout-failure)). |
| `transfers#refund` | Funds refunded — we downgrade users on **Wise term** billing tied to that transfer ([refund event](https://docs.wise.com/guides/developer/webhooks/event-types#transfer-refund)). |
| `swift-in#credit` | Optional: SWIFT inbound deposits (reference-based). |

Use `POST /v3/applications/{{clientKey}}/subscriptions` on sandbox vs production hosts as in the [webhook reference](https://docs.wise.com/api-reference/webhook).

## Term billing (non-recurring)

Wise payments are **one-time per checkout**. On successful payment we set:

- `paymentProvider: 'wise'`
- `subscriptionStartDate` / `subscriptionEndDate` — monthly = +1 month, annual = +1 year from the paid period (early renewal extends from the current end date if still active).
- `wisePurchaseTransferId` — Wise transfer id (for **refund** matching).

## Refunds

Subscribe to **`transfers#refund`**. We match the user by **`wisePurchaseTransferId`** or by transfer details (same as pay-in), then **downgrade to free** and clear Wise billing fields.

## Renewal reminder + expiry (cron)

Schedule a **daily** job (same pattern as `/api/cron/payment-grace`):

```bash
curl -X POST https://your-domain.com/api/cron/wise-subscription \
  -H "Authorization: Bearer $CRON_SECRET"
```

It:

1. **Downgrades** users whose `subscriptionEndDate` has passed (`paymentProvider: 'wise'`).
2. Sends an email when **~3 days** remain before `subscriptionEndDate` (2–4 day window for daily cron), once per period (`wiseRenewalReminderSentAt`).

## How matching works

1. **Checkout** stores `wisePaymentReference`, `wisePendingPlan`, `wisePendingBillingCycle`, `wisePendingSku`, then redirects to the payment link with `?akoweRef=<reference>` (Wise may ignore; the value is still stored for reconciliation).
2. On success, the handler loads the transfer via **`WISE_PROD_TOKEN_KEY`** (live) or **`WISE_SANDBOX_TOKEN_KEY`** (sandbox), matches **reference fields** (you indicated Wise will include these) or a **single pending checkout** in the last 72h for the **expected USD amount** for that SKU.
3. **Idempotency**: one upgrade per transfer id (`transfer:upgrade:{id}`); refunds use `wise:refund:{id}`.

Configure the matching **token key** for each environment so reconciliation does not rely on amount alone.

## Test notifications

`X-Test-Notification: true` — acknowledged without upgrading ([webhook API](https://docs.wise.com/api-reference/webhook)).
