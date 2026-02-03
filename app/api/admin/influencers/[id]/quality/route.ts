import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Influencer from '@/models/Influencer';
import { calculateInfluencerQuality } from '@/lib/influencer-quality';
import mongoose from 'mongoose';

/**
 * API endpoint to calculate and update influencer quality score
 * GET: Retrieve current quality score
 * POST: Recalculate and update quality score
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid influencer ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const influencer = await Influencer.findById(id).lean();
    if (!influencer) {
      return NextResponse.json(
        { error: 'Influencer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      influencerId: id,
      qualityScore: influencer.qualityScore ?? null,
      activationRate: influencer.activationRate ?? null,
      paidConversionRate: influencer.paidConversionRate ?? null,
      avgActiveDays: influencer.avgActiveDays ?? null,
      lastCalculated: influencer.qualityScoreLastCalculated ?? null,
    });
  } catch (error) {
    console.error('Error fetching influencer quality:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quality score' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid influencer ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const influencer = await Influencer.findById(id);
    if (!influencer) {
      return NextResponse.json(
        { error: 'Influencer not found' },
        { status: 404 }
      );
    }

    // Calculate quality metrics
    const qualityMetrics = await calculateInfluencerQuality(id);

    // Update influencer with quality scores
    influencer.qualityScore = qualityMetrics.qualityScore;
    influencer.activationRate = qualityMetrics.activationRate;
    influencer.paidConversionRate = qualityMetrics.paidConversionRate;
    influencer.avgActiveDays = qualityMetrics.avgActiveDays;
    influencer.qualityScoreLastCalculated = qualityMetrics.lastCalculated;
    await influencer.save();

    return NextResponse.json({
      message: 'Quality score calculated and updated successfully',
      metrics: qualityMetrics,
    });
  } catch (error) {
    console.error('Error calculating influencer quality:', error);
    return NextResponse.json(
      { error: 'Failed to calculate quality score' },
      { status: 500 }
    );
  }
}
