import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables FIRST before any imports
config({ path: resolve(process.cwd(), '.env.local') });

// Verify env is loaded
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  console.error('Current working directory:', process.cwd());
  console.error('Looking for .env.local at:', resolve(process.cwd(), '.env.local'));
  process.exit(1);
}

import connectDB from '../lib/mongodb';
import Project from '../models/Project';
import Resource from '../models/Resource';
import User from '../models/User';

const sampleResources = [
  {
    title: "Academic Writing Guide",
    description: "Comprehensive guide to structuring and writing academic papers.",
    category: "Writing",
    link: "https://example.com/academic-writing-guide",
    rating: 4.8,
    downloads: 1200,
    type: "PDF",
    tags: ["essay", "thesis", "structure", "writing"]
  },
  {
    title: "APA 7th Edition Citation Manual",
    description: "Official guide for APA style citations and referencing.",
    category: "Citations",
    link: "https://example.com/apa-manual",
    rating: 4.9,
    downloads: 2500,
    type: "PDF",
    tags: ["apa", "citation", "reference", "style"]
  },
  {
    title: "Qualitative Research Methods",
    description: "An introduction to qualitative research methodologies.",
    category: "Research",
    link: "https://example.com/qualitative-research",
    rating: 4.5,
    downloads: 800,
    type: "E-book",
    tags: ["methodology", "qualitative", "data collection", "research"]
  },
  {
    title: "Thesis Proposal Template",
    description: "A structured template for writing a thesis proposal.",
    category: "Writing",
    link: "https://example.com/thesis-template",
    rating: 4.7,
    downloads: 1500,
    type: "DOCX",
    tags: ["thesis", "template", "proposal", "structure"]
  },
  {
    title: "Literature Review Best Practices",
    description: "Tips and strategies for conducting and writing a literature review.",
    category: "Research",
    link: "https://example.com/literature-review",
    rating: 4.6,
    downloads: 950,
    type: "Article",
    tags: ["literature review", "research", "writing", "methodology"]
  },
  {
    title: "MLA Style Guide",
    description: "A quick reference for MLA citation style.",
    category: "Citations",
    link: "https://example.com/mla-guide",
    rating: 4.7,
    downloads: 1800,
    type: "PDF",
    tags: ["mla", "citation", "reference", "style"]
  },
  {
    title: "Experimental Design Principles",
    description: "Understanding the fundamentals of experimental research design.",
    category: "Research",
    link: "https://example.com/experimental-design",
    rating: 4.4,
    downloads: 600,
    type: "E-book",
    tags: ["methodology", "quantitative", "experiment", "design"]
  },
  {
    title: "Presentation Skills for Academics",
    description: "Tips for delivering effective academic presentations.",
    category: "Presentation",
    link: "https://example.com/presentation-skills",
    rating: 4.3,
    downloads: 700,
    type: "Video",
    tags: ["presentation", "public speaking", "defense", "academic"]
  },
  {
    title: "Plagiarism Prevention Checklist",
    description: "Ensure academic integrity with this comprehensive checklist.",
    category: "Ethics",
    link: "https://example.com/plagiarism-checklist",
    rating: 4.9,
    downloads: 2000,
    type: "PDF",
    tags: ["plagiarism", "ethics", "integrity", "academic"]
  },
  {
    title: "Mixed Methods Research Design",
    description: "Combining qualitative and quantitative approaches in research.",
    category: "Methodology",
    link: "https://example.com/mixed-methods",
    rating: 4.5,
    downloads: 750,
    type: "E-book",
    tags: ["methodology", "mixed methods", "research design", "qualitative", "quantitative"]
  }
];

const sampleProjects = [
  {
    userId: "demo@example.com",
    name: "Climate Change Thesis",
    type: "thesis",
    topic: "Impact of rising sea levels on coastal communities",
    wordCount: 15000,
    targetWordCount: 25000,
    status: "in_progress",
    citationStyle: "APA",
    methodology: "Qualitative case study"
  },
  {
    userId: "demo@example.com",
    name: "AI Ethics Essay",
    type: "essay",
    topic: "Ethical implications of generative AI in education",
    wordCount: 2500,
    targetWordCount: 3000,
    status: "in_progress",
    citationStyle: "MLA",
    methodology: "Literature review"
  },
  {
    userId: "demo@example.com",
    name: "Quantum Computing Journal",
    type: "journal",
    topic: "Advancements in quantum machine learning algorithms",
    wordCount: 8000,
    targetWordCount: 10000,
    status: "in_progress",
    citationStyle: "IEEE",
    methodology: "Experimental design"
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seed...');
    console.log('📍 MongoDB URI:', process.env.MONGODB_URI);
    
    await connectDB();
    console.log('✅ Connected to MongoDB');
    
    // Clear existing data
    await Resource.deleteMany({});
    await Project.deleteMany({});
    console.log('🗑️  Cleared existing data');
    
    // Create demo user if not exists
    const existingUser = await User.findOne({ email: "demo@example.com" });
    if (!existingUser) {
      const demoUser = new User({
        name: "Demo User",
        email: "demo@example.com",
        plan: "free"
      });
      await demoUser.save();
      console.log('✅ Demo user created');
    } else {
      console.log('✅ Demo user already exists');
    }
    
    // Seed resources
    for (const resourceData of sampleResources) {
      const resource = new Resource(resourceData);
      await resource.save();
    }
    console.log(`✅ ${sampleResources.length} resources created`);
    
    // Seed projects
    for (const projectData of sampleProjects) {
      const project = new Project(projectData);
      await project.save();
    }
    console.log(`✅ ${sampleProjects.length} projects created`);
    
    console.log('🎉 Database seeded successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   - Resources: ${sampleResources.length}`);
    console.log(`   - Projects: ${sampleProjects.length}`);
    console.log(`   - User: demo@example.com`);
    console.log('');
    console.log('🚀 You can now start your application with: npm run dev');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();