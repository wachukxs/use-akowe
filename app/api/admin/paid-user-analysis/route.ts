import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin-auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Project from '@/models/Project';
import DailyUsage from '@/models/DailyUsage';

interface DateFilter {
  createdAt?: {
    $gte?: Date;
    $lte?: Date;
  };
}

interface UsageDateFilter {
  date?: {
    $gte?: string;
    $lte?: string;
  };
}


/**
 * Admin API endpoint to analyze "What paid users do differently"
 * 
 * Compares free vs paid users across multiple dimensions:
 * - Project behavior (count, completion, word count, types)
 * - AI usage patterns (frequency, volume, feature adoption)
 * - Feature adoption (citations, plagiarism checks, exports)
 * - Engagement patterns (active days, session frequency)
 * - Conversion patterns (what free users do before converting)
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin session using cookie-based auth
    const { authenticated: isAdmin } = await verifyAdminSession();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build date filter
    const dateFilter: DateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.createdAt.$lte = new Date(endDate);
      }
    }

    // Get user counts
    const freeUsers = await User.find({ plan: 'free', ...dateFilter }).lean();
    const paidUsers = await User.find({ plan: { $in: ['standard', 'pro', 'team'] }, ...dateFilter }).lean();
    
    const freeUserIds = freeUsers.map(u => u._id.toString());
    const paidUserIds = paidUsers.map(u => u._id.toString());

    // 1. PROJECT BEHAVIOR ANALYSIS
    const projectAnalysis = await analyzeProjectBehavior(freeUserIds, paidUserIds, dateFilter);

    // 2. AI USAGE ANALYSIS
    const aiUsageAnalysis = await analyzeAIUsage(freeUserIds, paidUserIds, dateFilter);

    // 3. FEATURE ADOPTION ANALYSIS
    const featureAnalysis = await analyzeFeatureAdoption(freeUserIds, paidUserIds, dateFilter);

    // 4. ENGAGEMENT ANALYSIS
    const engagementAnalysis = await analyzeEngagement(freeUserIds, paidUserIds, dateFilter);

    // 5. CONVERSION PATTERNS
    const conversionAnalysis = await analyzeConversionPatterns(dateFilter);

    return NextResponse.json({
      summary: {
        freeUsers: freeUsers.length,
        paidUsers: paidUsers.length,
        analysisDate: new Date().toISOString(),
        dateRange: {
          start: startDate || 'all-time',
          end: endDate || 'all-time',
        },
      },
      projectBehavior: projectAnalysis,
      aiUsage: aiUsageAnalysis,
      featureAdoption: featureAnalysis,
      engagement: engagementAnalysis,
      conversionPatterns: conversionAnalysis,
    });
  } catch (error) {
    console.error('Error analyzing paid user behavior:', error);
    return NextResponse.json(
      { error: 'Failed to analyze paid user behavior' },
      { status: 500 }
    );
  }
}

/**
 * Analyze project behavior differences
 */
