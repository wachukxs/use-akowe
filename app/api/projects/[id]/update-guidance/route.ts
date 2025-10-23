import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import mongoose from 'mongoose';

// Helper function to create contextual writing guidance (copied from main route)
function getContextualGuidance(type: string, citationStyle: string, methodology: string, topic: string, targetWordCount: number) {
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

  // Topic-specific examples
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

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    
    const { topic, citationStyle, methodology, targetWordCount } = body;

    await connectDB();
    const project = await Project.findOne({ 
      _id: id, 
      userId: session.user.email 
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get contextual guidance
    const guidance = getContextualGuidance(project.type, citationStyle, methodology, topic, targetWordCount);

    // Update sections with contextual guidance
    const updatedSections = project.sections.map(section => {
      if (!section.content || section.content.length < 100) {
        // Generate contextual content based on section type
        let contextualContent = '';
        
        if (section.type === 'introduction') {
          contextualContent = `# Introduction

Welcome to your ${project.type}! This is where you'll introduce your research topic and set the stage for your argument.

## Getting Started
- **Hook your reader**: ${guidance.topicExample.hook}
- **Background context**: ${guidance.topicExample.context}
- **Thesis statement**: ${guidance.project.thesis}
- **Roadmap**: Briefly outline what you'll cover in this ${project.type}

## ${citationStyle} Citation Guidelines
- **Format**: ${guidance.citation.format}
- **Example**: ${guidance.citation.example}
- **Additional**: ${(guidance.citation as any).doi || (guidance.citation as any).page || (guidance.citation as any).note || (guidance.citation as any).technical || (guidance.citation as any).reference}

## ${methodology} Writing Approach
- **Methodology**: ${guidance.method.approach}
- **Evidence**: ${guidance.method.evidence}
- **Analysis**: ${guidance.method.analysis}

## Writing Tips
- Keep your introduction concise but comprehensive (aim for ${Math.round(targetWordCount * 0.1)}-${Math.round(targetWordCount * 0.15)} words)
- Make sure your thesis statement is specific and arguable
- Use this section to establish your credibility and the importance of your topic

*Start writing below to begin your introduction...*`;
        } else if (section.type === 'conclusion') {
          contextualContent = `# Conclusion

This is where you'll wrap up your ${project.type} and leave a lasting impression on your reader.

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
        } else if (section.type === 'literature_review') {
          contextualContent = `# Literature Review

This section demonstrates your understanding of existing research and positions your work within the broader academic conversation.

## What to Include
- **Theoretical framework**: Establish the theoretical foundation for your research
- **Key studies**: Review the most important and recent studies in your field
- **Gaps in research**: Identify what hasn't been studied or what needs further investigation
- **Your contribution**: Explain how your research addresses these gaps

## ${citationStyle} Citation Guidelines
- **Format**: ${guidance.citation.format}
- **Example**: ${guidance.citation.example}
- **Additional**: ${(guidance.citation as any).doi || (guidance.citation as any).page || (guidance.citation as any).note || (guidance.citation as any).technical || (guidance.citation as any).reference}

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

*Begin your literature review below...*`;
        } else {
          // Generic section with contextual guidance
          contextualContent = `# ${section.title}

This section is part of your ${project.type} on "${topic}".

## Getting Started
- **Purpose**: Define what this section will cover
- **Structure**: Plan how you'll organize your content
- **Evidence**: ${guidance.topicExample.evidence}

## ${citationStyle} Citation Guidelines
- **Format**: ${guidance.citation.format}
- **Example**: ${guidance.citation.example}

## ${methodology} Writing Approach
- **Methodology**: ${guidance.method.approach}
- **Analysis**: ${guidance.method.analysis}
- **Context**: ${guidance.topicExample.context}

## Writing Tips
- Start with a clear topic sentence
- Develop your ideas with specific examples
- Use transitions to connect ideas
- Aim for ${Math.round(targetWordCount * 0.15)}-${Math.round(targetWordCount * 0.2)} words

*Start writing below to develop this section...*`;
        }
        
        return {
          ...section,
          content: contextualContent,
          updatedAt: new Date()
        };
      }
      return section;
    });

    // Update the project
    project.sections = updatedSections;
    project.lastEditedAt = new Date();
    await project.save();

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Error updating project guidance:', error);
    return NextResponse.json({ error: 'Failed to update project guidance' }, { status: 500 });
  }
}
