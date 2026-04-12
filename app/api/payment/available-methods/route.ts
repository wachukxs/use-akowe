import { NextRequest, NextResponse } from 'next/server';
import { shouldUseWisePaymentLinks } from '@/lib/payment-region';

export async function GET(request: NextRequest) {
  const isWiseRegion = shouldUseWisePaymentLinks(request);
  return NextResponse.json({ isWiseRegion });
}
