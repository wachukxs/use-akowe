import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-server';
import OpenAI from 'openai';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import User from '@/models/User';
import { checkAIWordLimit, incrementAIWords } from '@/lib/usage';
import { countWords } from '@/lib/utils';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Analyzes the state of section content
 * Returns: 'empty' | 'template' | 'has_content'
 */
function analyzeSectionState(content: string | null | undefined): 'empty' | 'template' | 'has_content' {
  if (!content || content.trim().length === 0) {
    return 'empty';
  }

  const contentLower = content.toLowerCase();
  
  // Check for template/placeholder markers
  const templateMarkers = [
    'begin your',
    'start writing below',
    'getting started',
    'this is where you\'ll',
    'detail your',
    'present your',
    'this section demonstrates',
    'what to include',
    'writing tips',
    'comprehensive review',
    'organization strategies',
    'this is where you\'ll wrap up'
  ];

  const isTemplate = templateMarkers.some(marker => contentLower.includes(marker));
  
  if (isTemplate) {
    return 'template';
  }
  
  return 'has_content';
}

/**
 * Builds a context summary that helps understand the user's situation
 * Handles edge cases gracefully (missing project, malformed data, etc.)
 */
function buildContextSummary(
  project: any,
  currentSectionContent: string | null | undefined,
  sectionTitle: string | null | undefined
) {
  // Handle edge cases: null/undefined project
  if (!project) {
    return {
      sectionState: analyzeSectionState(currentSectionContent),
      sectionTitle: sectionTitle || null,
      topicAvailable: false,
      topic: null,
      projectType: null,
      projectMethodology: null,
      projectCitationStyle: null,
      hasExistingContent: false,
      isTemplate: false,
      isEmpty: true,
      currentWordCount: 0,
      targetWordCount: 0,
    };
  }

  const sectionState = analyzeSectionState(currentSectionContent);
  
  // Safely extract topic with validation
  const topic = project.topic;
  const topicAvailable = !!topic && typeof topic === 'string' && topic.trim().length > 0;
  const safeTopic = topicAvailable ? topic.trim() : null;
  
  // Safely extract other project fields with fallbacks
  return {
    sectionState,
    sectionTitle: (sectionTitle && typeof sectionTitle === 'string') ? sectionTitle.trim() : null,
    topicAvailable,
    topic: safeTopic,
    projectType: project.type || null,
    projectMethodology: project.methodology || null,
    projectCitationStyle: project.citationStyle || null,
    hasExistingContent: sectionState === 'has_content',
    isTemplate: sectionState === 'template',
    isEmpty: sectionState === 'empty',
    currentWordCount: typeof project.wordCount === 'number' ? project.wordCount : 0,
    targetWordCount: typeof project.targetWordCount === 'number' ? project.targetWordCount : 0,
  };
}

/**
 * Validates response quality and content
 * Returns validation result with quality flags
 */
function validateResponse(response: string, intent: 'chat' | 'integrate'): {
  isValid: boolean;
  isEmpty: boolean;
  isTooShort: boolean;
  hasClarificationRequest: boolean;
  cleanedResponse?: string;
} {
  const trimmed = response.trim();
  
  if (!trimmed || trimmed.length === 0) {
    return { isValid: false, isEmpty: true, isTooShort: false, hasClarificationRequest: false };
  }

  // Check for clarification requests (not valid responses)
  const clarificationPatterns = [
    /could you please (specify|clarify|provide)/i,
    /which (section|part|topic)/i,
    /what do you mean/i,
    /can you (tell|explain) (me )?more/i,
  ];
  
  const hasClarificationRequest = clarificationPatterns.some(pattern => pattern.test(trimmed));

  // Check if too short (likely incomplete response)
  const isTooShort = intent === 'integrate' ? trimmed.length < 20 : trimmed.length < 10;

  const isValid = !hasClarificationRequest && !isTooShort;

  return {
    isValid,
    isEmpty: false,
    isTooShort,
    hasClarificationRequest,
    cleanedResponse: isValid ? trimmed : undefined,
  };
}

/**
 * Detects the user's intent from their message, optionally using context
 * Returns: 'chat' (for explanations, analysis) or 'integrate' (for modifications)
 */
