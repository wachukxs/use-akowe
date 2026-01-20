/**
 * Migration Script: Backfill Subscription Dates
 * 
 * This script fetches subscription creation dates from Stripe for users
 * who have stripeSubscriptionId but are missing subscriptionStartDate.
 * 
 * Run with: npx tsx scripts/backfill-subscription-dates.ts
 * 
 * Make sure your .env.local file has:
 * - MONGODB_URI
 * - STRIPE_SECRET_KEY_PROD_V2 (or STRIPE_SECRET_KEY_PROD / STRIPE_SECRET_KEY_TEST)
 */

// Load environment variables FIRST before any imports
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') });

// Verify MongoDB URI is loaded
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  console.error('Current working directory:', process.cwd());
  console.error('Looking for .env.local at:', resolve(process.cwd(), '.env.local'));
  process.exit(1);
}

import connectDB from '../lib/mongodb';
import User from '../models/User';
import Stripe from 'stripe';

// Initialize Stripe client (same logic as metrics files)
function getStripeClient(): Stripe | null {
  let stripeKey: string | undefined;
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    stripeKey = process.env.STRIPE_SECRET_KEY_PROD_V2 || 
                process.env.STRIPE_SECRET_KEY_PROD ||
                process.env.STRIPE_SECRET_KEY;
  } else {
    stripeKey = process.env.STRIPE_SECRET_KEY_TEST || 
                process.env.STRIPE_SECRET_KEY_DEV ||
                process.env.STRIPE_SECRET_KEY;
  }
  
  if (!stripeKey) {
    console.warn('⚠️  No Stripe secret key found. Skipping Stripe operations.');
    return null;
  }
  
  try {
    return new Stripe(stripeKey, {
      apiVersion: '2025-10-29.clover',
    });
  } catch (error) {
    console.error('❌ Failed to initialize Stripe:', error);
    return null;
  }
}

const stripe = getStripeClient();

async function backfillSubscriptionDates() {
  try {
    if (!stripe) {
      console.error('❌ Stripe client not initialized. Please check your environment variables.');
      process.exit(1);
    }

    console.log('🔄 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected\n');

    // Find all users with subscriptions but missing subscriptionStartDate
    const usersToUpdate = await User.find({
      stripeSubscriptionId: { $exists: true, $ne: null },
      $or: [
        { subscriptionStartDate: { $exists: false } },
        { subscriptionStartDate: null },
      ],
    }).select('_id email stripeSubscriptionId plan billingCycle createdAt').lean();

    console.log(`📊 Found ${usersToUpdate.length} users to update\n`);

    if (usersToUpdate.length === 0) {
      console.log('✅ No users need updating. All subscription dates are already set!');
      process.exit(0);
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ userId: string; email: string; error: string }> = [];

    for (let i = 0; i < usersToUpdate.length; i++) {
      const user = usersToUpdate[i];
      const progress = `[${i + 1}/${usersToUpdate.length}]`;

      try {
        console.log(`${progress} Fetching subscription for ${user.email}...`);

        // Fetch subscription from Stripe
        const subscription = await stripe.subscriptions.retrieve(
          user.stripeSubscriptionId as string
        );

        // Update user with subscription dates
        const subscriptionStartDate = new Date(subscription.created * 1000);
        const subscriptionEndDate = subscription.canceled_at
          ? new Date(subscription.canceled_at * 1000)
          : undefined;

        await User.findByIdAndUpdate(user._id, {
          subscriptionStartDate,
          subscriptionEndDate,
          // Also update plan and billingCycle if they're missing or incorrect
          plan: subscription.status === 'active' || subscription.status === 'trialing' ? 'pro' : 'free',
          billingCycle: subscription.items.data[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly',
        });

        console.log(
          `  ✅ Updated: Subscription started ${subscriptionStartDate.toISOString().split('T')[0]}`
        );
        successCount++;

        // Rate limiting: wait 100ms between requests to avoid hitting Stripe rate limits
        if (i < usersToUpdate.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } catch (error: any) {
        errorCount++;
        const errorMessage =
          error?.message || error?.toString() || 'Unknown error';
        errors.push({
          userId: user._id?.toString() || 'unknown',
          email: user.email || 'unknown',
          error: errorMessage,
        });

        console.log(`  ❌ Error: ${errorMessage}`);

        // If subscription not found, mark subscriptionEndDate and clear subscriptionId
        if (error?.code === 'resource_missing') {
          console.log(`  ⚠️  Subscription not found in Stripe, marking as ended...`);
          try {
            await User.findByIdAndUpdate(user._id, {
              subscriptionEndDate: new Date(),
              stripeSubscriptionId: undefined,
              plan: 'free',
            });
            console.log(`  ✅ Marked subscription as ended`);
          } catch (updateError) {
            console.log(`  ❌ Failed to update user: ${updateError}`);
          }
        }
      }
    }

    console.log('\n📈 Summary:');
    console.log(`  ✅ Successfully updated: ${successCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);

    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.forEach((err) => {
        console.log(`  - ${err.email}: ${err.error}`);
      });
    }

    console.log('\n✅ Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the migration
backfillSubscriptionDates();
