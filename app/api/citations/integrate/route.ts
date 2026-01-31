import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import { formatYearForDisplay } from '@/lib/citation-year';
import OpenAI from 'openai';
import { checkAIWordLimit, incrementAIWords } from '@/lib/usage';
import { countWords } from '@/lib/utils';
import User from '@/models/User';
import connectDB from '@/lib/mongodb';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sectionContent, citation, citationStyle = 'APA', sectionTitle } = body;

    if (!sectionContent || !citation) {
      return NextResponse.json({ error: 'Section content and citation are required' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check usage limits for free users
    const estimatedWordsToGenerate = 100; // Citation integration is shorter
    const usageCheck = await checkAIWordLimit(user._id.toString(), estimatedWordsToGenerate);
    
    if (!usageCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Daily word limit reached',
          remaining: usageCheck.remaining,
          limit: usageCheck.limit,
        },
        { status: 429 }
      );
    }

    // Determine which model to use based on plan
    const model = user.plan === 'free' ? 'gpt-3.5-turbo' : 'gpt-4o-mini';

    // Create citation text based on style (use "n.d." when year is unknown)
    const authorsText = Array.isArray(citation.authors)
      ? citation.authors.join(', ')
      : citation.authors || 'Unknown Author';
    const yearDisplay = formatYearForDisplay(citation.year);

    let citationText = '';
    switch (citationStyle) {
      case 'APA':
        citationText = `(${authorsText}, ${yearDisplay})`;
        break;
      case 'MLA':
        citationText = `(${authorsText} ${yearDisplay})`;
        break;
      case 'Chicago':
        citationText = `(${authorsText} ${yearDisplay})`;
        break;
      case 'IEEE':
        citationText = `[${yearDisplay}]`;
        break;
      case 'Harvard':
        citationText = `(${authorsText} ${yearDisplay})`;
        break;
      default:
        citationText = `(${authorsText}, ${yearDisplay})`;
    }

    const systemPrompt = `You are an expert academic editor specializing in intelligent citation integration. Your task is to seamlessly place a citation within existing section content in the most natural and academically appropriate way.

CITATION TO INTEGRATE:
- Authors: ${authorsText}
- Year: ${yearDisplay}
- Title: ${citation.title}
- Citation Text: ${citationText}
- Citation Style: ${citationStyle}

CURRENT SECTION CONTEXT:
- Section: ${sectionTitle || 'Current Section'}
- Content: ${sectionContent}

🧠 INTELLIGENT CITATION INTEGRATION SYSTEM:

**CONTENT ANALYSIS:**
1. **Template Detection**: Is this placeholder/template content?
   - Contains: "Begin your", "Detailed explanation", "Present your", "This is where"
   - Action: Replace template with substantive content + citation

2. **Content Quality Assessment**: 
   - Well-written content: Integrate citation naturally without disrupting flow
   - Poor quality: Improve content while adding citation intelligently
   - Empty/short content: Create substantive content with citation

3. **Citation Relevance Analysis**:
   - Find sentences that make claims, present findings, or discuss concepts
   - Identify the most specific and important statements
   - Look for natural integration points that make academic sense
   - Think: Where would this citation add the most value?

**INTELLIGENT INTEGRATION STRATEGIES:**

🎯 **PRECISION PLACEMENT**:
- Place citations immediately after the most relevant claim
- Choose 1-2 most important sentences, not every possible location
- Ensure the citation directly supports the statement being made
- Maintain natural reading flow and academic tone

✨ **CONTENT ENHANCEMENT**:
- If content is weak, strengthen it while adding the citation
- If content is good, integrate citation without disrupting flow
- If content is template, create substantive content with citation
- Use proper academic transitions and connectors

🔧 **STYLE CONSISTENCY**:
- Maintain the existing writing style and tone
- Use correct ${citationStyle} citation format
- Ensure proper grammar and punctuation
- Create professional, publication-ready content

**INTEGRATION RULES:**
1. **NEVER** just append citations to the end
2. **ALWAYS** find the most relevant content to support
3. **ALWAYS** maintain natural academic flow
4. **ALWAYS** use proper citation format for ${citationStyle}
5. **ALWAYS** create content that looks professionally written
6. **AVOID** over-citing or placing citations in irrelevant locations
7. **THINK LOGICALLY**: What would make the most academic sense? Where would this citation strengthen the argument?

**EXAMPLES OF SMART INTEGRATION:**

Weak content: "Technology helps healthcare."
→ "Advanced technology significantly enhances healthcare delivery (Smith, 2023), particularly in diagnostic accuracy and treatment efficiency."

Good content: "Machine learning algorithms improve diagnostic accuracy."
→ "Machine learning algorithms improve diagnostic accuracy, with recent studies showing 23% better performance (Smith, 2023) compared to traditional methods."

Template content: "Begin your literature review below..."
→ "Recent research demonstrates the critical role of technology in healthcare transformation. Smith (2023) found that machine learning algorithms improve diagnostic accuracy by 23%, while Johnson (2022) highlighted the importance of data integration in treatment optimization."

Return the complete section content with the citation intelligently integrated. Focus on creating natural, professional academic writing that seamlessly incorporates the citation.`;

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Please integrate the citation "${citationText}" into this section content using ${citationStyle} style. Return the complete improved section content.` }
      ],
      temperature: 0.3, // Lower temperature for more consistent citation placement
      max_tokens: 800,
    });

    let integratedContent = completion.choices[0]?.message?.content || '';
    
    // Post-processing cleanup to remove unwanted prefixes
    const unwantedPrefixes = [
      `${sectionTitle}: `,
      'Introduction: ',
      'Literature Review: ',
      'Methodology: ',
      'Findings: ',
      'Analysis: ',
      'Conclusion: ',
      'Here\'s the integrated content:',
      'Here is the integrated content:',
      'The integrated content is:'
    ];
    
    for (const prefix of unwantedPrefixes) {
      if (integratedContent.startsWith(prefix)) {
        integratedContent = integratedContent.substring(prefix.length);
        break;
      }
    }
    
    // Clean up any leading/trailing whitespace
    integratedContent = integratedContent.trim();
    
    const wordCount = countWords(integratedContent);

    // Analyze integration quality
    const originalLength = sectionContent.length;
    const integratedLength = integratedContent.length;
    const isTemplateContent = sectionContent.toLowerCase().includes('begin your') || 
                             sectionContent.toLowerCase().includes('detailed explanation') ||
                             sectionContent.toLowerCase().includes('present your') ||
                             sectionContent.toLowerCase().includes('this is where');
    
    let integrationType = 'UNKNOWN';
    if (isTemplateContent) {
      integrationType = 'TEMPLATE_REPLACEMENT';
    } else if (integratedLength > originalLength * 1.3) {
      integrationType = 'CONTENT_EXPANSION';
    } else if (integratedLength < originalLength * 0.9) {
      integrationType = 'CONTENT_CONDENSATION';
    } else {
      integrationType = 'NATURAL_INTEGRATION';
   }
    // Track usage
    await incrementAIWords(user._id.toString(), wordCount);

    return NextResponse.json({
      integratedContent,
      wordCount,
      model,
      remaining: usageCheck.remaining - wordCount,
      citationPlaced: true,
      integrationType,
      isTemplateContent
    });

  } catch (error) {
    console.error('Error in citation integration:', error);
    return NextResponse.json({ error: 'Failed to integrate citation' }, { status: 500 });
  }
}