async function detectIntent(
  message: string,
  contextSummary?: {
    sectionState: 'empty' | 'template' | 'has_content';
    topicAvailable: boolean;
    sectionTitle: string | null;
  }
): Promise<'chat' | 'integrate'> {
  // Build context-aware prompt if context is available
  const contextInfo = contextSummary
    ? `**CONTEXT:** Section: ${contextSummary.sectionTitle || 'Current'} (${contextSummary.sectionState})${contextSummary.topicAvailable ? ' | Topic available' : ''}

Context-based rules:
- Empty/template + "how to start" → INTEGRATE | Has content + "how to start" → CHAT
- Empty/template + "what's the best way" → INTEGRATE | Has content + "what's the best way" → CHAT

` : '';

  const intentDetectionPrompt = `Analyze this user request and classify it into one of two categories:

1. **CHAT**: User wants explanation, analysis, critique, feedback, or discussion (text response, not inserted)
   - Examples: "explain", "what does this mean", "analyze", "review", "critique", "feedback", "how is this", "is this good", "summarize"
   - User wants guidance/advice but NOT content to insert
   
2. **INTEGRATE**: User wants modification, improvement, or content generation (content to insert)
   - Examples: "improve", "fix", "make better", "add", "expand", "write", "create", "generate", "enhance", "refine", "start", "begin"
   - User wants content generated/modified that should be inserted into the section

${contextInfo}User request: "${message}"

Respond with ONLY one word: "CHAT" or "INTEGRATE"`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are an intent classifier. Respond with only one word. Use context when provided to make better decisions.' },
        { role: 'user', content: intentDetectionPrompt }
      ],
      temperature: 0,
      max_tokens: 10,
    });

    const intent = completion.choices[0]?.message?.content?.trim().toUpperCase();
    return intent === 'CHAT' ? 'chat' : 'integrate';
  } catch (error) {
    console.error('Intent detection error:', error);
    // Default to integrate to maintain backward compatibility
    return 'integrate';
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, projectId, currentSectionContent: rawSectionContent, sectionTitle, insertionMode = 'integrate' } = body;
    
    // Truncate currentSectionContent to avoid token limit issues (approx 4000 chars ~ 1000 tokens)
    const MAX_SECTION_CONTENT_LENGTH = 4000;
    const currentSectionContent = rawSectionContent && rawSectionContent.length > MAX_SECTION_CONTENT_LENGTH
      ? rawSectionContent.substring(0, MAX_SECTION_CONTENT_LENGTH) + '\n\n[... content truncated for brevity ...]'
      : rawSectionContent;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check usage limits for free users
    // Estimate ~300 words per AI response
    const estimatedWordsToGenerate = 300;
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

    // Get project context if projectId is provided
    let projectContext = '';
    let project: any = null;
    
    if (projectId) {
      project = await Project.findOne({ 
        _id: projectId, 
        userId: session.user.email 
      }).lean();

      if (project) {
        // Build limited project context to avoid token limit issues
        // Only include section titles (not full content) to keep context manageable
        const sectionsList = project.sections?.map((section: any) => 
          `- ${section.title}${section.content?.trim() ? ' [has content]' : ' [empty]'}`
        ).join('\n') || '';

        // Limit citations to first 10 (use "n.d." when year is unknown)
        const citationsList = project.citations?.slice(0, 10).map((citation: any) =>
          `${citation.title} (${citation.authors}) - ${citation.year ?? 'n.d.'}`
        ).join('\n') || '';
        
        const moreCitations = (project.citations?.length || 0) > 10 
          ? `\n... and ${project.citations.length - 10} more citations` 
          : '';

        projectContext = `
PROJECT CONTEXT:
- Name: ${project.name}
- Type: ${project.type}
- Topic: ${project.topic}
- Methodology: ${project.methodology}
- Citation Style: ${project.citationStyle}
- Target Word Count: ${project.targetWordCount}
- Current Word Count: ${project.wordCount || 0}
- Status: ${project.status}

SECTIONS:
${sectionsList}

CITATIONS (${project.citations?.length || 0} total):
${citationsList}${moreCitations}

WRITING PROGRESS:
- Completion: ${Math.round(((project.wordCount || 0) / project.targetWordCount) * 100)}%
- Sections completed: ${project.sections?.filter((s: any) => s.content?.trim()).length || 0}/${project.sections?.length || 0}
`;
      }
    }

    // Determine which model to use based on plan
    const model = user.plan === 'free' ? 'gpt-3.5-turbo' : 'gpt-4o-mini';

    // Build context summary for intelligent understanding
    const contextSummary = buildContextSummary(project, currentSectionContent, sectionTitle);

    // Detect user intent with context awareness
    const detectedIntent = await detectIntent(message, {
      sectionState: contextSummary.sectionState,
      topicAvailable: contextSummary.topicAvailable,
      sectionTitle: contextSummary.sectionTitle,
    });
   // If intent is 'chat', use simpler prompt focused on explanation/analysis
    if (detectedIntent === 'chat') {
      // Build context-aware chat prompt
      const contextInfo = contextSummary.topicAvailable 
        ? `**CONTEXT AWARENESS:**
- The user is working on: "${contextSummary.topic}"
- Section: ${contextSummary.sectionTitle || 'Current Section'} (${contextSummary.sectionState})
- Project Type: ${contextSummary.projectType || 'Research project'}
${contextSummary.projectMethodology ? `- Methodology: ${contextSummary.projectMethodology}` : ''}
${contextSummary.projectCitationStyle ? `- Citation Style: ${contextSummary.projectCitationStyle}` : ''}

**CRITICAL INSTRUCTIONS**:
1. When the user asks about their topic or how to start/write something, EXPLICITLY reference their specific topic ("${contextSummary.topic}") in your response
2. Provide topic-specific examples, hooks, data points, and strategies rather than generic advice
3. If the user says "you know my topic" or similar, demonstrate that you know it by using "${contextSummary.topic}" explicitly
4. Make your advice directly relevant to "${contextSummary.topic}" - reference specific aspects, challenges, or opportunities related to this topic

${contextSummary.isTemplate ? `**SECTION STATE: Template Content**
- The current section has template/placeholder content
- The user is asking for advice on how to start writing substantive content
- Provide specific, actionable guidance for their topic "${contextSummary.topic}"
- Give them concrete examples they can use for "${contextSummary.topic}"

` : contextSummary.hasExistingContent
      ? `**SECTION STATE: Has Existing Content**
- The section already has substantive content
- The user is asking for advice on improving, expanding, or understanding their existing work
- Reference their topic "${contextSummary.topic}" when giving suggestions
- Make suggestions that are relevant to their specific research area

` : contextSummary.isEmpty
      ? `**SECTION STATE: Empty Section**
- The section is empty
- The user is asking for guidance on how to begin writing
- Provide specific advice for starting their work on "${contextSummary.topic}"
- Give topic-specific examples and strategies they can use

` : ''}` : '';

      const chatSystemPrompt = `You are Akowe, a senior academic editor and writing mentor. The user is asking for explanation, analysis, or feedback about their writing.

${contextInfo}**CRITICAL: RESPONSE LENGTH CONTROL**
You must determine the appropriate response length based on the user's request. Be concise and scannable. Break down your thinking:

1. **QUICK ANSWERS** (20-50 words): User asks simple, direct questions
   - "What does this mean?" → Brief explanation
   - "Is this correct?" → Yes/No with brief context
   - "Explain briefly" → 2-3 sentences

2. **STRUCTURED FEEDBACK** (50-150 words): User asks for analysis or review
   - "What's good/bad about this?" → Bullet points with specific examples
   - "What's missing?" → List with brief explanations
   - "How can I improve this?" → Key suggestions with rationale
   - Use bullet points or numbered lists for clarity

3. **DETAILED ANALYSIS** (150-300 words): User asks for comprehensive evaluation
   - "Analyze this section" → Structured breakdown with examples
   - "What are the strengths and weaknesses?" → Balanced assessment
   - "Review the flow and structure" → Clear sections with specific references

4. **IN-DEPTH REVIEW** (300-500 words): User asks for thorough critique
   - Only when explicitly requested: "detailed analysis", "thorough review"
   - Comprehensive evaluation with multiple aspects covered

**LENGTH RULES:**
- NEVER exceed 500 words unless user specifically requests detailed review
- Use bullet points for lists (easier to scan)
- Use bold for key points
- Get to the point quickly - no filler
- If you find yourself writing more than needed, stop and ask: "Did I answer the specific question?"

${currentSectionContent ? `CURRENT SECTION CONTENT:
${currentSectionContent}` : ''}

${projectContext ? `PROJECT CONTEXT:
${projectContext}` : ''}

Avoid AI-sounding phrases like "delve", "explore", "furthermore", "it is important to note". Be natural and direct.`;

      const chatCompletion = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: chatSystemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 600, // Reduced from 800 to encourage conciseness
      });

      let chatResponse = chatCompletion.choices[0]?.message?.content || '';
      
      // Validate response quality
      const validation = validateResponse(chatResponse, 'chat');
      if (!validation.isValid && !validation.isEmpty) {
        // If response is invalid (too short, clarification request), log but still return it
        console.warn('Chat response quality warning:', {
          isEmpty: validation.isEmpty,
          isTooShort: validation.isTooShort,
          hasClarificationRequest: validation.hasClarificationRequest,
        });
      }
      
      // Use cleaned response if available
      chatResponse = validation.cleanedResponse || chatResponse;
      const wordCount = countWords(chatResponse);

      // Check if this is first output (before incrementing)
      const isFirstOutput = usageCheck.remaining === usageCheck.limit;

      // Track usage
      await incrementAIWords(user._id.toString(), wordCount);

      // Return tracking metadata for first output
      const { createTrackingMetadata } = await import('@/lib/gtag-server');
      const tracking = createTrackingMetadata(
        isFirstOutput,
        'first_output_generated',
        {
          user_id: user._id.toString(),
          output_type: 'assistant',
        }
      );

      return NextResponse.json({
        response: chatResponse,
        wordCount,
        model,
        remaining: usageCheck.remaining - wordCount,
        intent: 'chat',
        isIntegrated: false, // Chat responses are standalone
        projectContext: project ? {
          name: project.name,
          type: project.type,
          progress: Math.round(((project.wordCount || 0) / project.targetWordCount) * 100)
        } : null,
        ...(tracking && { tracking }),
      });
    }

    // Continue with existing integration flow for 'integrate' intent
    // Create context-aware system prompt
    const topicGuidance = contextSummary.topicAvailable 
      ? `**TOPIC-AWARE CONTENT GENERATION:**
- User's Research Topic: "${contextSummary.topic}"
- Project Type: ${contextSummary.projectType || 'Research project'}
${contextSummary.projectMethodology ? `- Methodology: ${contextSummary.projectMethodology}` : ''}
${contextSummary.projectCitationStyle ? `- Citation Style: ${contextSummary.projectCitationStyle}` : ''}

**CRITICAL REQUIREMENTS**:
1. When generating content, EXPLICITLY use the topic "${contextSummary.topic}" in the generated text
2. Provide topic-specific examples, data points, citations, and strategies related to "${contextSummary.topic}"
3. If user says "you know my topic" or "what's the best way to start", generate content that directly addresses "${contextSummary.topic}"
4. Create content that is specifically tailored to "${contextSummary.topic}" - use concrete examples and references related to this topic
5. Avoid generic academic content - make it specific to "${contextSummary.topic}"

**TOPIC-SPECIFIC CONTENT EXAMPLES**:
- If topic is "Impact of AI on Climate Change", generate content about AI applications in climate science, not generic AI or generic climate content
- If topic is "Renewable Energy Adoption", generate content about solar/wind/battery technologies, not generic energy content
- Always ground your content in the specific domain and context of "${contextSummary.topic}"

` : '';

    const sectionStateGuidance = contextSummary.isTemplate
      ? `**SECTION STATE: Template Content Detected**
- The section currently has template/placeholder content that should be REPLACED
- User wants substantive, topic-specific content to replace the template
- Generate NEW content that:
  ${contextSummary.topicAvailable ? `1. Explicitly uses the topic "${contextSummary.topic}"` : '1. Is substantive and research-focused'}
  2. Replaces all template/placeholder text
  3. Creates content suitable for the "${contextSummary.sectionTitle || 'current section'}" section
  ${contextSummary.projectMethodology ? `4. Follows ${contextSummary.projectMethodology} methodology approach` : ''}
  5. Is ready for immediate use (no template instructions)
${contextSummary.topicAvailable ? `
**IMPORTANT**: Start the content with a concrete, topic-specific opening related to "${contextSummary.topic}". Do not use generic openings.` : ''}

` : contextSummary.isEmpty
      ? `**SECTION STATE: Empty Section**
- The section is completely empty
- User wants to CREATE new content from scratch
- Generate substantive, academic content that:
  ${contextSummary.topicAvailable ? `1. Explicitly addresses the topic "${contextSummary.topic}"` : '1. Is appropriate for academic writing'}
  2. Is suitable for the "${contextSummary.sectionTitle || 'current section'}" section
  ${contextSummary.projectMethodology ? `3. Follows ${contextSummary.projectMethodology} methodology approach` : ''}
  4. Creates a strong foundation for the section
${contextSummary.topicAvailable ? `
**IMPORTANT**: Create content that immediately engages with "${contextSummary.topic}" - use specific examples and concrete details related to this topic.` : ''}

` : `**SECTION STATE: Has Existing Content**
- The section already has substantive content (${contextSummary.sectionTitle || 'current section'})
- Analyze user intent carefully:
  - EXPAND: User wants to add to existing content → Keep existing content exactly as-is, add new content after it
  - IMPROVE: User wants to enhance existing content → Refine and strengthen what's there while keeping core ideas
  - REPLACE: User explicitly wants to replace everything → Provide complete new content
${contextSummary.topicAvailable ? `
- When expanding/improving, ensure new content relates to "${contextSummary.topic}" and integrates well with existing content` : ''}

`;

    const systemPrompt = `You are Akowe, a senior academic editor and writing mentor with 15+ years of experience. You provide deeply insightful, specific, and actionable feedback - not generic advice.

${topicGuidance}${sectionStateGuidance}${currentSectionContent && insertionMode === 'integrate' ? `
        🚨 CRITICAL: You are currently working on the "${sectionTitle || 'Current Section'}" section. The user is asking you to work with the content that is ALREADY in this section. Do NOT ask clarifying questions - work with what's provided and give specific, actionable responses.
        
        🚨 ABSOLUTE RULE: Analyze the user's intent logically. If they want to ADD TO, EXPAND, BUILD ON, ENHANCE, IMPROVE, DEVELOP, ELABORATE, EXTEND, or any similar concept with existing content, you MUST keep the existing content exactly as it is and add new content after it. Only replace existing content if they explicitly want a complete rewrite or replacement.
        
        🚨 CRITICAL: NEVER include the section title (like "Introduction:") in your response. The section title is already known - just provide the content.
