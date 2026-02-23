// Scalable citation source generator
// This creates citation sources programmatically for maximum scale
// Optimized for lazy loading to reduce build-time memory usage

import { CitationSource } from './citation-sources';

// Source types that work across all/most styles - focused on genuinely useful citation types
const commonSourceTypes = [
  // Core academic and publication types
  'book',
  'website',
  'journal',
  'video',
  'podcast',
  'conference-paper',
  'dissertation',
  'newspaper',
  'magazine',
  'report',
  'blog-post',
  'online-article',
  'encyclopedia',
  'dictionary',
  'interview',
  'lecture',
  'presentation',
  'image',
  'artwork',
  'email',
  'personal-communication',
  'patent',
  'standard',
  'dataset',
  'software',
  'mobile-app',
  'social-media-post',
  'forum-post',
  'wiki',
  'government-document',
  'thesis',
  'chapter',
  'edited-book',
  'ebook',
  'audiobook',
  'film',
  'tv-show',
  'radio',
  'song',
  'album',
  'map',
  'chart',
  'graph',
  'table',
  'infographic',
  'webinar',
  'online-course',
  'tweet',
  'youtube-video',
  'ted-talk',
  'press-release',
  'newsletter',
  'manuscript',
  'archive',
  'museum-exhibit',
  'performance',
  'transcript',
  // Legal and government
  'court-case',
  'legal-document',
  'statute',
  'regulation',
  'treaty',
  'government-report',
  'congressional-report',
  'policy-document',
  'executive-order',
  'judicial-opinion',
  'amicus-brief',
  // Scientific and research
  'preprint',
  'working-paper',
  'technical-report',
  'white-paper',
  'policy-brief',
  'annual-report',
  'clinical-trial',
  'systematic-review',
  'meta-analysis',
  'conference-proceedings',
  'poster-presentation',
  'abstract',
  'editorial',
  'letter-to-editor',
  // Books and reference works
  'textbook',
  'monograph',
  'handbook',
  'reference-book',
  // Biographical and historical
  'autobiography',
  'biography',
  'memoir',
  'oral-history',
  'historical-document',
  'primary-source',
  'archival-document',
  'diary-entry',
  // Digital and data sources
  'github-repository',
  'dataset-repository',
  'arxiv-paper',
  'pubmed-article',
  'open-access-journal',
  'peer-reviewed-journal',
  'data-visualization',
  'photograph',
  'illustration',
  'diagram',
  'timeline',
];

// Citation styles - expanded for maximum coverage
const allCitationStyles = [
  'apa', 
  'mla', 
  'chicago', 
  'ieee', 
  'harvard', 
  'vancouver', 
  'acs', 
  'ama',
  'turabian',
  'cse',
  'oscola',
  'bluebook',
  'mhra',
  'nlm',
  'apsa',
  'asa',
  'aaa',
  'aglc',
];

// Template function to generate citation source
function generateCitationSource(
  sourceType: string,
  citationStyle: string,
  templates: Record<string, Record<string, any>>
): CitationSource | null {
  const styleTemplates = templates[citationStyle];
  const sourceTemplate = styleTemplates?.[sourceType];

  // If no specific template exists, create a default one based on style patterns
  const sourceTypeName = sourceType
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const styleName = citationStyle.toUpperCase();

  // Generate default format based on style
  let defaultFormat = '';
  let defaultExample = '';
  
  if (!sourceTemplate) {
    // Create default templates for styles without explicit templates
    if (citationStyle === 'turabian' || citationStyle === 'mhra') {
      defaultFormat = `Author, First Name. "${sourceTypeName} Title." Source Name. Year.`;
      defaultExample = `Smith, John A. "${sourceTypeName} Example." Academic Source. 2023.`;
    } else if (citationStyle === 'cse' || citationStyle === 'nlm') {
      defaultFormat = `Author AA. Year. ${sourceTypeName} title. Source Name.`;
      defaultExample = `Smith JA. 2023. ${sourceTypeName} example. Academic Source.`;
    } else if (citationStyle === 'oscola' || citationStyle === 'aglc') {
      defaultFormat = `Author, "${sourceTypeName} Title" (Source Name, Year) Page.`;
      defaultExample = `Smith, "${sourceTypeName} Example" (Academic Source, 2023) 45.`;
    } else if (citationStyle === 'bluebook') {
      defaultFormat = `AUTHOR, ${sourceTypeName.toUpperCase()} TITLE Page (Publisher Year).`;
      defaultExample = `SMITH, ${sourceTypeName.toUpperCase()} EXAMPLE 45 (Academic Press 2023).`;
    } else if (citationStyle === 'apa' || citationStyle === 'harvard') {
      defaultFormat = `Author, A. A. (Year). ${sourceTypeName} title. Source Name.`;
      defaultExample = `Smith, J. A. (2023). ${sourceTypeName} example. Academic Source.`;
    } else if (citationStyle === 'mla') {
      defaultFormat = `Author Last, First. "${sourceTypeName} Title." Source Name, Year.`;
      defaultExample = `Smith, John. "${sourceTypeName} Example." Academic Source, 2023.`;
    } else if (citationStyle === 'chicago') {
      defaultFormat = `Author Last, First. "${sourceTypeName} Title." Source Name (Year).`;
      defaultExample = `Smith, John. "${sourceTypeName} Example." Academic Source (2023).`;
    } else if (citationStyle === 'ieee') {
      defaultFormat = `[1] A. A. Author, "${sourceTypeName} title," Source Name, Year.`;
      defaultExample = `[1] J. A. Smith, "${sourceTypeName} example," Academic Source, 2023.`;
    } else if (citationStyle === 'vancouver' || citationStyle === 'ama' || citationStyle === 'acs') {
      defaultFormat = `Author AA. ${sourceTypeName} title. Source Name. Year.`;
      defaultExample = `Smith JA. ${sourceTypeName} example. Academic Source. 2023.`;
    } else {
      // Fallback author-date format
      defaultFormat = `Author, First Name. Year. "${sourceTypeName} Title." Source Name.`;
      defaultExample = `Smith, John A. 2023. "${sourceTypeName} Example." Academic Source.`;
    }
  }

  return {
    sourceType,
    citationStyle,
    title: `How to Cite a ${sourceTypeName} in ${styleName}: Format and Examples`,
    description: sourceTemplate?.description || `Complete guide to citing ${sourceTypeName.toLowerCase()}s in ${styleName} format. Includes examples and formatting rules.`,
    keywords: [
      `how to cite ${sourceType} in ${citationStyle}`,
      `${styleName} ${sourceType} citation`,
      `cite ${sourceType} ${citationStyle} format`,
      `${styleName} ${sourceType} format`,
      `${sourceType} citation ${citationStyle} example`,
    ],
    format: sourceTemplate?.format || defaultFormat || 'Format template',
    example: sourceTemplate?.example || defaultExample || 'Example citation',
    notes: sourceTemplate?.notes || [
      'Follow the standard formatting guidelines',
      'Include all required elements',
      'Check for style-specific requirements',
    ],
  };
}

