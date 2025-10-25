# Stripe Payment Integration Setup

## ✅ What's Been Implemented

### 1. **Stripe SDK Installed**
- Stripe package added to `package.json`
- Type definitions configured

### 2. **Environment Variables Added**
The following variables have been added to `.env.local`:

**Test Mode (Development):**
- `STRIPE_SECRET_KEY` - Test secret key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Test publishable key
- `STRIPE_PRICE_MONTHLY_TEST` - Monthly subscription price ID (test)
- `STRIPE_PRICE_ANNUAL_TEST` - Annual subscription price ID (test)

**Production (For Vercel):**
- `STRIPE_PRICE_MONTHLY_PROD` - Monthly subscription price ID (live)
- `STRIPE_PRICE_ANNUAL_PROD` - Annual subscription price ID (live)

### 3. **API Routes Created**
- `/api/payment/create-checkout-session` - Creates Stripe checkout session
- `/api/webhooks/stripe` - Handles Stripe webhook events

### 4. **Payment Pages Created**
- `/payment/success` - Success page after payment
- `/payment/cancel` - Cancel page when payment is cancelled

### 5. **Settings Page Updated**
- Upgrade button now integrates with Stripe Checkout
- Supports both monthly and annual billing cycles

## 🔧 Required Setup Steps

### Step 1: Set Up Stripe Webhook (REQUIRED FOR PRODUCTION)

The webhook URL needs to be configured in your Stripe Dashboard:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Set the endpoint URL to: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the "Signing secret" (starts with `whsec_...`)
6. Add it to your environment variables as `STRIPE_WEBHOOK_SECRET`

### Step 2: Add Production Keys to Vercel

When deploying to production:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add the following variables:

**Production Keys:**
```
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NODE_ENV=production
```

**Price IDs:**
```
STRIPE_PRICE_MONTHLY_PROD=price_...
STRIPE_PRICE_ANNUAL_PROD=price_...
```

Get your actual Price IDs from your Stripe Dashboard → Products → [Your Product] → Pricing.

### Step 3: Test Mode Setup (For Development)

Your `.env.local` is already configured for test mode. You can test the checkout flow using Stripe's test card numbers:

**Test Card:**
- Number: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

## 🧪 How to Test

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Go to Settings Page
Navigate to `http://localhost:3001/settings`

### 3. Click "Upgrade to Pro"
- Toggle between monthly/annual billing
- Click "Upgrade to Pro" button
- You'll be redirected to Stripe Checkout

### 4. Use Test Card
- Enter test card details
- Complete the checkout
- You'll be redirected to success page
- Your account will be upgraded to Pro

## 📋 What Happens After Payment

### Webhook Events Handled:

1. **`checkout.session.completed`** - When payment succeeds
   - User's plan is updated to 'pro'
   - Stripe subscription ID is saved to user record

2. **`customer.subscription.updated`** - When subscription changes
   - Updates user's plan status
   - Syncs subscription state

3. **`customer.subscription.deleted`** - When subscription cancelled
   - User is downgraded back to 'free' plan
   - Subscription ID is cleared

## 🔒 Security Features

- ✅ Webhook signature verification
- ✅ Server-side-only secret key usage
- ✅ Automatic customer creation in Stripe
- ✅ Metadata tracking for subscriptions
- ✅ Environment-based price ID selection

## 🚨 Important Notes

### Webhook Setup Required
**The webhooks are critical** - without them, user plan upgrades won't persist after successful payment. Make sure to:
1. Set up the webhook endpoint in Stripe Dashboard
2. Add the webhook secret to environment variables
3. Test webhook delivery in Stripe Dashboard

### Local Webhook Testing
For local development, you'll need to use [Stripe CLI](https://stripe.com/docs/stripe-cli):

```bash
stripe listen --forward-to localhost:3001/api/webhooks/stripe
```

This will give you a webhook signing secret to use locally.

## 📊 Pricing Configuration

Price and Product IDs are configured in your Stripe Dashboard and environment variables. These IDs are environment-specific:
- **Test Mode**: Use test price IDs from your Stripe Dashboard
- **Production Mode**: Use live price IDs from your Stripe Dashboard

Refer to your `.env.local` for the actual configured price IDs.

## 🎯 Edge Cases Covered

1. ✅ User already has Stripe customer ID - reuses existing customer
2. ✅ User doesn't have customer ID - creates new Stripe customer
3. ✅ Subscription cancellation - automatically downgrades to free
4. ✅ Subscription renewal - maintains pro access
5. ✅ Payment failure - user remains on free plan
6. ✅ Environment switching - automatic price ID selection

## 🔄 No Breaking Changes

- ✅ All existing functionality preserved
- ✅ Free plan users unaffected
- ✅ Existing user data unchanged
- ✅ Backward compatible with current user model
- ✅ Graceful fallback if Stripe is unavailable