` : ''}

${currentSectionContent && insertionMode === 'integrate' ? `
CURRENT SECTION CONTEXT:
- Section: ${sectionTitle || 'Current Section'}
- Existing Content: ${currentSectionContent}

🧠 INTELLIGENT INTENT ANALYSIS:
You must analyze the user's request to understand their TRUE INTENT and choose the appropriate operation. Think logically about what they're trying to achieve:

**INTENT ANALYSIS FRAMEWORK:**

🔄 REPLACE OPERATIONS (Complete rewrite):
- User wants to start over, completely change direction, or fundamentally alter the content
- User expresses dissatisfaction with the entire approach or content
- User wants something completely different from what exists

➕ ADD/EXPAND OPERATIONS (Keep existing + add more):
- User wants to build upon, extend, or add to existing content
- User wants more detail, examples, or information
- User wants to develop ideas further or elaborate on points
- User wants to increase length or word count
- User wants to enhance without losing what's already there
- User says: "expand", "add", "include", "elaborate", "develop", "extend", "build on", "enhance", "improve", "strengthen", "grow", "increase", "more", "additional", "further", "deeper", "detailed", "comprehensive"
- User mentions word count targets: "add 20 words", "more words", "increase length"
- User wants to add specific elements: "add citation", "add example", "add evidence"

