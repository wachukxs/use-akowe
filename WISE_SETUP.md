# Wise Business webhooks (India / SWIFT inbound)

This app exposes a single webhook URL that works for both **sandbox** and **production**. Which Wise **signing key** your server uses is controlled by environment variables—not by separate routes.

## Endpoint

| Environment | URL |
|-------------|-----|
| Local / staging | `https://<your-host>/api/webhooks/wise` |
| Production | `https://<your-domain>/api/webhooks/wise` |

Use the same path in the Wise sandbox and production APIs; point each Wise **application** subscription at the deployment that has the matching env vars.

## Environment variables

| Variable | Description |
|----------|-------------|
| `WISE_WEBHOOK_ENV` | `sandbox` or `production` — selects Wise’s published public key for `X-Signature-SHA256` verification. If omitted, sandbox is used except when `VERCEL_ENV=production` or `NODE_ENV=production` (then production key). |
| `WISE_WEBHOOK_PUBLIC_KEY` | Optional. Full PEM or raw base64 body to override the built-in sandbox/production keys (e.g. key rotation). |
| `WISE_PROFILE_ID` | Optional. If set, `swift-in#credit` events whose `data.action.profile_id` does not match are ignored. |

MongoDB: same as the rest of the app (`MONGODB_URI` / `MONGODB_URI_PROD` per `lib/mongodb.ts`).

## Wise: create subscriptions

Use Wise’s **Applications** API (or dashboard, if available for your account) to register webhooks.

- **Sandbox** API host: `https://api.wise-sandbox.com`
- **Production** API host: `https://api.wise.com`

Example (sandbox):

```bash
curl -X POST \
  "https://api.wise-sandbox.com/v3/applications/{{clientKey}}/subscriptions" \
  -H "Authorization: Bearer <client-credentials-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Akowe swift-in (sandbox)",
    "trigger_on": "swift-in#credit",
    "delivery": {
      "version": "4.0.0",
      "url": "https://your-staging-host/api/webhooks/wise"
    }
  }'
```

Repeat for `transfers#state-change` if you want those deliveries (the handler acknowledges them; upgrade is driven by `swift-in#credit`).

Repeat the same structure against **production** with your production URL and tokens.

Docs:

- [Event handling & signature verification](https://docs.wise.com/guides/developer/webhooks/event-handling)
- [swift-in#credit](https://docs.wise.com/guides/product/receive-money/subscribe-to-swift-in-credit)
- [transfers#state-change](https://docs.wise.com/guides/product/receive-money/subscribe-to-transfer-state-change)

## How upgrades work

1. Before paying, the user must have **`wisePaymentReference`** (and usually **`wisePendingPlan`** / **`wisePendingBillingCycle`**) set in the database — typically via a future “Pay with Wise” flow that generates a unique reference.
2. The customer sends a bank/SWIFT payment **using that reference** (or a reference that embeds their user id as a 24-character hex id).
3. When Wise sends **`swift-in#credit`**, the handler verifies the signature, dedupes by **`uetr`**, matches the payment to a user, then sets **`plan`**, **`billingCycle`**, and **`subscriptionStartDate`**, and clears the pending Wise fields.

Duplicate notifications (e.g. from also subscribing to `transfers#state-change`) are safe: processing is idempotent per **`uetr`**.

## Local testing

Wise may send **`X-Test-Notification: true`** when validating a URL; those requests are accepted after signature verification and do not upgrade users.
