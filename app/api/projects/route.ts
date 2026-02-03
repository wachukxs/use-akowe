import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import User from '@/models/User';
import { PLAN_LIMITS, PlanType, Section } from '@/types';
import { createProjectInternal } from '@/lib/project-creation';

// Helper function to create contextual writing guidance
function getContextualGuidance(type: string, citationStyle: string, methodology: string, topic: string, _targetWordCount: number) {
  void _targetWordCount;
  // Citation-specific guidance
  const citationGuidance = {
    'APA': {
      format: 'Use author-date citations: (Smith, 2023)',
      example: 'Recent studies indicate (Johnson et al., 2023) that...',
      doi: 'Include DOI when available: https://doi.org/10.1000/182'
    },
    'MLA': {
      format: 'Use parenthetical citations: (Smith 45)',
      example: 'As Smith argues, "climate change represents..." (45)',
      page: 'Include page numbers for direct quotes'
    },
    'Chicago': {
      format: 'Use footnotes or endnotes with full bibliographic information',
      example: 'Smith argues that climate change represents a critical challenge.¹',
      note: 'Include publisher, publication date, and page numbers'
    },
    'IEEE': {
      format: 'Use numbered citations: [1]',
      example: 'Recent research [1] indicates that...',
      technical: 'Include technical specifications and data'
    },
    'Harvard': {
      format: 'Use author-date citations: (Smith 2023)',
      example: 'Smith (2023) argues that...',
      reference: 'Include full reference list with publication details'
    }
  };

  // Methodology-specific guidance
  const methodologyGuidance = {
    'qualitative': {
      approach: 'Use thick description and include participant voices',
      evidence: 'Include direct quotes: "The participant described feeling..."',
      analysis: 'Discuss researcher reflexivity and positionality',
      sample: 'Describe sampling strategy and participant demographics'
    },
    'quantitative': {
      approach: 'Report exact statistical measures and significance levels',
      evidence: 'Include precise data: "The correlation was significant (r = 0.73, p < 0.001)"',
      analysis: 'Discuss statistical assumptions and limitations',
      sample: 'Report sample size, demographics, and response rates'
    },
    'mixed methods': {
      approach: 'Explain integration strategy and convergence/divergence',
      evidence: 'Combine statistical data with qualitative insights',
      analysis: 'Address how findings complement or contradict each other',
      sample: 'Describe both quantitative and qualitative sampling'
    },
    'literature review': {
      approach: 'Synthesize rather than just summarize individual studies',
      evidence: 'Identify patterns, trends, and gaps across studies',
      analysis: 'Critically evaluate strengths and weaknesses',
      sample: 'Include recent studies (last 5-10 years)'
    },
    'case study': {
      approach: 'Provide detailed context and background',
      evidence: 'Include specific examples and detailed descriptions',
      analysis: 'Discuss generalizability and limitations',
      sample: 'Describe case selection criteria and context'
    }
  };

  // Project type-specific guidance
  const projectTypeGuidance = {
    'essay': {
      structure: 'Focus on clear argumentation with 3-5 main points',
      thesis: 'State a specific, arguable thesis in your introduction',
      evidence: 'Use varied evidence types: statistics, expert opinions, examples',
      conclusion: 'Restate thesis and summarize key arguments'
    },
    'thesis': {
      structure: 'Emphasize original research contribution and extensive literature review',
      thesis: 'Present a research question that advances knowledge in your field',
      evidence: 'Include primary research data and comprehensive literature review',
      conclusion: 'Discuss implications for future research and practice'
    },
    'journal': {
      structure: 'Follow journal guidelines and peer review expectations',
      thesis: 'Present findings that contribute to the field',
      evidence: 'Include rigorous methodology and statistical analysis',
      conclusion: 'Discuss practical and theoretical implications'
    },
    'research': {
      structure: 'Emphasize empirical evidence and systematic methodology',
      thesis: 'Present research questions that can be empirically tested',
      evidence: 'Include data analysis, statistical tests, and findings',
      conclusion: 'Discuss limitations and suggest future research directions'
    }
  };

  // Topic-specific examples (simplified for now)
  const getTopicExample = (topic: string) => {
    const lowerTopic = topic.toLowerCase();
    if (lowerTopic.includes('climate') || lowerTopic.includes('environment')) {
      return {
        hook: 'Start with recent climate data: "The IPCC (2023) reports that global temperatures have risen..."',
        evidence: 'Include recent IPCC data, extreme weather events, or policy developments',
        context: 'Connect to broader environmental and policy implications'
      };
    } else if (lowerTopic.includes('psychology') || lowerTopic.includes('mental')) {
      return {
        hook: 'Begin with relatable behavior: "Every day, millions of people experience..."',
        evidence: 'Include demographic data, psychological theories, and case studies',
        context: 'Address ethical considerations and practical applications'
      };
    } else if (lowerTopic.includes('technology') || lowerTopic.includes('ai') || lowerTopic.includes('digital')) {
      return {
        hook: 'Open with current tech trends: "As artificial intelligence becomes increasingly..."',
        evidence: 'Include technical specifications, user data, and industry reports',
        context: 'Discuss practical applications and future implications'
      };
    } else {
      return {
        hook: `Start with a compelling statistic or recent development related to "${topic}"`,
        evidence: 'Include recent studies, expert opinions, and relevant data',
        context: 'Connect to broader implications and significance'
      };
    }
  };

  const citation = citationGuidance[citationStyle as keyof typeof citationGuidance] || citationGuidance['APA'];
  const method = methodologyGuidance[methodology.toLowerCase() as keyof typeof methodologyGuidance] || methodologyGuidance['literature review'];
  const project = projectTypeGuidance[type as keyof typeof projectTypeGuidance] || projectTypeGuidance['essay'];
  const topicExample = getTopicExample(topic);

  return { citation, method, project, topicExample };
}