✨ IMPROVE/ENHANCE OPERATIONS (Keep structure, improve content):
- User wants to make existing content better, stronger, or more compelling
- User wants to polish, refine, or strengthen what's already written
- User wants to improve quality without changing the core message

🔧 CORRECT/FIX OPERATIONS (Keep content, fix issues):
- User wants to fix specific problems like grammar, clarity, or flow
- User wants to address issues without changing the overall content
- User wants to make corrections or improvements to existing text

📝 CONDENSE/SHORTEN OPERATIONS (Keep ideas, reduce length):
- User wants to make content shorter, more concise, or tighter
- User wants to reduce wordiness while keeping the same ideas
- User wants to streamline or simplify existing content

🎯 SPECIFIC OPERATIONS (Targeted changes):
- User wants to add specific elements like citations, examples, or evidence
- User wants to modify specific aspects like tone, style, or focus
- User wants to address particular concerns or requirements

**CONTENT ANALYSIS:**
1. **Template Detection**: Is the content mostly placeholder/template text?
   - Contains: "Begin your", "Detailed explanation", "Present your", "This is where"
   - Action: REPLACE entirely with substantive content

2. **Substantive Content**: Does it contain real research content?
   - Contains: Citations, specific findings, concrete information
   - Action: Work intelligently with existing content

