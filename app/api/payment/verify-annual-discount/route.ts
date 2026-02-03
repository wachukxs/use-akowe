import { NextRequest, NextResponse } from 'next/server';
import { getProPlanDiscount, verifyAnnualDiscount } from '@/lib/annual-discount';
import { stripe, getStripePriceId } from '@/lib/stripe';

/**
 * API endpoint to verify annual plan discount configuration
 * Checks that Stripe prices match expected discount
 */
export async function GET(request: NextRequest) {
  try {
    // Get expected discount info
    const expectedDiscount = getProPlanDiscount();

    // Try to fetch actual Stripe prices for verification
    let actualMonthlyPrice: number | null = null;
    let actualAnnualPrice: number | null = null;
    let stripePricesMatch = false;

    try {
      const monthlyPriceId = getStripePriceId('monthly');
      const annualPriceId = getStripePriceId('annual');

      if (monthlyPriceId && annualPriceId) {
        const [monthlyPrice, annualPrice] = await Promise.all([
          stripe.prices.retrieve(monthlyPriceId),
          stripe.prices.retrieve(annualPriceId),
        ]);

        actualMonthlyPrice = (monthlyPrice.unit_amount || 0) / 100;
        actualAnnualPrice = (annualPrice.unit_amount || 0) / 100;

        // Verify Stripe prices match expected discount
        const verification = verifyAnnualDiscount(actualMonthlyPrice, actualAnnualPrice);
        stripePricesMatch = verification.valid;

        return NextResponse.json({
          expected: {
            monthlyPrice: expectedDiscount.monthlyPrice,
            annualPrice: expectedDiscount.annualPrice,
            discountPercentage: expectedDiscount.discountPercentage,
            savingsAmount: expectedDiscount.savingsAmount,
            monthlyEquivalent: expectedDiscount.monthlyEquivalent,
          },
          actual: {
            monthlyPrice: actualMonthlyPrice,
            annualPrice: actualAnnualPrice,
            discountPercentage: verification.discountInfo.discountPercentage,
            savingsAmount: verification.discountInfo.savingsAmount,
            monthlyEquivalent: verification.discountInfo.monthlyEquivalent,
          },
          verified: stripePricesMatch,
          error: verification.error,
          priceIds: {
            monthly: monthlyPriceId,
            annual: annualPriceId,
          },
        });
      }
    } catch (error) {
      console.error('Error fetching Stripe prices:', error);
      // Continue with expected values only
    }

    // Return expected discount info even if Stripe fetch fails
    return NextResponse.json({
      expected: {
        monthlyPrice: expectedDiscount.monthlyPrice,
        annualPrice: expectedDiscount.annualPrice,
        discountPercentage: expectedDiscount.discountPercentage,
        savingsAmount: expectedDiscount.savingsAmount,
        monthlyEquivalent: expectedDiscount.monthlyEquivalent,
      },
      actual: actualMonthlyPrice && actualAnnualPrice ? {
        monthlyPrice: actualMonthlyPrice,
        annualPrice: actualAnnualPrice,
      } : null,
      verified: stripePricesMatch,
      note: actualMonthlyPrice === null ? 'Could not fetch Stripe prices. Using expected values.' : undefined,
    });
  } catch (error) {
    console.error('Error verifying annual discount:', error);
    return NextResponse.json(
      { error: 'Failed to verify annual discount' },
      { status: 500 }
    );
  }
}
