import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import User from '@/models/User';
import { PLAN_LIMITS, PlanType, Section } from '@/types';

/**
 * Shared function to create a project
 * Used by both normal project creation and import
 */
export async function createProjectInternal(
  userId: string,
  data: {
    name: string;
    type: string;
    topic: string;
    targetWordCount: number;
    citationStyle: string;
    methodology: string;
    sections: Section[];
    status?: 'draft' | 'in_progress';
    wordCount?: number;
  }
) {
  await connectDB();

  // Check project limits for free users
  const user = await User.findOne({ email: userId });
  if (!user) {
    throw new Error('User not found');
  }

  const limits = PLAN_LIMITS[user.plan as PlanType];
  if (limits.maxProjects && limits.maxProjects !== Infinity) {
    const currentProjectCount = await Project.countDocuments({ userId });
    if (currentProjectCount >= limits.maxProjects) {
      throw new Error(
        `Free plan allows ${limits.maxProjects} projects maximum. Upgrade to Pro for unlimited projects.`
      );
    }
  }

  // Validate required fields
  if (!data.name || !data.type || !data.topic || !data.methodology) {
    throw new Error('Missing required fields');
  }

  // Create project
  const project = new Project({
    userId,
    name: data.name,
    type: data.type,
    topic: data.topic,
    targetWordCount: data.targetWordCount || 0,
    citationStyle: data.citationStyle || 'APA',
    methodology: data.methodology,
    status: data.status || 'draft',
    wordCount: data.wordCount || 0,
    sections: data.sections || [],
  });

  await project.save();

  return project;
}