3. **Content Quality**: Is it well-written or needs improvement?
   - Well-written: ADD/EXPAND/IMPROVE
   - Poor quality: REPLACE/IMPROVE

**INTELLIGENT INTEGRATION STRATEGIES:**

🔄 REPLACE STRATEGY:
- Completely rewrite the section
- Maintain academic tone and structure
- Address the user's specific request
- Remove all template/placeholder text

➕ ADD/EXPAND STRATEGY:
- **CRITICAL**: Keep ALL existing content exactly as it is - word for word
- **NEVER** replace, rewrite, or modify existing content
- **ALWAYS** start your response with the existing content exactly as written
- Add new information, details, examples AFTER the existing content
- Use smooth transitions: "Furthermore", "Additionally", "Moreover", "Building on this", "In addition", "Moreover"
- Maintain the existing flow and structure
- **MANDATORY FORMAT**: [EXISTING CONTENT EXACTLY AS IS] + [TRANSITION] + [NEW CONTENT]
- **EXAMPLE**: If existing content is "Technology helps healthcare." and user wants to expand, return: "Technology helps healthcare. Furthermore, recent studies show that AI-powered diagnostics improve accuracy by 25%."

✨ IMPROVE/ENHANCE STRATEGY:
- Keep the core ideas and structure
- Improve word choice, clarity, and flow
- Strengthen arguments and evidence
- Make it more compelling and professional