// Helper function to create initial sections based on project type
function createInitialSections(type: string, projectName: string, topic: string, citationStyle: string, methodology: string, targetWordCount: number) {
  const guidance = getContextualGuidance(type, citationStyle, methodology, topic, targetWordCount);
  
  const getIntroContent = () => `# Introduction

Welcome to your ${type}! This is where you'll introduce your research topic and set the stage for your argument.

## Getting Started
- **Hook your reader**: ${guidance.topicExample.hook}
- **Background context**: ${guidance.topicExample.context}
- **Thesis statement**: ${guidance.project.thesis}
- **Roadmap**: Briefly outline what you'll cover in this ${type}

## ${citationStyle} Citation Guidelines
- **Format**: ${guidance.citation.format}
- **Example**: ${guidance.citation.example}
- **Additional**: ${('doi' in guidance.citation && guidance.citation.doi) || ('page' in guidance.citation && guidance.citation.page) || ('note' in guidance.citation && guidance.citation.note) || ('technical' in guidance.citation && guidance.citation.technical) || ('reference' in guidance.citation && guidance.citation.reference) || ''}

## ${methodology} Writing Approach
- **Methodology**: ${guidance.method.approach}
- **Evidence**: ${guidance.method.evidence}
- **Analysis**: ${guidance.method.analysis}

## Writing Tips
- Keep your introduction concise but comprehensive (aim for ${Math.round(targetWordCount * 0.1)}-${Math.round(targetWordCount * 0.15)} words)
- Make sure your thesis statement is specific and arguable
- Use this section to establish your credibility and the importance of your topic

*Start writing below to begin your introduction...*`;

  const getConclusionContent = () => `# Conclusion

This is where you'll wrap up your ${type} and leave a lasting impression on your reader.

## What to Include
- **Restate your thesis**: ${guidance.project.conclusion}
- **Summarize key points**: Briefly recap your main arguments
- **Implications**: ${guidance.topicExample.context}
- **Call to action**: Suggest next steps or areas for future research

## ${citationStyle} Citation Reminders
- **Final citations**: ${guidance.citation.format}
- **Reference list**: Ensure all cited sources are properly formatted

## Writing Tips
- Don't introduce new information here
- End with a strong, memorable statement
- Connect back to your introduction for a sense of closure
- Aim for ${Math.round(targetWordCount * 0.05)}-${Math.round(targetWordCount * 0.1)} words

*Start writing below to craft your conclusion...*`;

  const baseSections = [
    {
      id: 'intro',
      type: 'introduction',
      title: 'Introduction',
      content: getIntroContent(),
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'conclusion',
      type: 'conclusion',
      title: 'Conclusion',
      content: getConclusionContent(),
      order: 999,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ];

  switch (type) {
    case 'essay':
      return [
        ...baseSections,
        {
          id: 'body1',
          type: 'custom',
          title: 'Main Argument 1',
          content: `# Main Argument 1

This is your first main argument supporting your thesis. Make it strong and well-supported.

## Structure Your Argument
- **Topic sentence**: State your main point clearly
- **Evidence**: ${guidance.method.evidence}
- **Analysis**: ${guidance.method.analysis}
- **Transition**: Connect to your next point

## ${citationStyle} Citation Guidelines
- **Format**: ${guidance.citation.format}
- **Example**: ${guidance.citation.example}

## ${methodology} Writing Approach
- **Evidence types**: ${guidance.topicExample.evidence}
- **Analysis depth**: ${guidance.method.approach}
- **Sample considerations**: ${guidance.method.sample}

## Writing Tips
- Use specific examples rather than general statements
- Address potential counterarguments
- Keep paragraphs focused on one main idea
- Aim for ${Math.round(targetWordCount * 0.2)}-${Math.round(targetWordCount * 0.25)} words

*Start developing your first main argument below...*`,
          order: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'body2',
          type: 'custom',
          title: 'Main Argument 2',
          content: `# Main Argument 2

Your second main argument should build upon the first while presenting new evidence.

## Building Your Case
- **Topic sentence**: Introduce your second main point
- **Evidence**: ${guidance.method.evidence}
- **Analysis**: Show how this evidence strengthens your overall argument
- **Connection**: Link this point to your previous argument

## ${citationStyle} Citation Guidelines
- **Format**: ${guidance.citation.format}
- **Example**: ${guidance.citation.example}

## ${methodology} Writing Approach
- **Evidence variety**: ${guidance.topicExample.evidence}
- **Integration**: ${guidance.method.approach}
- **Context**: ${guidance.topicExample.context}

## Writing Tips
- Vary your evidence types for stronger persuasion
- Use transitional phrases to connect ideas
- Maintain consistent tone and voice
- Ensure each paragraph supports your thesis
- Aim for ${Math.round(targetWordCount * 0.2)}-${Math.round(targetWordCount * 0.25)} words

*Develop your second main argument below...*`,
          order: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'body3',
          type: 'custom',
          title: 'Main Argument 3',
          content: `# Main Argument 3

Your third main argument should be your strongest, leaving readers convinced of your position.

## Strengthening Your Position
- **Topic sentence**: Present your most compelling point
- **Evidence**: ${guidance.method.evidence}
- **Analysis**: Demonstrate why this evidence is crucial
- **Synthesis**: Show how all your arguments work together

## ${citationStyle} Citation Guidelines
- **Format**: ${guidance.citation.format}
- **Example**: ${guidance.citation.example}

## ${methodology} Writing Approach
- **Strongest evidence**: ${guidance.topicExample.evidence}
- **Critical analysis**: ${guidance.method.analysis}
- **Broader implications**: ${guidance.topicExample.context}

## Writing Tips
- Save your strongest evidence for this section
- Address the most significant counterargument
- Use emotional appeals appropriately
- End with a powerful statement that reinforces your thesis
- Aim for ${Math.round(targetWordCount * 0.2)}-${Math.round(targetWordCount * 0.25)} words

*Craft your strongest argument below...*`,
          order: 4,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];
    
    case 'thesis':
      return [
        {
          id: 'intro',
          type: 'introduction',
          title: 'Introduction',
          content: getIntroContent(),
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'litreview',
          type: 'literature_review',
          title: 'Literature Review',
          content: `# Literature Review

This section demonstrates your understanding of existing research and positions your work within the broader academic conversation.

## What to Include
- **Theoretical framework**: Establish the theoretical foundation for your research
- **Key studies**: Review the most important and recent studies in your field
- **Gaps in research**: Identify what hasn't been studied or what needs further investigation
- **Your contribution**: Explain how your research addresses these gaps

## ${citationStyle} Citation Guidelines
- **Format**: ${guidance.citation.format}
- **Example**: ${guidance.citation.example}
- **Additional**: ${('doi' in guidance.citation && guidance.citation.doi) || ('page' in guidance.citation && guidance.citation.page) || ('note' in guidance.citation && guidance.citation.note) || ('technical' in guidance.citation && guidance.citation.technical) || ('reference' in guidance.citation && guidance.citation.reference) || ''}

## ${methodology} Writing Approach
- **Synthesis**: ${guidance.method.approach}
- **Evidence**: ${guidance.method.evidence}
- **Analysis**: ${guidance.method.analysis}
- **Context**: ${guidance.topicExample.context}

## Writing Tips
- Organize chronologically, thematically, or methodologically
- Synthesize rather than just summarize individual studies
- Use critical analysis to evaluate the strengths and weaknesses of existing research
- Connect each study to your research question
- Aim for ${Math.round(targetWordCount * 0.25)}-${Math.round(targetWordCount * 0.3)} words

*Begin your literature review below...*`,
          order: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'methodology',
          type: 'methodology',
          title: 'Methodology',
          content: `# Methodology

This section explains how you conducted your research and why you chose these methods.

## Essential Components
- **Research design**: Describe your overall approach (qualitative, quantitative, mixed methods)
- **Data collection**: Explain how you gathered your data
- **Analysis methods**: Describe how you analyzed your data
- **Ethical considerations**: Address any ethical issues and how you handled them

## Writing Tips
- Be specific enough that others could replicate your study
- Justify your methodological choices
- Address potential limitations
- Use past tense (you've already completed the research)

*Detail your research methodology below...*`,
          order: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'results',
          type: 'results',
          title: 'Results',
          content: `# Results

Present your findings objectively without interpretation or analysis.

## What to Include
- **Data presentation**: Tables, figures, and statistical analyses
- **Key findings**: The most important results from your research
- **Patterns and trends**: What the data shows
- **Unexpected results**: Any surprising findings

## Writing Tips
- Present results objectively - save interpretation for the Discussion section
- Use clear, concise language
- Include appropriate statistical tests and significance levels
- Organize results logically (by research question or hypothesis)

*Present your research results below...*`,
          order: 4,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'discussion',
          type: 'discussion',
          title: 'Discussion',
          content: `# Discussion

This is where you interpret your results and discuss their implications.

## Key Elements
- **Interpretation**: What do your results mean?
- **Comparison**: How do your findings compare to previous research?
- **Implications**: What are the broader implications of your work?
- **Limitations**: What are the limitations of your study?

## Writing Tips
- Connect your findings back to your research questions
- Discuss both expected and unexpected results
- Address alternative explanations
- Suggest directions for future research

*Analyze and discuss your findings below...*`,
          order: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'conclusion',
          type: 'conclusion',
          title: 'Conclusion',
          content: getConclusionContent(),
          order: 6,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];
    
    case 'journal':
      return [
        {
          id: 'abstract',
          type: 'custom',
          title: 'Abstract',
          content: `# Abstract

A concise summary of your research that allows readers to quickly understand your study.

## What to Include
- **Background**: Brief context for your research
- **Objective**: Your research question or hypothesis
- **Methods**: How you conducted the study
- **Results**: Key findings
- **Conclusions**: Main implications

## Writing Tips
- Keep it concise (usually 150-300 words)
- Write in past tense
- Avoid abbreviations and citations
- Make it self-contained - readers should understand your study without reading the full paper

*Write your abstract below...*`,
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'intro',
          type: 'introduction',
          title: 'Introduction',
          content: getIntroContent(),
          order: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'methodology',
          type: 'methodology',
          title: 'Methods',
          content: `# Methods

Describe your research methodology in enough detail for replication.

## Essential Elements
- **Study design**: Your overall research approach
- **Participants**: Who was included in your study
- **Materials**: What tools or instruments you used
- **Procedure**: Step-by-step description of your process
- **Analysis**: How you analyzed your data

## Writing Tips
- Use past tense throughout
- Be specific about sample sizes, conditions, and procedures
- Include ethical approval information
- Organize logically and chronologically

*Detail your research methods below...*`,
          order: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'results',
          type: 'results',
          title: 'Results',
          content: `# Results

Present your findings clearly and objectively.

## Structure
- **Descriptive statistics**: Basic characteristics of your data
- **Main findings**: Results related to your hypotheses
- **Statistical tests**: Include test statistics and significance levels
- **Figures and tables**: Visual representations of your data

## Writing Tips
- Present results objectively without interpretation
- Use appropriate statistical notation
- Refer to figures and tables in the text
- Report exact p-values and effect sizes

*Present your results below...*`,
          order: 4,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'discussion',
          type: 'discussion',
          title: 'Discussion',
          content: `# Discussion

Interpret your results and discuss their significance.

## Key Components
- **Interpretation**: What your results mean
- **Comparison**: How your findings relate to previous research
- **Limitations**: Acknowledge study limitations
- **Implications**: Practical and theoretical implications
- **Future directions**: Suggestions for future research

## Writing Tips
- Start with your most important findings
- Address unexpected results
- Be honest about limitations
- Connect back to your introduction

*Discuss your findings below...*`,
          order: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'conclusion',
          type: 'conclusion',
          title: 'Conclusion',
          content: getConclusionContent(),
          order: 6,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];
    
    case 'research':
      return [
        {
          id: 'intro',
          type: 'introduction',
          title: 'Introduction',
          content: getIntroContent(),
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'litreview',
          type: 'literature_review',
          title: 'Literature Review',
          content: `# Literature Review

Comprehensive review of existing research relevant to your study.

## Organization Strategies
- **Chronological**: Trace the development of ideas over time
- **Thematic**: Group studies by topic or theme
- **Methodological**: Organize by research methods used
- **Theoretical**: Structure around theoretical frameworks

## Writing Tips
- Synthesize rather than just summarize
- Identify patterns, trends, and gaps
- Critically evaluate existing research
- Position your study within the broader context

*Begin your literature review below...*`,
          order: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'methodology',
          type: 'methodology',
          title: 'Research Methodology',
          content: `# Research Methodology

Detailed explanation of your research approach and methods.

## Components
- **Research design**: Overall strategy for answering your research questions
- **Data collection**: Methods for gathering information
- **Sampling**: How you selected participants or data sources
- **Data analysis**: Techniques for analyzing your data
- **Validity and reliability**: How you ensured quality

## Writing Tips
- Justify your methodological choices
- Provide enough detail for replication
- Address potential biases
- Consider ethical implications

*Detail your research methodology below...*`,
          order: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'results',
          type: 'results',
          title: 'Findings',
          content: `# Findings

Present your research findings clearly and systematically.

## Presentation
- **Data organization**: Logical structure for presenting results
- **Statistical analysis**: Appropriate tests and measures
- **Visual aids**: Tables, figures, and charts
- **Key patterns**: Important trends and relationships

## Writing Tips
- Present findings objectively
- Use clear, precise language
- Include confidence intervals and effect sizes
- Organize by research questions or hypotheses

*Present your findings below...*`,
          order: 4,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'discussion',
          type: 'discussion',
          title: 'Analysis & Discussion',
          content: `# Analysis & Discussion

Interpret your findings and discuss their implications.

## Analysis Framework
- **Interpretation**: What your findings mean
- **Comparison**: How results relate to existing literature
- **Theoretical implications**: How findings advance theory
- **Practical implications**: Real-world applications
- **Limitations**: Study constraints and their impact

## Writing Tips
- Start with your most significant findings
- Address unexpected results
- Be critical and reflective
- Suggest future research directions

*Analyze and discuss your findings below...*`,
          order: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'conclusion',
          type: 'conclusion',
          title: 'Conclusion',
          content: getConclusionContent(),
          order: 6,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];
    
    default:
      return baseSections;
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const projects = await Project.find({ userId: session.user.email })
      .sort({ lastEditedAt: -1 })
      .lean();

    // Clean up citations for all projects
    const cleanedProjects = await Promise.all(projects.map(async (project) => {
      if (!project.citations || project.citations.length === 0) {
        return project;
      }

      // Clean up malformed and template citations
      const cleanCitations = project.citations.filter(citation => {
        // Remove citations with malformed authors (too long or contain invalid characters)
        const hasMalformedAuthor = citation.authors.some(author => 
          author.length > 100 || 
          author.includes('\n') || 
          author.includes('.') || 
          author.includes(';')
        );
        
        // Remove template citations
        const isTemplateCitation = citation.authors.some(author => 
          author.toLowerCase().includes('smith') || 
          author.toLowerCase().includes('johnson') ||
          author.toLowerCase().includes('example') ||
          author.toLowerCase().includes('sample')
        );
        
        return !hasMalformedAuthor && !isTemplateCitation;
      });

      // If citations were cleaned, update the project in the database
      if (cleanCitations.length !== project.citations.length) {
       await Project.findOneAndUpdate(
          { _id: project._id, userId: session.user.email },
          { 
            citations: cleanCitations,
            lastEditedAt: new Date()
          }
        );
        
        return { ...project, citations: cleanCitations };
      }

      return project;
    }));
    
    return NextResponse.json({ projects: cleanedProjects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, type, topic, targetWordCount, citationStyle, methodology } = body;

    if (!name || !type || !topic || !methodology) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if this is user's first project (before creating)
    const currentProjectCount = await Project.countDocuments({ userId: session.user.email });
    const isFirstProject = currentProjectCount === 0;

    // Create initial sections based on project type
    const initialSections = createInitialSections(type, name, topic, citationStyle, methodology, targetWordCount);
    
    // Use shared project creation function
    const project = await createProjectInternal(session.user.email, {
      name,
      type,
      topic,
      targetWordCount: targetWordCount || 0,
      citationStyle: citationStyle || 'APA',
      methodology,
      sections: initialSections as Section[], // Type assertion needed due to Date objects
      status: 'draft',
      wordCount: 0,
    });

    // Track activation if this is first project
    if (isFirstProject) {
      const { recordFirstProjectCreated, extractAttributionFromRequest } = await import('@/lib/activation-tracking');
      const attribution = extractAttributionFromRequest(request);
      await recordFirstProjectCreated(session.user.email, attribution).catch(err => {
        console.error('Activation tracking failed:', err);
        // Don't block project creation if activation tracking fails
      });
    }

    // Return tracking metadata for first project
    const { createTrackingMetadata } = await import('@/lib/gtag-server');
    const tracking = createTrackingMetadata(
      isFirstProject,
      'first_project_created',
      {
        user_id: (session.user as { id?: string }).id || session.user.email,
        project_type: type,
      }
    );

    return NextResponse.json({ 
      project,
      ...(tracking && { tracking }),
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    
    // Handle specific errors from createProjectInternal
    if (error instanceof Error) {
      if (error.message.includes('Project limit reached') || error.message.includes('Free plan allows')) {
        await connectDB();
        const user = await User.findOne({ email: session.user.email });
        const limits = PLAN_LIMITS[user?.plan as PlanType || 'free'];
        const currentProjectCount = await Project.countDocuments({ userId: session.user.email });
        return NextResponse.json(
          { 
            error: 'Project limit reached',
            limit: limits.maxProjects,
            current: currentProjectCount,
            message: error.message
          },
          { status: 429 }
        );
      }
      if (error.message === 'User not found') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      if (error.message === 'Missing required fields') {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }
    }
    
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}