async function analyzeProjectBehavior(
  freeUserIds: string[],
  paidUserIds: string[],
  dateFilter: DateFilter
) {
  // Projects by free users
  const freeProjects = await Project.find({
    userId: { $in: freeUserIds },
    ...dateFilter,
  }).lean();

  // Projects by paid users
  const paidProjects = await Project.find({
    userId: { $in: paidUserIds },
    ...dateFilter,
  }).lean();

  // Calculate metrics
  const freeAvgProjects = freeUserIds.length > 0 ? freeProjects.length / freeUserIds.length : 0;
  const paidAvgProjects = paidUserIds.length > 0 ? paidProjects.length / paidUserIds.length : 0;

  // Project completion rates
  const freeCompleted = freeProjects.filter(p => p.status === 'completed').length;
  const paidCompleted = paidProjects.filter(p => p.status === 'completed').length;
  const freeCompletionRate = freeProjects.length > 0 ? (freeCompleted / freeProjects.length) * 100 : 0;
  const paidCompletionRate = paidProjects.length > 0 ? (paidCompleted / paidProjects.length) * 100 : 0;

  // Average word count per project
  const freeAvgWordCount = freeProjects.length > 0
    ? freeProjects.reduce((sum, p) => sum + (p.wordCount || 0), 0) / freeProjects.length
    : 0;
  const paidAvgWordCount = paidProjects.length > 0
    ? paidProjects.reduce((sum, p) => sum + (p.wordCount || 0), 0) / paidProjects.length
    : 0;

  // Project types distribution
  const freeProjectTypes = freeProjects.reduce((acc, p) => {
    acc[p.type] = (acc[p.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const paidProjectTypes = paidProjects.reduce((acc, p) => {
    acc[p.type] = (acc[p.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    averageProjectsPerUser: {
      free: Math.round(freeAvgProjects * 100) / 100,
      paid: Math.round(paidAvgProjects * 100) / 100,
      difference: Math.round((paidAvgProjects - freeAvgProjects) * 100) / 100,
      differencePercent: freeAvgProjects > 0
        ? Math.round(((paidAvgProjects - freeAvgProjects) / freeAvgProjects) * 100)
        : 0,
    },
    completionRate: {
      free: Math.round(freeCompletionRate * 100) / 100,
      paid: Math.round(paidCompletionRate * 100) / 100,
      difference: Math.round((paidCompletionRate - freeCompletionRate) * 100) / 100,
    },
    averageWordCountPerProject: {
      free: Math.round(freeAvgWordCount),
      paid: Math.round(paidAvgWordCount),
      difference: Math.round(paidAvgWordCount - freeAvgWordCount),
      differencePercent: freeAvgWordCount > 0
        ? Math.round(((paidAvgWordCount - freeAvgWordCount) / freeAvgWordCount) * 100)
        : 0,
    },
    projectTypes: {
      free: freeProjectTypes,
      paid: paidProjectTypes,
    },
  };
}

/**
 * Analyze AI usage patterns
 */
async function analyzeAIUsage(
  freeUserIds: string[],
  paidUserIds: string[],
  dateFilter: DateFilter
) {
  // Build date filter for DailyUsage
  const usageDateFilter: UsageDateFilter = {};
  if (dateFilter.createdAt) {
    usageDateFilter.date = {};
    if (dateFilter.createdAt.$gte) {
      usageDateFilter.date.$gte = dateFilter.createdAt.$gte.toISOString().split('T')[0];
    }
    if (dateFilter.createdAt.$lte) {
      usageDateFilter.date.$lte = dateFilter.createdAt.$lte.toISOString().split('T')[0];
    }
  }

  // Free user usage
  const freeUsage = await DailyUsage.find({
    userId: { $in: freeUserIds },
    ...usageDateFilter,
  }).lean();

  // Paid user usage
  const paidUsage = await DailyUsage.find({
    userId: { $in: paidUserIds },
    ...usageDateFilter,
  }).lean();

  // Calculate total AI words
  const freeTotalWords = freeUsage.reduce((sum, u) => sum + (u.aiWordsGenerated || 0), 0);
  const paidTotalWords = paidUsage.reduce((sum, u) => sum + (u.aiWordsGenerated || 0), 0);

  // Average words per user
  const freeAvgWords = freeUserIds.length > 0 ? freeTotalWords / freeUserIds.length : 0;
  const paidAvgWords = paidUserIds.length > 0 ? paidTotalWords / paidUserIds.length : 0;

  // Average words per active day
  const freeActiveDays = freeUsage.filter(u => (u.aiWordsGenerated || 0) > 0).length;
  const paidActiveDays = paidUsage.filter(u => (u.aiWordsGenerated || 0) > 0).length;
  const freeAvgWordsPerDay = freeActiveDays > 0 ? freeTotalWords / freeActiveDays : 0;
  const paidAvgWordsPerDay = paidActiveDays > 0 ? paidTotalWords / paidActiveDays : 0;

  // Plagiarism checks
  const freeTotalPlagiarism = freeUsage.reduce((sum, u) => sum + (u.plagiarismChecks || 0), 0);
  const paidTotalPlagiarism = paidUsage.reduce((sum, u) => sum + (u.plagiarismChecks || 0), 0);
  const freeAvgPlagiarism = freeUserIds.length > 0 ? freeTotalPlagiarism / freeUserIds.length : 0;
  const paidAvgPlagiarism = paidUserIds.length > 0 ? paidTotalPlagiarism / paidUserIds.length : 0;

  // Users with any AI usage
  const freeUsersWithUsage = new Set(freeUsage.map(u => u.userId)).size;
  const paidUsersWithUsage = new Set(paidUsage.map(u => u.userId)).size;
  const freeUsageRate = freeUserIds.length > 0 ? (freeUsersWithUsage / freeUserIds.length) * 100 : 0;
  const paidUsageRate = paidUserIds.length > 0 ? (paidUsersWithUsage / paidUserIds.length) * 100 : 0;

  return {
    totalAIWords: {
      free: freeTotalWords,
      paid: paidTotalWords,
      difference: paidTotalWords - freeTotalWords,
      differencePercent: freeTotalWords > 0
        ? Math.round(((paidTotalWords - freeTotalWords) / freeTotalWords) * 100)
        : 0,
    },
    averageWordsPerUser: {
      free: Math.round(freeAvgWords),
      paid: Math.round(paidAvgWords),
      difference: Math.round(paidAvgWords - freeAvgWords),
      differencePercent: freeAvgWords > 0
        ? Math.round(((paidAvgWords - freeAvgWords) / freeAvgWords) * 100)
        : 0,
    },
    averageWordsPerActiveDay: {
      free: Math.round(freeAvgWordsPerDay),
      paid: Math.round(paidAvgWordsPerDay),
      difference: Math.round(paidAvgWordsPerDay - freeAvgWordsPerDay),
    },
    averagePlagiarismChecksPerUser: {
      free: Math.round(freeAvgPlagiarism * 100) / 100,
      paid: Math.round(paidAvgPlagiarism * 100) / 100,
      difference: Math.round((paidAvgPlagiarism - freeAvgPlagiarism) * 100) / 100,
      differencePercent: freeAvgPlagiarism > 0
        ? Math.round(((paidAvgPlagiarism - freeAvgPlagiarism) / freeAvgPlagiarism) * 100)
        : 0,
    },
    usageRate: {
      free: Math.round(freeUsageRate * 100) / 100,
      paid: Math.round(paidUsageRate * 100) / 100,
      difference: Math.round((paidUsageRate - freeUsageRate) * 100) / 100,
    },
    activeDays: {
      free: freeActiveDays,
      paid: paidActiveDays,
    },
  };
}

/**
 * Analyze feature adoption
 */
async function analyzeFeatureAdoption(
  freeUserIds: string[],
  paidUserIds: string[],
  dateFilter: DateFilter
) {
  // Free user projects
  const freeProjects = await Project.find({
    userId: { $in: freeUserIds },
    ...dateFilter,
  }).lean();

  // Paid user projects
  const paidProjects = await Project.find({
    userId: { $in: paidUserIds },
    ...dateFilter,
  }).lean();

  // Citation adoption
  const freeWithCitations = freeProjects.filter(p => (p.citations?.length || 0) > 0).length;
  const paidWithCitations = paidProjects.filter(p => (p.citations?.length || 0) > 0).length;
  const freeCitationRate = freeProjects.length > 0 ? (freeWithCitations / freeProjects.length) * 100 : 0;
  const paidCitationRate = paidProjects.length > 0 ? (paidWithCitations / paidProjects.length) * 100 : 0;

  // Average citations per project
  const freeAvgCitations = freeProjects.length > 0
    ? freeProjects.reduce((sum, p) => sum + (p.citations?.length || 0), 0) / freeProjects.length
    : 0;
  const paidAvgCitations = paidProjects.length > 0
    ? paidProjects.reduce((sum, p) => sum + (p.citations?.length || 0), 0) / paidProjects.length
    : 0;

  // Plagiarism check adoption
  const freeWithPlagiarism = freeProjects.filter(p => (p.plagiarismChecks?.length || 0) > 0).length;
  const paidWithPlagiarism = paidProjects.filter(p => (p.plagiarismChecks?.length || 0) > 0).length;
  const freePlagiarismRate = freeProjects.length > 0 ? (freeWithPlagiarism / freeProjects.length) * 100 : 0;
  const paidPlagiarismRate = paidProjects.length > 0 ? (paidWithPlagiarism / paidProjects.length) * 100 : 0;

  // PDF upload adoption
  const freeWithPDFs = freeProjects.filter(p => (p.pdfs?.length || 0) > 0).length;
  const paidWithPDFs = paidProjects.filter(p => (p.pdfs?.length || 0) > 0).length;
  const freePDFRate = freeProjects.length > 0 ? (freeWithPDFs / freeProjects.length) * 100 : 0;
  const paidPDFRate = paidProjects.length > 0 ? (paidWithPDFs / paidProjects.length) * 100 : 0;

  return {
    citations: {
      adoptionRate: {
        free: Math.round(freeCitationRate * 100) / 100,
        paid: Math.round(paidCitationRate * 100) / 100,
        difference: Math.round((paidCitationRate - freeCitationRate) * 100) / 100,
      },
      averagePerProject: {
        free: Math.round(freeAvgCitations * 100) / 100,
        paid: Math.round(paidAvgCitations * 100) / 100,
        difference: Math.round((paidAvgCitations - freeAvgCitations) * 100) / 100,
      },
    },
    plagiarismChecks: {
      adoptionRate: {
        free: Math.round(freePlagiarismRate * 100) / 100,
        paid: Math.round(paidPlagiarismRate * 100) / 100,
        difference: Math.round((paidPlagiarismRate - freePlagiarismRate) * 100) / 100,
      },
    },
    pdfUploads: {
      adoptionRate: {
        free: Math.round(freePDFRate * 100) / 100,
        paid: Math.round(paidPDFRate * 100) / 100,
        difference: Math.round((paidPDFRate - freePDFRate) * 100) / 100,
      },
    },
  };
}

/**
 * Analyze engagement patterns
 */
async function analyzeEngagement(
  freeUserIds: string[],
  paidUserIds: string[],
  dateFilter: DateFilter
) {
  // Build date filter for DailyUsage
  const usageDateFilter: UsageDateFilter = {};
  if (dateFilter.createdAt) {
    usageDateFilter.date = {};
    if (dateFilter.createdAt.$gte) {
      usageDateFilter.date.$gte = dateFilter.createdAt.$gte.toISOString().split('T')[0];
    }
    if (dateFilter.createdAt.$lte) {
      usageDateFilter.date.$lte = dateFilter.createdAt.$lte.toISOString().split('T')[0];
    }
  }

  // Get usage records
  const freeUsage = await DailyUsage.find({
    userId: { $in: freeUserIds },
    ...usageDateFilter,
  }).lean();

  const paidUsage = await DailyUsage.find({
    userId: { $in: paidUserIds },
    ...usageDateFilter,
  }).lean();

  // Calculate active days per user
  const freeActiveDaysByUser = freeUsage.reduce((acc, u) => {
    if ((u.aiWordsGenerated || 0) > 0 || (u.plagiarismChecks || 0) > 0) {
      acc[u.userId] = (acc[u.userId] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const paidActiveDaysByUser = paidUsage.reduce((acc, u) => {
    if ((u.aiWordsGenerated || 0) > 0 || (u.plagiarismChecks || 0) > 0) {
      acc[u.userId] = (acc[u.userId] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const freeAvgActiveDays = Object.keys(freeActiveDaysByUser).length > 0
    ? Object.values(freeActiveDaysByUser).reduce((sum, days) => sum + days, 0) / Object.keys(freeActiveDaysByUser).length
    : 0;

  const paidAvgActiveDays = Object.keys(paidActiveDaysByUser).length > 0
    ? Object.values(paidActiveDaysByUser).reduce((sum, days) => sum + days, 0) / Object.keys(paidActiveDaysByUser).length
    : 0;

  // Power users (5+ active days)
  const freePowerUsers = Object.values(freeActiveDaysByUser).filter(days => days >= 5).length;
  const paidPowerUsers = Object.values(paidActiveDaysByUser).filter(days => days >= 5).length;

  // Consistent users (3+ active days)
  const freeConsistentUsers = Object.values(freeActiveDaysByUser).filter(days => days >= 3).length;
  const paidConsistentUsers = Object.values(paidActiveDaysByUser).filter(days => days >= 3).length;

  return {
    averageActiveDaysPerUser: {
      free: Math.round(freeAvgActiveDays * 100) / 100,
      paid: Math.round(paidAvgActiveDays * 100) / 100,
      difference: Math.round((paidAvgActiveDays - freeAvgActiveDays) * 100) / 100,
    },
    powerUsers: {
      free: freePowerUsers,
      paid: paidPowerUsers,
      freePercent: freeUserIds.length > 0 ? Math.round((freePowerUsers / freeUserIds.length) * 100) : 0,
      paidPercent: paidUserIds.length > 0 ? Math.round((paidPowerUsers / paidUserIds.length) * 100) : 0,
    },
    consistentUsers: {
      free: freeConsistentUsers,
      paid: paidConsistentUsers,
      freePercent: freeUserIds.length > 0 ? Math.round((freeConsistentUsers / freeUserIds.length) * 100) : 0,
      paidPercent: paidUserIds.length > 0 ? Math.round((paidConsistentUsers / paidUserIds.length) * 100) : 0,
    },
  };
}

/**
 * Analyze conversion patterns (what free users do before converting)
 */
async function analyzeConversionPatterns(dateFilter: DateFilter) {
  // Get users who converted (have subscriptionStartDate)
  const convertedUsers = await User.find({
    plan: { $in: ['standard', 'pro', 'team'] },
    subscriptionStartDate: { $exists: true, $ne: null },
    ...dateFilter,
  }).lean();

  if (convertedUsers.length === 0) {
    return {
      totalConversions: 0,
      averageTimeToConversion: null,
      averageProjectsBeforeConversion: null,
      averageAIWordsBeforeConversion: null,
      note: 'No conversion data available',
    };
  }

  const conversionData = await Promise.all(
    convertedUsers.map(async (user) => {
      const subscriptionDate = user.subscriptionStartDate;
      if (!subscriptionDate) return null;

      // Get projects created before conversion
      const projectsBeforeConversion = await Project.countDocuments({
        userId: user.email,
        createdAt: { $lt: subscriptionDate },
      });

      // Get AI words generated before conversion
      const usageBeforeConversion = await DailyUsage.find({
        userId: user._id.toString(),
        date: { $lt: subscriptionDate.toISOString().split('T')[0] },
      }).lean();

      const aiWordsBeforeConversion = usageBeforeConversion.reduce(
        (sum, u) => sum + (u.aiWordsGenerated || 0),
        0
      );

      // Time to conversion (from account creation)
      const createdAt = user.createdAt instanceof Date ? user.createdAt : new Date(user.createdAt);
      const timeToConversion = subscriptionDate.getTime() - createdAt.getTime();
      const daysToConversion = timeToConversion / (1000 * 60 * 60 * 24);

      return {
        projects: projectsBeforeConversion,
        aiWords: aiWordsBeforeConversion,
        daysToConversion,
      };
    })
  );

  const validData = conversionData.filter((d): d is { projects: number; aiWords: number; daysToConversion: number } => d !== null);

  const avgTimeToConversion = validData.length > 0
    ? validData.reduce((sum, d) => sum + d.daysToConversion, 0) / validData.length
    : 0;

  const avgProjectsBeforeConversion = validData.length > 0
    ? validData.reduce((sum, d) => sum + d.projects, 0) / validData.length
    : 0;

  const avgAIWordsBeforeConversion = validData.length > 0
    ? validData.reduce((sum, d) => sum + d.aiWords, 0) / validData.length
    : 0;

  return {
    totalConversions: convertedUsers.length,
    averageTimeToConversion: {
      days: Math.round(avgTimeToConversion * 100) / 100,
      hours: Math.round(avgTimeToConversion * 24 * 100) / 100,
    },
    averageProjectsBeforeConversion: Math.round(avgProjectsBeforeConversion * 100) / 100,
    averageAIWordsBeforeConversion: Math.round(avgAIWordsBeforeConversion),
    conversionInsights: {
      usersWithProjectsBeforeConversion: validData.filter(d => d.projects > 0).length,
      usersWithAIUsageBeforeConversion: validData.filter(d => d.aiWords > 0).length,
      usersWithMultipleProjects: validData.filter(d => d.projects >= 2).length,
      usersWithHighAIUsage: validData.filter(d => d.aiWords >= 1000).length,
    },
  };
}