🔧 CORRECT/FIX STRATEGY:
- Keep the same content and ideas
- Fix grammar, spelling, clarity issues
- Improve sentence structure and flow
- Maintain the original meaning

📝 CONDENSE/SHORTEN STRATEGY:
- Keep all key ideas and information
- Remove redundancy and wordiness
- Use more precise language
- Maintain academic quality

**CRITICAL RULES:**
1. **NEVER** ask clarifying questions - work with what's provided
2. **NEVER** give generic responses like "I appreciate your request"
3. **ALWAYS** analyze the user's TRUE INTENT logically from their request
4. **ALWAYS** choose the right operation based on intent + content analysis
5. **ALWAYS** return ONLY the final integrated content
6. **ALWAYS** remove template instructions and placeholder text
7. **ALWAYS** create content that reads as if written by a human author
8. **THINK LOGICALLY**: What is the user really trying to achieve? What would be most helpful?

**OUTPUT REQUIREMENTS:**
- Return ONLY the final integrated content for this section
- No meta-commentary like "Here's a revised version..."
- No template instructions like "Begin your literature review below..."
- Clean, professional academic writing
- Proper paragraph structure and transitions
- Content that directly addresses the user's request

**EXAMPLES OF SMART BEHAVIOR:**

User: "Expand on the findings" + Existing: "The study found significant results."
→ "The study found significant results. Specifically, the analysis revealed a 23% improvement in patient outcomes, with particular success in early-stage interventions. These findings demonstrate the effectiveness of the proposed methodology and suggest promising applications in clinical practice."