// Citation templates by style and source type
const citationTemplates: Record<string, Record<string, any>> = {
  apa: {
    encyclopedia: {
      description: 'Complete guide to citing encyclopedia entries in APA 7th edition format.',
      format: 'Author, A. A. (Year). Entry title. In Editor, A. A. (Ed.), Encyclopedia Name (Vol. Volume, pp. Pages). Publisher.',
      example: 'Smith, J. A. (2023). Academic Writing. In Davis, R. M. (Ed.), Encyclopedia of Research Methods (Vol. 2, pp. 45-60). Academic Press.',
      notes: ['Include editor name', 'Specify volume number', 'Include page numbers', 'For online, add URL'],
    },
    dictionary: {
      description: 'Learn how to cite dictionary entries in APA 7th edition format.',
      format: 'Author, A. A. (Year). Entry word. In Editor, A. A. (Ed.), Dictionary Name. Publisher. URL',
      example: 'Smith, J. A. (2023). Research. In Davis, R. M. (Ed.), Academic Dictionary. Academic Press. https://example.com',
      notes: ['Include editor if available', 'For online dictionaries, add URL', 'If no author, start with entry word'],
    },
    interview: {
      description: 'Complete guide to citing interviews in APA 7th edition format.',
      format: 'Interviewee, A. A. (Year, Month Day). Personal interview.',
      example: 'Smith, J. A. (2024, January 15). Personal interview.',
      notes: ['Use "Personal interview" for unpublished interviews', 'Include the interview date', 'Do not include in reference list if unpublished'],
    },
    lecture: {
      description: 'Learn how to cite lectures in APA 7th edition format.',
      format: 'Lecturer, A. A. (Year, Month Day). Lecture title [Lecture notes]. Course Name, Institution. URL',
      example: 'Smith, J. A. (2024, January 15). Introduction to Research Methods [Lecture notes]. Research Methods 101, University of Example. https://example.com',
      notes: ['Include course name and institution', 'Specify [Lecture notes]', 'Add URL if available online'],
    },
    presentation: {
      description: 'Complete guide to citing presentations in APA 7th edition format.',
      format: 'Presenter, A. A. (Year, Month). Presentation title [Presentation]. Conference Name, Location. URL',
      example: 'Smith, J. A. (2024, January). New Research Methods [Presentation]. Academic Conference, New York. https://example.com',
      notes: ['Include conference name and location', 'Specify [Presentation]', 'Add URL if available'],
    },
    image: {
      description: 'Learn how to cite images in APA 7th edition format.',
      format: 'Artist, A. A. (Year). Image title [Image]. Source. URL',
      example: 'Smith, J. A. (2024). Research Diagram [Image]. Academic Journal. https://example.com/image',
      notes: ['Include artist or creator', 'Specify [Image] or [Photograph]', 'Include source and URL'],
    },
    artwork: {
      description: 'Complete guide to citing artwork in APA 7th edition format.',
      format: 'Artist, A. A. (Year). Artwork title [Medium]. Museum or Collection, Location.',
      example: 'Smith, J. A. (2023). Research Visualization [Digital Art]. Academic Museum, New York.',
      notes: ['Include artist name', 'Specify the medium', 'Include museum or collection location'],
    },
    email: {
      description: 'Learn how to cite emails in APA 7th edition format.',
      format: 'Sender, A. A. (Year, Month Day). Subject line [Email].',
      example: 'Smith, J. A. (2024, January 15). Research Discussion [Email].',
      notes: ['Use "Personal communication" for emails', 'Do not include in reference list', 'Cite only in text'],
    },
    'personal-communication': {
      description: 'Complete guide to citing personal communications in APA 7th edition format.',
      format: '(A. A. Sender, personal communication, Month Day, Year)',
      example: '(J. A. Smith, personal communication, January 15, 2024)',
      notes: ['Cite only in text, not in reference list', 'Include the date', 'Use for emails, conversations, etc.'],
    },
    patent: {
      description: 'Learn how to cite patents in APA 7th edition format.',
      format: 'Inventor, A. A. (Year). Patent title (Patent No. Number). Patent Office.',
      example: 'Smith, J. A. (2023). Research Method Device (Patent No. US123456). U.S. Patent and Trademark Office.',
      notes: ['Include patent number', 'Specify the patent office', 'Include the issue date'],
    },
    standard: {
      description: 'Complete guide to citing standards in APA 7th edition format.',
      format: 'Organization. (Year). Standard title (Standard No. Number). Publisher.',
      example: 'American Standards Institute. (2023). Research Methods Standard (Standard No. ANSI-2023). Academic Press.',
      notes: ['Include organization name', 'Specify standard number', 'Include publisher'],
    },
    dataset: {
      description: 'Learn how to cite datasets in APA 7th edition format.',
      format: 'Author, A. A. (Year). Dataset title [Data set]. Publisher. https://doi.org/xx.xxx/yyyy',
      example: 'Smith, J. A. (2023). Research Data Collection [Data set]. Academic Database. https://doi.org/10.1234/data',
      notes: ['Specify [Data set]', 'Include DOI if available', 'Include publisher or repository'],
    },
    software: {
      description: 'Complete guide to citing software in APA 7th edition format.',
      format: 'Author, A. A. (Year). Software name (Version) [Computer software]. Publisher. URL',
      example: 'Smith, J. A. (2023). Research Tool (Version 2.0) [Computer software]. Academic Software. https://example.com',
      notes: ['Include version number', 'Specify [Computer software]', 'Add URL if available'],
    },
    'mobile-app': {
      description: 'Learn how to cite mobile apps in APA 7th edition format.',
      format: 'Developer, A. A. (Year). App name (Version) [Mobile app]. App Store. URL',
      example: 'Smith, J. A. (2023). Research Assistant (Version 1.5) [Mobile app]. App Store. https://apps.apple.com/example',
      notes: ['Include version number', 'Specify [Mobile app]', 'Include app store and URL'],
    },
    'social-media-post': {
      description: 'Complete guide to citing social media posts in APA 7th edition format.',
      format: 'Author, A. A. [@username]. (Year, Month Day). First 20 words of post [Post type]. Platform. URL',
      example: 'Smith, J. A. [@researchmethods]. (2024, January 15). New study findings [Tweet]. Twitter. https://twitter.com/example',
      notes: ['Include first 20 words', 'Specify post type', 'Include platform and URL'],
    },
    'forum-post': {
      description: 'Learn how to cite forum posts in APA 7th edition format.',
      format: 'Author, A. A. (Year, Month Day). Post title [Forum post]. Forum Name. URL',
      example: 'Smith, J. A. (2024, January 15). Research Question [Forum post]. Academic Forum. https://forum.example.com',
      notes: ['Include forum name', 'Specify [Forum post]', 'Add URL'],
    },
    wiki: {
      description: 'Complete guide to citing Wikipedia and other wikis in APA 7th edition format.',
      format: 'Article title. (Year, Month Day). In Wiki Name. URL',
      example: 'Academic Writing. (2024, January 15). In Wikipedia. https://en.wikipedia.org/wiki/Academic_writing',
      notes: ['Start with article title', 'Include wiki name', 'Add URL and access date'],
    },
    'government-document': {
      description: 'Learn how to cite government documents in APA 7th edition format.',
      format: 'Agency Name. (Year). Document title (Publication No. Number). Publisher. URL',
      example: 'U.S. Department of Education. (2023). Research Guidelines (Pub. No. ED-2023-001). Government Printing Office. https://example.com',
      notes: ['Include agency name', 'Specify publication number', 'Include publisher and URL'],
    },
  },
  // MLA templates
  mla: {
    encyclopedia: {
      description: 'Complete guide to citing encyclopedia entries in MLA 9th edition format.',
      format: 'Author, First Name. "Entry Title." Encyclopedia Name, edited by Editor Name, Publisher, Year, pp. Pages.',
      example: 'Smith, John. "Academic Writing." Encyclopedia of Research Methods, edited by Robert Davis, Academic Press, 2023, pp. 45-60.',
      notes: ['Include editor name', 'Specify volume if applicable', 'Include page numbers', 'For online, add URL'],
    },
    dictionary: {
      description: 'Learn how to cite dictionary entries in MLA 9th edition format.',
      format: '"Entry Word." Dictionary Name, edited by Editor Name, Publisher, Year.',
      example: '"Research." Academic Dictionary, edited by Robert Davis, Academic Press, 2023.',
      notes: ['Start with entry word in quotation marks', 'Include editor if available', 'For online, add URL'],
    },
    interview: {
      description: 'Complete guide to citing interviews in MLA 9th edition format.',
      format: 'Interviewee, First Name. Personal interview. Day Month Year.',
      example: 'Smith, John. Personal interview. 15 Jan. 2024.',
      notes: ['Use "Personal interview" for unpublished interviews', 'Include the interview date', 'Format date as Day Month Year'],
    },
    lecture: {
      description: 'Learn how to cite lectures in MLA 9th edition format.',
      format: 'Lecturer, First Name. "Lecture Title." Course Name, Institution, Day Month Year, Lecture.',
      example: 'Smith, John. "Introduction to Research Methods." Research Methods 101, University of Example, 15 Jan. 2024, Lecture.',
      notes: ['Include course name and institution', 'Specify "Lecture"', 'Add URL if available online'],
    },
    presentation: {
      description: 'Complete guide to citing presentations in MLA 9th edition format.',
      format: 'Presenter, First Name. "Presentation Title." Conference Name, Location, Day Month Year, Presentation.',
      example: 'Smith, John. "New Research Methods." Academic Conference, New York, 15 Jan. 2024, Presentation.',
      notes: ['Include conference name and location', 'Specify "Presentation"', 'Add URL if available'],
    },
    image: {
      description: 'Learn how to cite images in MLA 9th edition format.',
      format: 'Artist, First Name. Image Title. Year, Source, URL.',
      example: 'Smith, John. Research Diagram. 2024, Academic Journal, www.example.com/image.',
      notes: ['Include artist or creator', 'Include source', 'Add URL if accessed online'],
    },
    artwork: {
      description: 'Complete guide to citing artwork in MLA 9th edition format.',
      format: 'Artist, First Name. Artwork Title. Year, Medium, Museum or Collection, Location.',
      example: 'Smith, John. Research Visualization. 2023, Digital Art, Academic Museum, New York.',
      notes: ['Include artist name', 'Specify the medium', 'Include museum or collection location'],
    },
    email: {
      description: 'Learn how to cite emails in MLA 9th edition format.',
      format: 'Sender, First Name. "Subject Line." Received by Recipient Name, Day Month Year.',
      example: 'Smith, John. "Research Discussion." Received by Jane Doe, 15 Jan. 2024.',
      notes: ['Include subject line in quotation marks', 'Specify recipient', 'Include date'],
    },
    'personal-communication': {
      description: 'Complete guide to citing personal communications in MLA 9th edition format.',
      format: 'Sender, First Name. Personal communication. Day Month Year.',
      example: 'Smith, John. Personal communication. 15 Jan. 2024.',
      notes: ['Use "Personal communication"', 'Include the date', 'Format as Day Month Year'],
    },
    patent: {
      description: 'Learn how to cite patents in MLA 9th edition format.',
      format: 'Inventor, First Name. Patent Title. Patent No. Number, Day Month Year.',
      example: 'Smith, John. Research Method Device. Patent No. US123456, 15 Jan. 2023.',
      notes: ['Include patent number', 'Include the issue date', 'Format date properly'],
    },
    standard: {
      description: 'Complete guide to citing standards in MLA 9th edition format.',
      format: 'Organization. Standard Title. Standard No. Number, Publisher, Year.',
      example: 'American Standards Institute. Research Methods Standard. Standard No. ANSI-2023, Academic Press, 2023.',
      notes: ['Include organization name', 'Specify standard number', 'Include publisher and year'],
    },
    dataset: {
      description: 'Learn how to cite datasets in MLA 9th edition format.',
      format: 'Author, First Name. Dataset Title. Publisher, Year, URL.',
      example: 'Smith, John. Research Data Collection. Academic Database, 2023, www.example.com/data.',
      notes: ['Include publisher', 'Include year', 'Add URL'],
    },
    software: {
      description: 'Complete guide to citing software in MLA 9th edition format.',
      format: 'Author, First Name. Software Name. Version, Publisher, Year, URL.',
      example: 'Smith, John. Research Tool. Version 2.0, Academic Software, 2023, www.example.com.',
      notes: ['Include version number', 'Include publisher', 'Add URL if available'],
    },
    'mobile-app': {
      description: 'Learn how to cite mobile apps in MLA 9th edition format.',
      format: 'Developer, First Name. App Name. Version, App Store, Year, URL.',
      example: 'Smith, John. Research Assistant. Version 1.5, App Store, 2023, apps.apple.com/example.',
      notes: ['Include version number', 'Include app store', 'Add URL'],
    },
    'social-media-post': {
      description: 'Complete guide to citing social media posts in MLA 9th edition format.',
      format: 'Author, First Name [@username]. "First portion of post." Platform, Day Month Year, Time, URL.',
      example: 'Smith, John [@researchmethods]. "New study findings." Twitter, 15 Jan. 2024, 10:30 a.m., twitter.com/example.',
      notes: ['Include username in brackets', 'Use first portion of post', 'Include platform, date, and URL'],
    },
    'forum-post': {
      description: 'Learn how to cite forum posts in MLA 9th edition format.',
      format: 'Author, First Name. "Post Title." Forum Name, Day Month Year, URL.',
      example: 'Smith, John. "Research Question." Academic Forum, 15 Jan. 2024, www.forum.example.com.',
      notes: ['Include forum name', 'Include date', 'Add URL'],
    },
    wiki: {
      description: 'Complete guide to citing Wikipedia and other wikis in MLA 9th edition format.',
      format: '"Article Title." Wiki Name, Day Month Year, URL.',
      example: '"Academic Writing." Wikipedia, 15 Jan. 2024, en.wikipedia.org/wiki/Academic_writing.',
      notes: ['Start with article title in quotation marks', 'Include wiki name', 'Add URL and access date'],
    },
    'government-document': {
      description: 'Learn how to cite government documents in MLA 9th edition format.',
      format: 'Agency Name. Document Title. Publication No. Number, Publisher, Year, URL.',
      example: 'U.S. Department of Education. Research Guidelines. Pub. No. ED-2023-001, Government Printing Office, 2023, www.example.com.',
      notes: ['Include agency name', 'Specify publication number', 'Include publisher, year, and URL'],
    },
  },
  // Chicago templates
  chicago: {
    encyclopedia: {
      description: 'Complete guide to citing encyclopedia entries in Chicago 17th edition format.',
      format: 'Author, First Name. "Entry Title." In Encyclopedia Name, edited by Editor Name, volume:pages. Place: Publisher, Year.',
      example: 'Smith, John. "Academic Writing." In Encyclopedia of Research Methods, edited by Robert Davis, 2:45-60. New York: Academic Press, 2023.',
      notes: ['Include editor name', 'Specify volume and pages', 'Include place and publisher'],
    },
    dictionary: {
      description: 'Learn how to cite dictionary entries in Chicago 17th edition format.',
      format: '"Entry Word." In Dictionary Name, edited by Editor Name. Place: Publisher, Year.',
      example: '"Research." In Academic Dictionary, edited by Robert Davis. New York: Academic Press, 2023.',
      notes: ['Start with entry word in quotation marks', 'Include editor if available', 'Include place and publisher'],
    },
    interview: {
      description: 'Complete guide to citing interviews in Chicago 17th edition format.',
      format: 'Interviewee, First Name. Interview by Interviewer Name. Place, Month Day, Year.',
      example: 'Smith, John. Interview by Jane Doe. New York, January 15, 2024.',
      notes: ['Include interviewer name', 'Include location and date', 'Format date as Month Day, Year'],
    },
    lecture: {
      description: 'Learn how to cite lectures in Chicago 17th edition format.',
      format: 'Lecturer, First Name. "Lecture Title." Course Name, Institution, Month Day, Year.',
      example: 'Smith, John. "Introduction to Research Methods." Research Methods 101, University of Example, January 15, 2024.',
      notes: ['Include course name and institution', 'Include full date', 'Add URL if available online'],
    },
    presentation: {
      description: 'Complete guide to citing presentations in Chicago 17th edition format.',
      format: 'Presenter, First Name. "Presentation Title." Conference Name, Location, Month Day, Year.',
      example: 'Smith, John. "New Research Methods." Academic Conference, New York, January 15, 2024.',
      notes: ['Include conference name and location', 'Include full date', 'Add URL if available'],
    },
    image: {
      description: 'Learn how to cite images in Chicago 17th edition format.',
      format: 'Artist, First Name. Image Title. Year. Source, URL.',
      example: 'Smith, John. Research Diagram. 2024. Academic Journal, www.example.com/image.',
      notes: ['Include artist or creator', 'Include source', 'Add URL if accessed online'],
    },
    artwork: {
      description: 'Complete guide to citing artwork in Chicago 17th edition format.',
      format: 'Artist, First Name. Artwork Title. Year. Medium, Museum or Collection, Location.',
      example: 'Smith, John. Research Visualization. 2023. Digital Art, Academic Museum, New York.',
      notes: ['Include artist name', 'Specify the medium', 'Include museum or collection location'],
    },
    email: {
      description: 'Learn how to cite emails in Chicago 17th edition format.',
      format: 'Sender, First Name, email message to Recipient Name, Month Day, Year.',
      example: 'Smith, John, email message to Jane Doe, January 15, 2024.',
      notes: ['Specify "email message"', 'Include recipient', 'Include date'],
    },
    'personal-communication': {
      description: 'Complete guide to citing personal communications in Chicago 17th edition format.',
      format: 'Sender, First Name, personal communication with Recipient Name, Month Day, Year.',
      example: 'Smith, John, personal communication with Jane Doe, January 15, 2024.',
      notes: ['Specify "personal communication"', 'Include recipient', 'Include date'],
    },
    patent: {
      description: 'Learn how to cite patents in Chicago 17th edition format.',
      format: 'Inventor, First Name. Patent Title. U.S. Patent Number, issued Month Day, Year.',
      example: 'Smith, John. Research Method Device. U.S. Patent 123456, issued January 15, 2023.',
      notes: ['Include patent number', 'Specify issue date', 'Format as "issued Month Day, Year"'],
    },
    standard: {
      description: 'Complete guide to citing standards in Chicago 17th edition format.',
      format: 'Organization. Standard Title. Standard No. Number. Place: Publisher, Year.',
      example: 'American Standards Institute. Research Methods Standard. Standard No. ANSI-2023. New York: Academic Press, 2023.',
      notes: ['Include organization name', 'Specify standard number', 'Include place, publisher, and year'],
    },
    dataset: {
      description: 'Learn how to cite datasets in Chicago 17th edition format.',
      format: 'Author, First Name. Dataset Title. Publisher, Year. URL.',
      example: 'Smith, John. Research Data Collection. Academic Database, 2023. www.example.com/data.',
      notes: ['Include publisher', 'Include year', 'Add URL'],
    },
    software: {
      description: 'Complete guide to citing software in Chicago 17th edition format.',
      format: 'Author, First Name. Software Name, version Version. Place: Publisher, Year. URL.',
      example: 'Smith, John. Research Tool, version 2.0. New York: Academic Software, 2023. www.example.com.',
      notes: ['Include version number', 'Include place and publisher', 'Add URL if available'],
    },
    'mobile-app': {
      description: 'Learn how to cite mobile apps in Chicago 17th edition format.',
      format: 'Developer, First Name. App Name, version Version. App Store, Year. URL.',
      example: 'Smith, John. Research Assistant, version 1.5. App Store, 2023. apps.apple.com/example.',
      notes: ['Include version number', 'Include app store', 'Add URL'],
    },
    'social-media-post': {
      description: 'Complete guide to citing social media posts in Chicago 17th edition format.',
      format: 'Author, First Name [@username]. "First portion of post." Platform, Month Day, Year, URL.',
      example: 'Smith, John [@researchmethods]. "New study findings." Twitter, January 15, 2024, twitter.com/example.',
      notes: ['Include username in brackets', 'Use first portion of post', 'Include platform, date, and URL'],
    },
    'forum-post': {
      description: 'Learn how to cite forum posts in Chicago 17th edition format.',
      format: 'Author, First Name. "Post Title." Forum Name, Month Day, Year, URL.',
      example: 'Smith, John. "Research Question." Academic Forum, January 15, 2024, www.forum.example.com.',
      notes: ['Include forum name', 'Include date', 'Add URL'],
    },
    wiki: {
      description: 'Complete guide to citing Wikipedia and other wikis in Chicago 17th edition format.',
      format: '"Article Title." Wiki Name. Last modified Month Day, Year. URL.',
      example: '"Academic Writing." Wikipedia. Last modified January 15, 2024. en.wikipedia.org/wiki/Academic_writing.',
      notes: ['Start with article title in quotation marks', 'Include "Last modified" date', 'Add URL'],
    },
    'government-document': {
      description: 'Learn how to cite government documents in Chicago 17th edition format.',
      format: 'Agency Name. Document Title. Publication No. Number. Place: Publisher, Year. URL.',
      example: 'U.S. Department of Education. Research Guidelines. Pub. No. ED-2023-001. Washington, DC: Government Printing Office, 2023. www.example.com.',
      notes: ['Include agency name', 'Specify publication number', 'Include place, publisher, year, and URL'],
    },
  },
  // IEEE templates (engineering-focused)
  ieee: {
    encyclopedia: {
      description: 'Complete guide to citing encyclopedia entries in IEEE format.',
      format: '[1] A. Author, "Entry Title," in Encyclopedia Name, Editor Name, Ed. Place: Publisher, Year, vol. Volume, pp. Pages.',
      example: '[1] J. A. Smith, "Academic Writing," in Encyclopedia of Research Methods, R. M. Davis, Ed. New York: Academic Press, 2023, vol. 2, pp. 45-60.',
      notes: ['Use numbered citations', 'Include editor', 'Specify volume and pages'],
    },
    dictionary: {
      description: 'Learn how to cite dictionary entries in IEEE format.',
      format: '[1] A. Author, "Entry Word," in Dictionary Name, Editor Name, Ed. Place: Publisher, Year.',
      example: '[1] J. A. Smith, "Research," in Academic Dictionary, R. M. Davis, Ed. New York: Academic Press, 2023.',
      notes: ['Use numbered citations', 'Include editor if available', 'Include place and publisher'],
    },
    interview: {
      description: 'Complete guide to citing interviews in IEEE format.',
      format: '[1] A. Author, personal interview, Month Day, Year.',
      example: '[1] J. A. Smith, personal interview, Jan. 15, 2024.',
      notes: ['Use numbered citations', 'Specify "personal interview"', 'Include date'],
    },
    lecture: {
      description: 'Learn how to cite lectures in IEEE format.',
      format: '[1] A. Author, "Lecture Title," Course Name, Institution, Place, Month Day, Year.',
      example: '[1] J. A. Smith, "Introduction to Research Methods," Research Methods 101, University of Example, New York, USA, Jan. 15, 2024.',
      notes: ['Use numbered citations', 'Include course, institution, location', 'Include date'],
    },
    presentation: {
      description: 'Complete guide to citing presentations in IEEE format.',
      format: '[1] A. Author, "Presentation Title," presented at Conf. Name, Place, Month Day, Year.',
      example: '[1] J. A. Smith, "New Research Methods," presented at Academic Conf., New York, USA, Jan. 15, 2024.',
      notes: ['Use numbered citations', 'Specify "presented at"', 'Include location and date'],
    },
    image: {
      description: 'Learn how to cite images in IEEE format.',
      format: '[1] A. Author, "Image Title," Source, Year.',
      example: '[1] J. A. Smith, "Research Diagram," Academic Journal, 2024.',
      notes: ['Use numbered citations', 'Include source', 'Include year'],
    },
    artwork: {
      description: 'Complete guide to citing artwork in IEEE format.',
      format: '[1] A. Author, "Artwork Title," Medium, Museum or Collection, Place, Year.',
      example: '[1] J. A. Smith, "Research Visualization," Digital Art, Academic Museum, New York, USA, 2023.',
      notes: ['Use numbered citations', 'Specify medium', 'Include museum and location'],
    },
    email: {
      description: 'Learn how to cite emails in IEEE format.',
      format: '[1] A. Author, "Subject Line," email message, Month Day, Year.',
      example: '[1] J. A. Smith, "Research Discussion," email message, Jan. 15, 2024.',
      notes: ['Use numbered citations', 'Specify "email message"', 'Include date'],
    },
    'personal-communication': {
      description: 'Complete guide to citing personal communications in IEEE format.',
      format: '[1] A. Author, personal communication, Month Day, Year.',
      example: '[1] J. A. Smith, personal communication, Jan. 15, 2024.',
      notes: ['Use numbered citations', 'Specify "personal communication"', 'Include date'],
    },
    patent: {
      description: 'Learn how to cite patents in IEEE format.',
      format: '[1] A. Author, "Patent Title," U.S. Patent Number, Month Day, Year.',
      example: '[1] J. A. Smith, "Research Method Device," U.S. Patent 123456, Jan. 15, 2023.',
      notes: ['Use numbered citations', 'Include patent number', 'Include issue date'],
    },
    standard: {
      description: 'Complete guide to citing standards in IEEE format.',
      format: '[1] Organization, "Standard Title," Standard No. Number, Year.',
      example: '[1] American Standards Institute, "Research Methods Standard," Standard No. ANSI-2023, 2023.',
      notes: ['Use numbered citations', 'Include organization', 'Specify standard number and year'],
    },
    dataset: {
      description: 'Learn how to cite datasets in IEEE format.',
      format: '[1] A. Author, "Dataset Title," Publisher, Year. [Online]. Available: URL.',
      example: '[1] J. A. Smith, "Research Data Collection," Academic Database, 2023. [Online]. Available: www.example.com/data.',
      notes: ['Use numbered citations', 'Specify [Online]', 'Include URL'],
    },
    software: {
      description: 'Complete guide to citing software in IEEE format.',
      format: '[1] A. Author, Software Name, version Version, Publisher, Year. [Online]. Available: URL.',
      example: '[1] J. A. Smith, Research Tool, version 2.0, Academic Software, 2023. [Online]. Available: www.example.com.',
      notes: ['Use numbered citations', 'Include version', 'Specify [Online] and URL'],
    },
    'mobile-app': {
      description: 'Learn how to cite mobile apps in IEEE format.',
      format: '[1] A. Author, App Name, version Version, App Store, Year. [Online]. Available: URL.',
      example: '[1] J. A. Smith, Research Assistant, version 1.5, App Store, 2023. [Online]. Available: apps.apple.com/example.',
      notes: ['Use numbered citations', 'Include version', 'Specify [Online] and URL'],
    },
    'social-media-post': {
      description: 'Complete guide to citing social media posts in IEEE format.',
      format: '[1] A. Author [@username], "First portion of post," Platform, Month Day, Year. [Online]. Available: URL.',
      example: '[1] J. A. Smith [@researchmethods], "New study findings," Twitter, Jan. 15, 2024. [Online]. Available: twitter.com/example.',
      notes: ['Use numbered citations', 'Include username', 'Specify [Online] and URL'],
    },
    'forum-post': {
      description: 'Learn how to cite forum posts in IEEE format.',
      format: '[1] A. Author, "Post Title," Forum Name, Month Day, Year. [Online]. Available: URL.',
      example: '[1] J. A. Smith, "Research Question," Academic Forum, Jan. 15, 2024. [Online]. Available: www.forum.example.com.',
      notes: ['Use numbered citations', 'Include forum name', 'Specify [Online] and URL'],
    },
    wiki: {
      description: 'Complete guide to citing Wikipedia and other wikis in IEEE format.',
      format: '[1] "Article Title," Wiki Name, Month Day, Year. [Online]. Available: URL.',
      example: '[1] "Academic Writing," Wikipedia, Jan. 15, 2024. [Online]. Available: en.wikipedia.org/wiki/Academic_writing.',
      notes: ['Use numbered citations', 'Start with article title', 'Specify [Online] and URL'],
    },
    'government-document': {
      description: 'Learn how to cite government documents in IEEE format.',
      format: '[1] Agency Name, "Document Title," Publication No. Number, Publisher, Place, Year. [Online]. Available: URL.',
      example: '[1] U.S. Department of Education, "Research Guidelines," Pub. No. ED-2023-001, Government Printing Office, Washington, DC, USA, 2023. [Online]. Available: www.example.com.',
      notes: ['Use numbered citations', 'Include agency and publication number', 'Specify [Online] and URL'],
    },
  },
  // Harvard templates
  harvard: {
    encyclopedia: {
      description: 'Complete guide to citing encyclopedia entries in Harvard style.',
      format: 'Author, A.A. Year, "Entry Title", in Editor Name (ed.), Encyclopedia Name, Publisher, Place, vol. Volume, pp. Pages.',
      example: 'Smith, J.A. 2023, "Academic Writing", in Davis, R.M. (ed.), Encyclopedia of Research Methods, Academic Press, New York, vol. 2, pp. 45-60.',
      notes: ['Include editor name', 'Specify volume and pages', 'Include publisher and place'],
    },
    dictionary: {
      description: 'Learn how to cite dictionary entries in Harvard style.',
      format: '"Entry Word" Year, Dictionary Name, Publisher, Place.',
      example: '"Research" 2023, Academic Dictionary, Academic Press, New York.',
      notes: ['Start with entry word in quotation marks', 'Include publisher and place', 'For online, add [Online] and URL'],
    },
    interview: {
      description: 'Complete guide to citing interviews in Harvard style.',
      format: 'Interviewee, A.A. Year, personal interview, Day Month Year.',
      example: 'Smith, J.A. 2024, personal interview, 15 January 2024.',
      notes: ['Use "personal interview"', 'Include full date', 'Format as Day Month Year'],
    },
    lecture: {
      description: 'Learn how to cite lectures in Harvard style.',
      format: 'Lecturer, A.A. Year, "Lecture Title", Course Name, Institution, Place, Day Month Year, lecture.',
      example: 'Smith, J.A. 2024, "Introduction to Research Methods", Research Methods 101, University of Example, New York, 15 January 2024, lecture.',
      notes: ['Include course, institution, location', 'Specify "lecture"', 'Add URL if available online'],
    },
    presentation: {
      description: 'Complete guide to citing presentations in Harvard style.',
      format: 'Presenter, A.A. Year, "Presentation Title", Conference Name, Location, Day Month Year, presentation.',
      example: 'Smith, J.A. 2024, "New Research Methods", Academic Conference, New York, 15 January 2024, presentation.',
      notes: ['Include conference and location', 'Specify "presentation"', 'Add URL if available'],
    },
    image: {
      description: 'Learn how to cite images in Harvard style.',
      format: 'Artist, A.A. Year, Image Title, Source, [Online], Available at: URL [Accessed Date].',
      example: 'Smith, J.A. 2024, Research Diagram, Academic Journal, [Online], Available at: www.example.com/image [Accessed 15 January 2024].',
      notes: ['Include artist or creator', 'Specify [Online] if accessed online', 'Include URL and access date'],
    },
    artwork: {
      description: 'Complete guide to citing artwork in Harvard style.',
      format: 'Artist, A.A. Year, Artwork Title, Medium, Museum or Collection, Location.',
      example: 'Smith, J.A. 2023, Research Visualization, Digital Art, Academic Museum, New York.',
      notes: ['Include artist name', 'Specify the medium', 'Include museum or collection location'],
    },
    email: {
      description: 'Learn how to cite emails in Harvard style.',
      format: 'Sender, A.A. Year, email to Recipient Name, Day Month Year.',
      example: 'Smith, J.A. 2024, email to Jane Doe, 15 January 2024.',
      notes: ['Specify "email to"', 'Include recipient', 'Include date'],
    },
    'personal-communication': {
      description: 'Complete guide to citing personal communications in Harvard style.',
      format: 'Sender, A.A. Year, personal communication, Day Month Year.',
      example: 'Smith, J.A. 2024, personal communication, 15 January 2024.',
      notes: ['Specify "personal communication"', 'Include date', 'Format as Day Month Year'],
    },
    patent: {
      description: 'Learn how to cite patents in Harvard style.',
      format: 'Inventor, A.A. Year, Patent Title, Patent No. Number, Patent Office, Day Month Year.',
      example: 'Smith, J.A. 2023, Research Method Device, Patent No. US123456, U.S. Patent and Trademark Office, 15 January 2023.',
      notes: ['Include patent number', 'Specify patent office', 'Include issue date'],
    },
    standard: {
      description: 'Complete guide to citing standards in Harvard style.',
      format: 'Organization Year, Standard Title, Standard No. Number, Publisher, Place.',
      example: 'American Standards Institute 2023, Research Methods Standard, Standard No. ANSI-2023, Academic Press, New York.',
      notes: ['Include organization', 'Specify standard number', 'Include publisher and place'],
    },
    dataset: {
      description: 'Learn how to cite datasets in Harvard style.',
      format: 'Author, A.A. Year, Dataset Title, Publisher, [Online], Available at: URL [Accessed Date].',
      example: 'Smith, J.A. 2023, Research Data Collection, Academic Database, [Online], Available at: www.example.com/data [Accessed 15 January 2024].',
      notes: ['Specify [Online]', 'Include URL and access date', 'Include publisher'],
    },
    software: {
      description: 'Complete guide to citing software in Harvard style.',
      format: 'Author, A.A. Year, Software Name, version Version, Publisher, [Online], Available at: URL [Accessed Date].',
      example: 'Smith, J.A. 2023, Research Tool, version 2.0, Academic Software, [Online], Available at: www.example.com [Accessed 15 January 2024].',
      notes: ['Include version number', 'Specify [Online]', 'Add URL and access date'],
    },
    'mobile-app': {
      description: 'Learn how to cite mobile apps in Harvard style.',
      format: 'Developer, A.A. Year, App Name, version Version, App Store, [Online], Available at: URL [Accessed Date].',
      example: 'Smith, J.A. 2023, Research Assistant, version 1.5, App Store, [Online], Available at: apps.apple.com/example [Accessed 15 January 2024].',
      notes: ['Include version number', 'Specify [Online]', 'Include app store, URL, and access date'],
    },
    'social-media-post': {
      description: 'Complete guide to citing social media posts in Harvard style.',
      format: 'Author, A.A. [@username] Year, "First portion of post", Platform, Day Month Year, [Online], Available at: URL [Accessed Date].',
      example: 'Smith, J.A. [@researchmethods] 2024, "New study findings", Twitter, 15 January 2024, [Online], Available at: twitter.com/example [Accessed 15 January 2024].',
      notes: ['Include username in brackets', 'Use first portion of post', 'Specify [Online] and include URL'],
    },
    'forum-post': {
      description: 'Learn how to cite forum posts in Harvard style.',
      format: 'Author, A.A. Year, "Post Title", Forum Name, Day Month Year, [Online], Available at: URL [Accessed Date].',
      example: 'Smith, J.A. 2024, "Research Question", Academic Forum, 15 January 2024, [Online], Available at: www.forum.example.com [Accessed 15 January 2024].',
      notes: ['Include forum name', 'Specify [Online]', 'Add URL and access date'],
    },
    wiki: {
      description: 'Complete guide to citing Wikipedia and other wikis in Harvard style.',
      format: '"Article Title" Year, Wiki Name, [Online], Available at: URL [Accessed Date].',
      example: '"Academic Writing" 2024, Wikipedia, [Online], Available at: en.wikipedia.org/wiki/Academic_writing [Accessed 15 January 2024].',
      notes: ['Start with article title in quotation marks', 'Specify [Online]', 'Add URL and access date'],
    },
    'government-document': {
      description: 'Learn how to cite government documents in Harvard style.',
      format: 'Agency Name Year, Document Title, Publication No. Number, Publisher, Place, [Online], Available at: URL [Accessed Date].',
      example: 'U.S. Department of Education 2023, Research Guidelines, Pub. No. ED-2023-001, Government Printing Office, Washington, DC, [Online], Available at: www.example.com [Accessed 15 January 2024].',
      notes: ['Include agency name', 'Specify publication number', 'Include publisher, place, URL, and access date'],
    },
  },
  // Vancouver templates (medical/scientific)
  vancouver: {
    encyclopedia: {
      description: 'Complete guide to citing encyclopedia entries in Vancouver style.',
      format: '[1] Author AA. Entry title. In: Editor Name, editor. Encyclopedia Name. Place: Publisher; Year. p. Pages.',
      example: '[1] Smith JA. Academic Writing. In: Davis RM, editor. Encyclopedia of Research Methods. New York: Academic Press; 2023. p. 45-60.',
      notes: ['Use numbered citations', 'Include editor', 'Specify pages with "p."'],
    },
    dictionary: {
      description: 'Learn how to cite dictionary entries in Vancouver style.',
      format: '[1] Entry word. In: Editor Name, editor. Dictionary Name. Place: Publisher; Year.',
      example: '[1] Research. In: Davis RM, editor. Academic Dictionary. New York: Academic Press; 2023.',
      notes: ['Use numbered citations', 'Start with entry word', 'Include editor and publisher'],
    },
    interview: {
      description: 'Complete guide to citing interviews in Vancouver style.',
      format: '[1] Interviewee AA. Personal interview. Year Month Day.',
      example: '[1] Smith JA. Personal interview. 2024 Jan 15.',
      notes: ['Use numbered citations', 'Specify "Personal interview"', 'Format date as Year Month Day'],
    },
    lecture: {
      description: 'Learn how to cite lectures in Vancouver style.',
      format: '[1] Lecturer AA. Lecture title. Course Name, Institution, Place; Year Month Day.',
      example: '[1] Smith JA. Introduction to Research Methods. Research Methods 101, University of Example, New York; 2024 Jan 15.',
      notes: ['Use numbered citations', 'Include course, institution, location', 'Format date properly'],
    },
    presentation: {
      description: 'Complete guide to citing presentations in Vancouver style.',
      format: '[1] Presenter AA. Presentation title. Conference Name, Location; Year Month Day.',
      example: '[1] Smith JA. New Research Methods. Academic Conference, New York; 2024 Jan 15.',
      notes: ['Use numbered citations', 'Include conference and location', 'Format date'],
    },
    image: {
      description: 'Learn how to cite images in Vancouver style.',
      format: '[1] Artist AA. Image title [Internet]. Source; Year [cited Date]. Available from: URL.',
      example: '[1] Smith JA. Research Diagram [Internet]. Academic Journal; 2024 [cited 2024 Jan 15]. Available from: www.example.com/image.',
      notes: ['Use numbered citations', 'Specify [Internet]', 'Include cited date and URL'],
    },
    artwork: {
      description: 'Complete guide to citing artwork in Vancouver style.',
      format: '[1] Artist AA. Artwork title. Medium. Museum or Collection, Location; Year.',
      example: '[1] Smith JA. Research Visualization. Digital Art. Academic Museum, New York; 2023.',
      notes: ['Use numbered citations', 'Specify medium', 'Include museum and location'],
    },
    email: {
      description: 'Learn how to cite emails in Vancouver style.',
      format: '[1] Sender AA. Subject line [email]. Year Month Day.',
      example: '[1] Smith JA. Research Discussion [email]. 2024 Jan 15.',
      notes: ['Use numbered citations', 'Specify [email]', 'Include date'],
    },
    'personal-communication': {
      description: 'Complete guide to citing personal communications in Vancouver style.',
      format: '[1] Sender AA. Personal communication. Year Month Day.',
      example: '[1] Smith JA. Personal communication. 2024 Jan 15.',
      notes: ['Use numbered citations', 'Specify "Personal communication"', 'Include date'],
    },
    patent: {
      description: 'Learn how to cite patents in Vancouver style.',
      format: '[1] Inventor AA. Patent title. Patent No. Number. Patent Office; Year Month Day.',
      example: '[1] Smith JA. Research Method Device. Patent No. US123456. U.S. Patent and Trademark Office; 2023 Jan 15.',
      notes: ['Use numbered citations', 'Include patent number', 'Specify patent office and date'],
    },
    standard: {
      description: 'Complete guide to citing standards in Vancouver style.',
      format: '[1] Organization. Standard title. Standard No. Number. Place: Publisher; Year.',
      example: '[1] American Standards Institute. Research Methods Standard. Standard No. ANSI-2023. New York: Academic Press; 2023.',
      notes: ['Use numbered citations', 'Include organization', 'Specify standard number, publisher, and year'],
    },
    dataset: {
      description: 'Learn how to cite datasets in Vancouver style.',
      format: '[1] Author AA. Dataset title [Internet]. Publisher; Year [cited Date]. Available from: URL.',
      example: '[1] Smith JA. Research Data Collection [Internet]. Academic Database; 2023 [cited 2024 Jan 15]. Available from: www.example.com/data.',
      notes: ['Use numbered citations', 'Specify [Internet]', 'Include cited date and URL'],
    },
    software: {
      description: 'Complete guide to citing software in Vancouver style.',
      format: '[1] Author AA. Software name, version Version [Internet]. Publisher; Year [cited Date]. Available from: URL.',
      example: '[1] Smith JA. Research Tool, version 2.0 [Internet]. Academic Software; 2023 [cited 2024 Jan 15]. Available from: www.example.com.',
      notes: ['Use numbered citations', 'Include version', 'Specify [Internet] and include URL'],
    },
    'mobile-app': {
      description: 'Learn how to cite mobile apps in Vancouver style.',
      format: '[1] Developer AA. App name, version Version [Internet]. App Store; Year [cited Date]. Available from: URL.',
      example: '[1] Smith JA. Research Assistant, version 1.5 [Internet]. App Store; 2023 [cited 2024 Jan 15]. Available from: apps.apple.com/example.',
      notes: ['Use numbered citations', 'Include version', 'Specify [Internet] and include URL'],
    },
    'social-media-post': {
      description: 'Complete guide to citing social media posts in Vancouver style.',
      format: '[1] Author AA [@username]. First portion of post [Internet]. Platform; Year Month Day [cited Date]. Available from: URL.',
      example: '[1] Smith JA [@researchmethods]. New study findings [Internet]. Twitter; 2024 Jan 15 [cited 2024 Jan 15]. Available from: twitter.com/example.',
      notes: ['Use numbered citations', 'Include username', 'Specify [Internet] and include URL'],
    },
    'forum-post': {
      description: 'Learn how to cite forum posts in Vancouver style.',
      format: '[1] Author AA. Post title [Internet]. Forum Name; Year Month Day [cited Date]. Available from: URL.',
      example: '[1] Smith JA. Research Question [Internet]. Academic Forum; 2024 Jan 15 [cited 2024 Jan 15]. Available from: www.forum.example.com.',
      notes: ['Use numbered citations', 'Include forum name', 'Specify [Internet] and include URL'],
    },
    wiki: {
      description: 'Complete guide to citing Wikipedia and other wikis in Vancouver style.',
      format: '[1] Article title [Internet]. Wiki Name; Year Month Day [cited Date]. Available from: URL.',
      example: '[1] Academic Writing [Internet]. Wikipedia; 2024 Jan 15 [cited 2024 Jan 15]. Available from: en.wikipedia.org/wiki/Academic_writing.',
      notes: ['Use numbered citations', 'Start with article title', 'Specify [Internet] and include URL'],
    },
    'government-document': {
      description: 'Learn how to cite government documents in Vancouver style.',
      format: '[1] Agency Name. Document title. Publication No. Number. Place: Publisher; Year [cited Date]. Available from: URL.',
      example: '[1] U.S. Department of Education. Research Guidelines. Pub. No. ED-2023-001. Washington, DC: Government Printing Office; 2023 [cited 2024 Jan 15]. Available from: www.example.com.',
      notes: ['Use numbered citations', 'Include agency and publication number', 'Specify [Internet] if online and include URL'],
    },
  },
  // ACS templates (chemistry)
  acs: {
    encyclopedia: {
      description: 'Complete guide to citing encyclopedia entries in ACS style.',
      format: '(1) Author, A. A. Entry Title. In Encyclopedia Name; Editor Name, Ed.; Publisher: Place, Year; Vol. Volume, pp Pages.',
      example: '(1) Smith, J. A. Academic Writing. In Encyclopedia of Research Methods; Davis, R. M., Ed.; Academic Press: New York, 2023; Vol. 2, pp 45-60.',
      notes: ['Use numbered citations', 'Include editor', 'Specify volume and pages'],
    },
    dictionary: {
      description: 'Learn how to cite dictionary entries in ACS style.',
      format: '(1) Entry Word. In Dictionary Name; Editor Name, Ed.; Publisher: Place, Year.',
      example: '(1) Research. In Academic Dictionary; Davis, R. M., Ed.; Academic Press: New York, 2023.',
      notes: ['Use numbered citations', 'Start with entry word', 'Include editor and publisher'],
    },
    interview: {
      description: 'Complete guide to citing interviews in ACS style.',
      format: '(1) Interviewee, A. A. Personal interview, Month Day, Year.',
      example: '(1) Smith, J. A. Personal interview, January 15, 2024.',
      notes: ['Use numbered citations', 'Specify "Personal interview"', 'Include date'],
    },
    lecture: {
      description: 'Learn how to cite lectures in ACS style.',
      format: '(1) Lecturer, A. A. Lecture Title. Course Name, Institution, Place, Month Day, Year.',
      example: '(1) Smith, J. A. Introduction to Research Methods. Research Methods 101, University of Example, New York, January 15, 2024.',
      notes: ['Use numbered citations', 'Include course, institution, location', 'Include date'],
    },
    presentation: {
      description: 'Complete guide to citing presentations in ACS style.',
      format: '(1) Presenter, A. A. Presentation Title. Conference Name, Location, Month Day, Year.',
      example: '(1) Smith, J. A. New Research Methods. Academic Conference, New York, January 15, 2024.',
      notes: ['Use numbered citations', 'Include conference and location', 'Include date'],
    },
    image: {
      description: 'Learn how to cite images in ACS style.',
      format: '(1) Artist, A. A. Image Title. Source Year. URL (accessed Date).',
      example: '(1) Smith, J. A. Research Diagram. Academic Journal 2024. www.example.com/image (accessed January 15, 2024).',
      notes: ['Use numbered citations', 'Include source and year', 'Add URL and access date'],
    },
    artwork: {
      description: 'Complete guide to citing artwork in ACS style.',
      format: '(1) Artist, A. A. Artwork Title. Medium, Museum or Collection, Location, Year.',
      example: '(1) Smith, J. A. Research Visualization. Digital Art, Academic Museum, New York, 2023.',
      notes: ['Use numbered citations', 'Specify medium', 'Include museum and location'],
    },
    email: {
      description: 'Learn how to cite emails in ACS style.',
      format: '(1) Sender, A. A. Subject Line. Email to Recipient Name, Month Day, Year.',
      example: '(1) Smith, J. A. Research Discussion. Email to Jane Doe, January 15, 2024.',
      notes: ['Use numbered citations', 'Specify "Email to"', 'Include recipient and date'],
    },
    'personal-communication': {
      description: 'Complete guide to citing personal communications in ACS style.',
      format: '(1) Sender, A. A. Personal communication, Month Day, Year.',
      example: '(1) Smith, J. A. Personal communication, January 15, 2024.',
      notes: ['Use numbered citations', 'Specify "Personal communication"', 'Include date'],
    },
    patent: {
      description: 'Learn how to cite patents in ACS style.',
      format: '(1) Inventor, A. A. Patent Title. U.S. Patent Number, Month Day, Year.',
      example: '(1) Smith, J. A. Research Method Device. U.S. Patent 123456, January 15, 2023.',
      notes: ['Use numbered citations', 'Include patent number', 'Include issue date'],
    },
    standard: {
      description: 'Complete guide to citing standards in ACS style.',
      format: '(1) Organization. Standard Title; Standard No. Number; Publisher: Place, Year.',
      example: '(1) American Standards Institute. Research Methods Standard; Standard No. ANSI-2023; Academic Press: New York, 2023.',
      notes: ['Use numbered citations', 'Include organization', 'Specify standard number, publisher, and year'],
    },
    dataset: {
      description: 'Learn how to cite datasets in ACS style.',
      format: '(1) Author, A. A. Dataset Title. Publisher Year. URL (accessed Date).',
      example: '(1) Smith, J. A. Research Data Collection. Academic Database 2023. www.example.com/data (accessed January 15, 2024).',
      notes: ['Use numbered citations', 'Include publisher and year', 'Add URL and access date'],
    },
    software: {
      description: 'Complete guide to citing software in ACS style.',
      format: '(1) Author, A. A. Software Name, version Version; Publisher: Place, Year. URL (accessed Date).',
      example: '(1) Smith, J. A. Research Tool, version 2.0; Academic Software: New York, 2023. www.example.com (accessed January 15, 2024).',
      notes: ['Use numbered citations', 'Include version', 'Add URL and access date'],
    },
    'mobile-app': {
      description: 'Learn how to cite mobile apps in ACS style.',
      format: '(1) Developer, A. A. App Name, version Version; App Store: Place, Year. URL (accessed Date).',
      example: '(1) Smith, J. A. Research Assistant, version 1.5; App Store: New York, 2023. apps.apple.com/example (accessed January 15, 2024).',
      notes: ['Use numbered citations', 'Include version', 'Add URL and access date'],
    },
    'social-media-post': {
      description: 'Complete guide to citing social media posts in ACS style.',
      format: '(1) Author, A. A. [@username]. First portion of post. Platform, Month Day, Year. URL (accessed Date).',
      example: '(1) Smith, J. A. [@researchmethods]. New study findings. Twitter, January 15, 2024. twitter.com/example (accessed January 15, 2024).',
      notes: ['Use numbered citations', 'Include username', 'Add URL and access date'],
    },
    'forum-post': {
      description: 'Learn how to cite forum posts in ACS style.',
      format: '(1) Author, A. A. Post Title. Forum Name, Month Day, Year. URL (accessed Date).',
      example: '(1) Smith, J. A. Research Question. Academic Forum, January 15, 2024. www.forum.example.com (accessed January 15, 2024).',
      notes: ['Use numbered citations', 'Include forum name', 'Add URL and access date'],
    },
    wiki: {
      description: 'Complete guide to citing Wikipedia and other wikis in ACS style.',
      format: '(1) Article Title. Wiki Name, Month Day, Year. URL (accessed Date).',
      example: '(1) Academic Writing. Wikipedia, January 15, 2024. en.wikipedia.org/wiki/Academic_writing (accessed January 15, 2024).',
      notes: ['Use numbered citations', 'Start with article title', 'Add URL and access date'],
    },
    'government-document': {
      description: 'Learn how to cite government documents in ACS style.',
      format: '(1) Agency Name. Document Title; Publication No. Number; Publisher: Place, Year. URL (accessed Date).',
      example: '(1) U.S. Department of Education. Research Guidelines; Pub. No. ED-2023-001; Government Printing Office: Washington, DC, 2023. www.example.com (accessed January 15, 2024).',
      notes: ['Use numbered citations', 'Include agency and publication number', 'Add URL and access date'],
    },
  },
  // AMA templates (medical)
  ama: {
    encyclopedia: {
      description: 'Complete guide to citing encyclopedia entries in AMA style.',
      format: '1. Author AA. Entry title. In: Editor Name, ed. Encyclopedia Name. Place: Publisher; Year:Pages.',
      example: '1. Smith JA. Academic Writing. In: Davis RM, ed. Encyclopedia of Research Methods. New York: Academic Press; 2023:45-60.',
      notes: ['Use numbered citations', 'Include editor', 'Specify pages with colon'],
    },
    dictionary: {
      description: 'Learn how to cite dictionary entries in AMA style.',
      format: '1. Entry word. In: Editor Name, ed. Dictionary Name. Place: Publisher; Year.',
      example: '1. Research. In: Davis RM, ed. Academic Dictionary. New York: Academic Press; 2023.',
      notes: ['Use numbered citations', 'Start with entry word', 'Include editor and publisher'],
    },
    interview: {
      description: 'Complete guide to citing interviews in AMA style.',
      format: '1. Interviewee AA. Personal interview. Month Day, Year.',
      example: '1. Smith JA. Personal interview. January 15, 2024.',
      notes: ['Use numbered citations', 'Specify "Personal interview"', 'Include date'],
    },
    lecture: {
      description: 'Learn how to cite lectures in AMA style.',
      format: '1. Lecturer AA. Lecture title. Course Name, Institution, Place. Month Day, Year.',
      example: '1. Smith JA. Introduction to Research Methods. Research Methods 101, University of Example, New York. January 15, 2024.',
      notes: ['Use numbered citations', 'Include course, institution, location', 'Include date'],
    },
    presentation: {
      description: 'Complete guide to citing presentations in AMA style.',
      format: '1. Presenter AA. Presentation title. Conference Name, Location. Month Day, Year.',
      example: '1. Smith JA. New Research Methods. Academic Conference, New York. January 15, 2024.',
      notes: ['Use numbered citations', 'Include conference and location', 'Include date'],
    },
    image: {
      description: 'Learn how to cite images in AMA style.',
      format: '1. Artist AA. Image title. Source. Published Month Day, Year. Updated Month Day, Year. Accessed Month Day, Year. URL.',
      example: '1. Smith JA. Research Diagram. Academic Journal. Published January 15, 2024. Accessed January 15, 2024. www.example.com/image.',
      notes: ['Use numbered citations', 'Include published and accessed dates', 'Add URL'],
    },
    artwork: {
      description: 'Complete guide to citing artwork in AMA style.',
      format: '1. Artist AA. Artwork title. Medium. Museum or Collection, Location. Year.',
      example: '1. Smith JA. Research Visualization. Digital Art. Academic Museum, New York. 2023.',
      notes: ['Use numbered citations', 'Specify medium', 'Include museum and location'],
    },
    email: {
      description: 'Learn how to cite emails in AMA style.',
      format: '1. Sender AA. Subject line. Email to Recipient Name. Month Day, Year.',
      example: '1. Smith JA. Research Discussion. Email to Jane Doe. January 15, 2024.',
      notes: ['Use numbered citations', 'Specify "Email to"', 'Include recipient and date'],
    },
    'personal-communication': {
      description: 'Complete guide to citing personal communications in AMA style.',
      format: '1. Sender AA. Personal communication. Month Day, Year.',
      example: '1. Smith JA. Personal communication. January 15, 2024.',
      notes: ['Use numbered citations', 'Specify "Personal communication"', 'Include date'],
    },
    patent: {
      description: 'Learn how to cite patents in AMA style.',
      format: '1. Inventor AA. Patent title. US Patent Number. Issued Month Day, Year.',
      example: '1. Smith JA. Research Method Device. US Patent 123456. Issued January 15, 2023.',
      notes: ['Use numbered citations', 'Include patent number', 'Specify issue date'],
    },
    standard: {
      description: 'Complete guide to citing standards in AMA style.',
      format: '1. Organization. Standard title. Standard No. Number. Place: Publisher; Year.',
      example: '1. American Standards Institute. Research Methods Standard. Standard No. ANSI-2023. New York: Academic Press; 2023.',
      notes: ['Use numbered citations', 'Include organization', 'Specify standard number, publisher, and year'],
    },
    dataset: {
      description: 'Learn how to cite datasets in AMA style.',
      format: '1. Author AA. Dataset title. Publisher. Published Month Day, Year. Accessed Month Day, Year. URL.',
      example: '1. Smith JA. Research Data Collection. Academic Database. Published January 15, 2023. Accessed January 15, 2024. www.example.com/data.',
      notes: ['Use numbered citations', 'Include published and accessed dates', 'Add URL'],
    },
    software: {
      description: 'Complete guide to citing software in AMA style.',
      format: '1. Author AA. Software name, version Version. Publisher. Published Month Day, Year. Accessed Month Day, Year. URL.',
      example: '1. Smith JA. Research Tool, version 2.0. Academic Software. Published January 15, 2023. Accessed January 15, 2024. www.example.com.',
      notes: ['Use numbered citations', 'Include version', 'Add published, accessed dates, and URL'],
    },
    'mobile-app': {
      description: 'Learn how to cite mobile apps in AMA style.',
      format: '1. Developer AA. App name, version Version. App Store. Published Month Day, Year. Accessed Month Day, Year. URL.',
      example: '1. Smith JA. Research Assistant, version 1.5. App Store. Published January 15, 2023. Accessed January 15, 2024. apps.apple.com/example.',
      notes: ['Use numbered citations', 'Include version', 'Add published, accessed dates, and URL'],
    },
    'social-media-post': {
      description: 'Complete guide to citing social media posts in AMA style.',
      format: '1. Author AA [@username]. First portion of post. Platform. Published Month Day, Year. Accessed Month Day, Year. URL.',
      example: '1. Smith JA [@researchmethods]. New study findings. Twitter. Published January 15, 2024. Accessed January 15, 2024. twitter.com/example.',
      notes: ['Use numbered citations', 'Include username', 'Add published, accessed dates, and URL'],
    },
    'forum-post': {
      description: 'Learn how to cite forum posts in AMA style.',
      format: '1. Author AA. Post title. Forum Name. Published Month Day, Year. Accessed Month Day, Year. URL.',
      example: '1. Smith JA. Research Question. Academic Forum. Published January 15, 2024. Accessed January 15, 2024. www.forum.example.com.',
      notes: ['Use numbered citations', 'Include forum name', 'Add published, accessed dates, and URL'],
    },
    wiki: {
      description: 'Complete guide to citing Wikipedia and other wikis in AMA style.',
      format: '1. Article title. Wiki Name. Published Month Day, Year. Updated Month Day, Year. Accessed Month Day, Year. URL.',
      example: '1. Academic Writing. Wikipedia. Published January 15, 2024. Updated January 15, 2024. Accessed January 15, 2024. en.wikipedia.org/wiki/Academic_writing.',
      notes: ['Use numbered citations', 'Start with article title', 'Add published, updated, accessed dates, and URL'],
    },
    'government-document': {
      description: 'Learn how to cite government documents in AMA style.',
      format: '1. Agency Name. Document title. Publication No. Number. Place: Publisher; Year. Published Month Day, Year. Accessed Month Day, Year. URL.',
      example: '1. U.S. Department of Education. Research Guidelines. Pub. No. ED-2023-001. Washington, DC: Government Printing Office; 2023. Published January 15, 2023. Accessed January 15, 2024. www.example.com.',
      notes: ['Use numbered citations', 'Include agency and publication number', 'Add published, accessed dates, and URL'],
    },
  },
  // Turabian style templates (based on Chicago)
  turabian: {
    book: {
      description: 'Complete guide to citing books in Turabian style.',
      format: 'Author, First Name. Title of Book. Place: Publisher, Year.',
      example: 'Smith, John A. Research Methods in Academia. Chicago: University of Chicago Press, 2023.',
      notes: ['Use notes-bibliography or author-date system', 'Include place and publisher', 'Follow Chicago style conventions'],
    },
    website: {
      description: 'Learn how to cite websites in Turabian style.',
      format: 'Author, First Name. "Title of Page." Website Name. Accessed Date. URL.',
      example: 'Smith, John A. "Research Guidelines." Academic Resources. Accessed January 15, 2024. https://example.com.',
      notes: ['Include access date', 'Use quotation marks for page title', 'Add URL'],
    },
    journal: {
      description: 'Complete guide to citing journal articles in Turabian style.',
      format: 'Author, First Name. "Title of Article." Journal Name Volume, no. Issue (Year): Pages.',
      example: 'Smith, John A. "New Research Methods." Academic Journal 45, no. 2 (2023): 123-145.',
      notes: ['Use quotation marks for article title', 'Include volume, issue, year, and pages', 'Follow Chicago conventions'],
    },
  },
  // CSE style templates (Council of Science Editors)
  cse: {
    book: {
      description: 'Complete guide to citing books in CSE style.',
      format: 'Author AA. Year. Title of Book. Place: Publisher.',
      example: 'Smith JA. 2023. Research Methods in Academia. New York: Academic Press.',
      notes: ['Use name-year or citation-sequence system', 'Abbreviate author names', 'Include place and publisher'],
    },
    website: {
      description: 'Learn how to cite websites in CSE style.',
      format: 'Author AA. Year. Title of page [Internet]. Website Name. [cited Date]. Available from: URL',
      example: 'Smith JA. 2024. Research Guidelines [Internet]. Academic Resources. [cited 2024 Jan 15]. Available from: https://example.com',
      notes: ['Specify [Internet]', 'Include cited date', 'Add URL'],
    },
    journal: {
      description: 'Complete guide to citing journal articles in CSE style.',
      format: 'Author AA. Year. Title of article. Journal Name. Volume(Issue):Pages.',
      example: 'Smith JA. 2023. New Research Methods. Academic Journal. 45(2):123-145.',
      notes: ['Abbreviate author names', 'Include volume, issue, and pages', 'No quotation marks for titles'],
    },
  },
  // OSCOLA style templates (Oxford Standard for Citation of Legal Authorities)
  oscola: {
    book: {
      description: 'Complete guide to citing books in OSCOLA style.',
      format: 'Author, Title (Publisher, Year) Page.',
      example: 'Smith, Research Methods in Law (Oxford University Press, 2023) 45.',
      notes: ['Use footnotes', 'Include publisher and year', 'Specify page numbers'],
    },
    website: {
      description: 'Learn how to cite websites in OSCOLA style.',
      format: 'Author, "Title" (Website Name, Date) <URL> accessed Date.',
      example: 'Smith, "Legal Research Guidelines" (Academic Resources, 15 January 2024) <https://example.com> accessed 15 January 2024.',
      notes: ['Use quotation marks for titles', 'Include access date', 'Format URL in angle brackets'],
    },
    journal: {
      description: 'Complete guide to citing journal articles in OSCOLA style.',
      format: 'Author, "Title" (Year) Volume Journal Name Page.',
      example: 'Smith, "New Legal Research Methods" (2023) 45 Law Review 123.',
      notes: ['Use quotation marks for article titles', 'Include volume, journal name, and page', 'Use footnotes'],
    },
  },
  // MHRA style templates (Modern Humanities Research Association)
  mhra: {
    book: {
      description: 'Complete guide to citing books in MHRA style.',
      format: 'Author, Title (Place: Publisher, Year), p. Page.',
      example: 'Smith, John A., Research Methods in Humanities (London: Academic Press, 2023), p. 45.',
      notes: ['Use footnotes', 'Include place, publisher, and year', 'Specify page with "p."'],
    },
    website: {
      description: 'Learn how to cite websites in MHRA style.',
      format: 'Author, "Title", Website Name <URL> [accessed Date].',
      example: 'Smith, John A., "Research Guidelines", Academic Resources <https://example.com> [accessed 15 January 2024].',
      notes: ['Use quotation marks for titles', 'Format URL in angle brackets', 'Include access date in square brackets'],
    },
    journal: {
      description: 'Complete guide to citing journal articles in MHRA style.',
      format: 'Author, "Title", Journal Name, Volume (Year), Pages (p. Page).',
      example: 'Smith, John A., "New Research Methods", Academic Journal, 45 (2023), 123-145 (p. 123).',
      notes: ['Use quotation marks for article titles', 'Include volume, year, and pages', 'Use footnotes'],
    },
  },
  // Bluebook style templates (legal citation)
  bluebook: {
    book: {
      description: 'Complete guide to citing books in Bluebook style.',
      format: 'AUTHOR, TITLE Page (Publisher Year).',
      example: 'SMITH, RESEARCH METHODS IN LAW 45 (Oxford Univ. Press 2023).',
      notes: ['Use ALL CAPS for author and title', 'Abbreviate publisher names', 'Include page and year'],
    },
    website: {
      description: 'Learn how to cite websites in Bluebook style.',
      format: 'Author, Title, URL (last visited Date).',
      example: 'Smith, Research Guidelines, https://example.com (last visited Jan. 15, 2024).',
      notes: ['Include URL', 'Specify last visited date', 'Use proper Bluebook abbreviations'],
    },
    journal: {
      description: 'Complete guide to citing journal articles in Bluebook style.',
      format: 'Author, Title, Volume Journal Abbreviation Page (Year).',
      example: 'Smith, New Legal Research Methods, 45 L. REV. 123 (2023).',
      notes: ['Use journal abbreviations', 'Format in ALL CAPS for certain elements', 'Follow Bluebook rules'],
    },
  },
  // NLM style templates (National Library of Medicine)
  nlm: {
    book: {
      description: 'Complete guide to citing books in NLM style.',
      format: 'Author AA. Title of Book. Place: Publisher; Year.',
      example: 'Smith JA. Research Methods in Medicine. Bethesda: Academic Press; 2023.',
      notes: ['Abbreviate author names', 'Include place and publisher', 'Use semicolon before year'],
    },
    website: {
      description: 'Learn how to cite websites in NLM style.',
      format: 'Author AA. Title of page [Internet]. Place: Publisher; Year [cited Date]. Available from: URL',
      example: 'Smith JA. Research Guidelines [Internet]. Bethesda: Academic Resources; 2024 [cited 2024 Jan 15]. Available from: https://example.com',
      notes: ['Specify [Internet]', 'Include cited date', 'Add URL'],
    },
    journal: {
      description: 'Complete guide to citing journal articles in NLM style.',
      format: 'Author AA. Title of article. Journal Name. Year;Volume(Issue):Pages.',
      example: 'Smith JA. New Research Methods. Med J. 2023;45(2):123-145.',
      notes: ['Abbreviate journal names', 'Use semicolon before year', 'Include volume, issue, and pages'],
    },
  },
  // APSA style templates (American Political Science Association)
  apsa: {
    book: {
      description: 'Complete guide to citing books in APSA style.',
      format: 'Author, First Name. Year. Title of Book. Place: Publisher.',
      example: 'Smith, John A. 2023. Research Methods in Political Science. Washington, DC: Academic Press.',
      notes: ['Use author-date system', 'Include place and publisher', 'Follow APSA guidelines'],
    },
    website: {
      description: 'Learn how to cite websites in APSA style.',
      format: 'Author, First Name. Year. "Title of Page." Website Name. Accessed Date. URL.',
      example: 'Smith, John A. 2024. "Research Guidelines." Academic Resources. Accessed January 15, 2024. https://example.com.',
      notes: ['Use quotation marks for page titles', 'Include access date', 'Add URL'],
    },
    journal: {
      description: 'Complete guide to citing journal articles in APSA style.',
      format: 'Author, First Name. Year. "Title of Article." Journal Name Volume(Issue): Pages.',
      example: 'Smith, John A. 2023. "New Research Methods." Political Science Review 45(2): 123-145.',
      notes: ['Use quotation marks for article titles', 'Include volume, issue, and pages', 'Follow author-date format'],
    },
  },
  // ASA style templates (American Sociological Association)
  asa: {
    book: {
      description: 'Complete guide to citing books in ASA style.',
      format: 'Author, First Name. Year. Title of Book. Place: Publisher.',
      example: 'Smith, John A. 2023. Research Methods in Sociology. New York: Academic Press.',
      notes: ['Use author-date system', 'Include place and publisher', 'Follow ASA guidelines'],
    },
    website: {
      description: 'Learn how to cite websites in ASA style.',
      format: 'Author, First Name. Year. "Title of Page." Website Name. Accessed Date (URL).',
      example: 'Smith, John A. 2024. "Research Guidelines." Academic Resources. Accessed January 15, 2024 (https://example.com).',
      notes: ['Use quotation marks for page titles', 'Include access date', 'Add URL in parentheses'],
    },
    journal: {
      description: 'Complete guide to citing journal articles in ASA style.',
      format: 'Author, First Name. Year. "Title of Article." Journal Name Volume(Issue):Pages.',
      example: 'Smith, John A. 2023. "New Research Methods." Sociological Review 45(2):123-145.',
      notes: ['Use quotation marks for article titles', 'No space after colon before pages', 'Follow author-date format'],
    },
  },
  // AAA style templates (American Anthropological Association)
  aaa: {
    book: {
      description: 'Complete guide to citing books in AAA style.',
      format: 'Author, First Name. Year. Title of Book. Place: Publisher.',
      example: 'Smith, John A. 2023. Research Methods in Anthropology. Chicago: University of Chicago Press.',
      notes: ['Use author-date system', 'Include place and publisher', 'Follow AAA/Chicago conventions'],
    },
    website: {
      description: 'Learn how to cite websites in AAA style.',
      format: 'Author, First Name. Year. "Title of Page." Website Name. Accessed Date. URL.',
      example: 'Smith, John A. 2024. "Research Guidelines." Academic Resources. Accessed January 15, 2024. https://example.com.',
      notes: ['Use quotation marks for page titles', 'Include access date', 'Add URL'],
    },
    journal: {
      description: 'Complete guide to citing journal articles in AAA style.',
      format: 'Author, First Name. Year. "Title of Article." Journal Name Volume(Issue):Pages.',
      example: 'Smith, John A. 2023. "New Research Methods." Anthropological Review 45(2):123-145.',
      notes: ['Use quotation marks for article titles', 'Include volume, issue, and pages', 'Follow author-date format'],
    },
  },
  // AGLC style templates (Australian Guide to Legal Citation)
  aglc: {
    book: {
      description: 'Complete guide to citing books in AGLC style.',
      format: 'Author, Title (Publisher, Year) Page.',
      example: 'Smith, Research Methods in Australian Law (Federation Press, 2023) 45.',
      notes: ['Use footnotes', 'Include publisher and year', 'Specify page numbers'],
    },
    website: {
      description: 'Learn how to cite websites in AGLC style.',
      format: 'Author, "Title" (Date) Website Name <URL>.',
      example: 'Smith, "Legal Research Guidelines" (15 January 2024) Australian Legal Resources <https://example.com>.',
      notes: ['Use quotation marks for titles', 'Include date', 'Format URL in angle brackets'],
    },
    journal: {
      description: 'Complete guide to citing journal articles in AGLC style.',
      format: 'Author, "Title" (Year) Volume Journal Name Page.',
      example: 'Smith, "New Legal Research Methods" (2023) 45 Australian Law Review 123.',
      notes: ['Use quotation marks for article titles', 'Include volume, journal name, and page', 'Use footnotes'],
    },
  },
};

// Generate all citation sources programmatically
export function generateAllCitationSources(): CitationSource[] {
  const sources: CitationSource[] = [];
  
  // Generate for each style and source type combination
  for (const style of allCitationStyles) {
    for (const sourceType of commonSourceTypes) {
      const source = generateCitationSource(sourceType, style, citationTemplates);
      if (source) {
        sources.push(source);
      }
    }
  }
  
  return sources;
}

// Get total possible combinations
export function getTotalPossibleCombinations(): number {
  return allCitationStyles.length * commonSourceTypes.length;
}

