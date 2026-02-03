/**
 * Annual plan discount verification and calculation utilities
 */

export interface AnnualDiscountInfo {
  monthlyPrice: number; // In dollars
  annualPrice: number; // In dollars
  monthlyYearlyCost: number; // Monthly price × 12
  savingsAmount: number; // Amount saved per year
  discountPercentage: number; // Percentage discount (0-100)
  monthlyEquivalent: number; // Annual price / 12
}

/**
 * Calculate annual discount information
 * 
 * @param monthlyPrice - Monthly subscription price in dollars
 * @param annualPrice - Annual subscription price in dollars
 * @returns Discount information including savings and percentage
 */
export function calculateAnnualDiscount(
  monthlyPrice: number,
  annualPrice: number
): AnnualDiscountInfo {
  const monthlyYearlyCost = monthlyPrice * 12;
  const savingsAmount = monthlyYearlyCost - annualPrice;
  const discountPercentage = monthlyYearlyCost > 0
    ? (savingsAmount / monthlyYearlyCost) * 100
    : 0;
  const monthlyEquivalent = annualPrice / 12;

  return {
    monthlyPrice,
    annualPrice,
    monthlyYearlyCost,
    savingsAmount: Math.round(savingsAmount * 100) / 100, // Round to 2 decimals
    discountPercentage: Math.round(discountPercentage * 100) / 100, // Round to 2 decimals
    monthlyEquivalent: Math.round(monthlyEquivalent * 100) / 100,
  };
}

/**
 * Get annual discount info for Pro plan
 * Based on current pricing: $12/month, $120/year
 */
export function getProPlanDiscount(): AnnualDiscountInfo {
  return calculateAnnualDiscount(12, 120);
}

/**
 * Format discount percentage for display
 */
export function formatDiscountPercentage(percentage: number): string {
  return `${Math.round(percentage)}%`;
}

/**
 * Format savings amount for display
 */
export function formatSavingsAmount(amount: number): string {
  return `Save $${Math.round(amount)} per year`;
}

/**
 * Verify that annual discount is correctly configured
 * Returns true if discount is valid (between 10% and 50%)
 */
export function verifyAnnualDiscount(
  monthlyPrice: number,
  annualPrice: number
): { valid: boolean; discountInfo: AnnualDiscountInfo; error?: string } {
  const discountInfo = calculateAnnualDiscount(monthlyPrice, annualPrice);

  // First validate annual price is less than monthly yearly cost
  if (annualPrice >= discountInfo.monthlyYearlyCost) {
    return {
      valid: false,
      discountInfo,
      error: 'Annual price must be less than monthly price × 12',
    };
  }

  // Then validate discount is reasonable (between 10% and 50%)
  if (discountInfo.discountPercentage < 10) {
    return {
      valid: false,
      discountInfo,
      error: `Discount too low: ${discountInfo.discountPercentage.toFixed(2)}%. Expected at least 10%.`,
    };
  }

  if (discountInfo.discountPercentage > 50) {
    return {
      valid: false,
      discountInfo,
      error: `Discount too high: ${discountInfo.discountPercentage.toFixed(2)}%. Expected at most 50%.`,
    };
  }

  return {
    valid: true,
    discountInfo,
  };
}