User: "Add 20 more words" + Existing: "Ellenberg & Sun (2007) showcase technology's pivotal role in improving gastric cancer treatment outcomes through innovative approaches."
→ "Ellenberg & Sun (2007) showcase technology's pivotal role in improving gastric cancer treatment outcomes through innovative approaches. Furthermore, these technological advancements have demonstrated significant improvements in diagnostic accuracy and treatment efficiency, particularly in early-stage detection and personalized treatment protocols."

User: "Make this more concise" + Existing: "The research methodology was very comprehensive and thorough..."
→ "The comprehensive research methodology included..."

User: "Add more citations" + Existing: "Previous studies show..."
→ "Previous studies show (Smith, 2020; Johnson, 2021; Brown, 2022). Additionally, recent research by Wilson (2023) confirms..."

User: "Improve the flow" + Existing: "The results were good. The methodology was solid."
→ "The solid methodology produced promising results, demonstrating the effectiveness of the approach."

**CRITICAL REMINDER FOR ADD/EXPAND OPERATIONS:**
- **NEVER** start with "To enhance the existing content" or "Considering your request"
- **ALWAYS** start with the existing content exactly as written - word for word
- **THEN** add your new content with proper transitions
- **FORMAT**: [EXISTING CONTENT EXACTLY AS IS] + [TRANSITION] + [NEW CONTENT]
- **THINK**: What would a human writer naturally do? They would keep what's good and add to it.
- **REMEMBER**: The user wants to BUILD ON what exists, not replace it. Preserve their work and enhance it.
` : ''}

ROLE: Provide specific, actionable feedback with concrete examples. Reference exact text, show before/after improvements, identify logic gaps.

QUALITY: Reference specific content, give 3-5 actionable suggestions, show exact changes with rationale, make content research-quality and citation-ready.

AVOID AI-SOUNDING PHRASES:
- "delve", "explore", "uncover", "unveil", "shed light on"
- "Based on the information provided", "It seems like", "Looking at"
- "I understand", "I can help", "Here's", "Let me", "I'll"
- "That's a great question", "Great question", "Excellent question"
- "I hope this helps", "Let me know if", "Feel free to", "Don't hesitate to"
- "Here are some", "Here's what", "Here is", "The key", "The main", "The most"
- "Furthermore", "Moreover", "Additionally", "In addition"
- "It is important to note", "It should be noted", "It is worth noting"
- "In order to", "In order for", "With regard to", "In terms of"
- "Comprehensive", "extensive", "thorough", "detailed analysis"
- "Significant", "substantial", "considerable", "notable"
- "It is evident that", "It is clear that", "It is apparent that"
- "As mentioned", "As stated", "As previously mentioned"
- "In conclusion", "To summarize", "To conclude"
- "It is crucial", "It is essential", "It is vital", "It is imperative"
- "It is worth mentioning", "It is important to remember"
- "In my opinion", "I believe", "I feel", "I think that"
- "It appears that", "It seems that", "It looks like"
- "The fact that", "The reality is that", "The truth is that"

ALTERNATIVES: "delve into"→"examine" | "explore"→"investigate" | "uncover"→"find" | "Furthermore"→"Also" | "It is important to note"→"Note that" | "In order to"→"To" | "It is evident that"→"Clearly" | "In conclusion"→"Finally" | "It is crucial"→"It's important" | "Based on"→"From"

${projectContext ? `
CURRENT PROJECT CONTEXT:
${projectContext}

IMPORTANT: Analyze this specific content. Reference exact sentences, point out specific issues, and give targeted suggestions. Don't give generic advice - make every suggestion directly relevant to what they've written.

EXAMPLE OF GOOD VS BAD FEEDBACK:
❌ BAD: "Your introduction could be improved. Try to make it more engaging and add more context."
✅ GOOD: "Your opening sentence 'CKD is a problem' is too vague. Start with a concrete statistic: 'Chronic Kidney Disease affects 37 million Americans (10% of adults)—yet 90% remain undiagnosed until late stages (CDC, 2023).' This immediately establishes stakes and hooks the reader. Also, your second paragraph jumps to methodology without establishing the research gap. Add a sentence explaining what previous studies missed."

See the difference? Be specific, reference their text, show exact improvements.
` : 'GENERAL ASSISTANCE: Ask clarifying questions to understand their specific needs before giving advice.'}`;

    // Build messages with project context (no chat history for cost efficiency)
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: message }
    ];

    // Generate response
    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 800,
    });

    let response = completion.choices[0]?.message?.content || '';
    
    // Validate response quality first
    const validation = validateResponse(response, 'integrate');
    if (!validation.isValid) {
      console.warn('Integration response quality warning:', {
        isEmpty: validation.isEmpty,
        isTooShort: validation.isTooShort,
        hasClarificationRequest: validation.hasClarificationRequest,
      });
      
      // If response is invalid, use cleaned version or empty
      response = validation.cleanedResponse || response;
    }
    
    // Post-processing cleanup for integration mode
    if (insertionMode === 'integrate' && currentSectionContent) {
      // Remove unwanted section title prefixes
      const sectionTitlePrefix = `${sectionTitle}: `;
      if (response.startsWith(sectionTitlePrefix)) {
        response = response.substring(sectionTitlePrefix.length);
      }
      
      // Remove other common unwanted prefixes
      const unwantedPrefixes = [
        'Introduction: ',
        'Literature Review: ',
        'Methodology: ',
        'Findings: ',
        'Analysis: ',
        'Conclusion: ',
        'To enhance the existing content',
        'Considering your request',
        'Here\'s a revised version',
        'Here is a revised version'
      ];
      
      for (const prefix of unwantedPrefixes) {
        if (response.startsWith(prefix)) {
          response = response.substring(prefix.length);
          break;
        }
      }
      
      // Clean up any leading/trailing whitespace
      response = response.trim();
    }
    
    const wordCount = countWords(response);

    // Check if this is first output (before incrementing)
    const isFirstOutput = usageCheck.remaining === usageCheck.limit;

    // Track usage
    await incrementAIWords(user._id.toString(), wordCount);

    // Advanced integration detection
    const isActuallyIntegrated = insertionMode === 'integrate' && 
                                currentSectionContent && 
                                response.length > 30 && // Response should be substantial
                                !response.toLowerCase().includes('appreciate your request') && // Not a generic response
                                !response.toLowerCase().includes('could you please specify') && // Not asking for clarification
                                !response.toLowerCase().includes('which section') && // Not asking which section
                                !response.toLowerCase().includes('i understand') && // Not generic acknowledgment
                                !response.toLowerCase().includes('let me help') && // Not generic helper response
                                !response.toLowerCase().includes('here\'s a revised') && // Not meta-commentary
                                !response.toLowerCase().includes('here is a revised') && // Not meta-commentary
                                !response.toLowerCase().includes('i\'ve revised') && // Not meta-commentary
                                !response.toLowerCase().includes('i have revised') && // Not meta-commentary
                                !response.toLowerCase().includes('begin your') && // Not template text
                                !response.toLowerCase().includes('detailed explanation') && // Not template text
                                !response.toLowerCase().includes('present your'); // Not template text

    // Return tracking metadata for first output
    const { createTrackingMetadata } = await import('@/lib/gtag-server');
    const tracking = createTrackingMetadata(
      isFirstOutput,
      'first_output_generated',
      {
        user_id: user._id.toString(),
        output_type: 'assistant',
      }
    );

    return NextResponse.json({
      response,
      wordCount,
      model,
      remaining: usageCheck.remaining - wordCount,
      intent: 'integrate', // For integrate flow
      isIntegrated: isActuallyIntegrated,
      projectContext: project ? {
        name: project.name,
        type: project.type,
        progress: Math.round(((project.wordCount || 0) / project.targetWordCount) * 100)
      } : null,
      ...(tracking && { tracking }),
    });
  } catch (error) {
    console.error('Error in AI Assistant:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message === 'User not found') {
        return NextResponse.json({ error: 'User not found. Please try logging in again.' }, { status: 404 });
      }
      if (error.message.includes('word limit')) {
        return NextResponse.json({ error: 'Daily word limit reached. Please upgrade your plan.' }, { status: 429 });
      }
    }
    
    return NextResponse.json({ error: 'Failed to process request. Please try again.' }, { status: 500 });
  }
}
