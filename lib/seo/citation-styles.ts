// Citation style data for programmatic SEO pages
export interface CitationStyle {
  slug: string;
  name: string;
  fullName: string;
  description: string;
  keywords: string[];
  commonUses: string[];
  examples: {
    book: string;
    journal: string;
    website: string;
    inText: string;
  };
}

export const citationStyles: CitationStyle[] = [
  {
    slug: 'apa',
    name: 'APA',
    fullName: 'American Psychological Association',
    description: 'APA style is used primarily in psychology, education, and social sciences. It emphasizes author-date citations and clear, concise writing.',
    keywords: [
      'APA citation',
      'APA format',
      'APA style guide',
      'APA 7th edition',
      'how to cite in APA',
      'APA citation generator',
    ],
    commonUses: [
      'Psychology papers',
      'Education research',
      'Social sciences',
      'Business research',
    ],
    examples: {
      book: 'Author, A. A. (Year). Title of work. Publisher.',
      journal: 'Author, A. A. (Year). Title of article. Journal Name, Volume(Issue), pages. https://doi.org/xx.xxx/yyyy',
      website: 'Author, A. A. (Year, Month Day). Title of page. Site Name. URL',
      inText: '(Author, Year) or Author (Year)',
    },
  },
  {
    slug: 'mla',
    name: 'MLA',
    fullName: 'Modern Language Association',
    description: 'MLA style is used in humanities, especially literature and language studies. It emphasizes author-page citations and works cited pages.',
    keywords: [
      'MLA citation',
      'MLA format',
      'MLA style guide',
      'MLA 9th edition',
      'how to cite in MLA',
      'MLA citation generator',
    ],
    commonUses: [
      'Literature papers',
      'Language studies',
      'Humanities research',
      'English papers',
    ],
    examples: {
      book: 'Author, First Name. Title of Book. Publisher, Year.',
      journal: 'Author, First Name. "Title of Article." Journal Name, vol. Volume, no. Issue, Year, pp. Pages.',
      website: 'Author, First Name. "Title of Page." Website Name, Day Month Year, URL.',
      inText: '(Author Page)',
    },
  },
  {
    slug: 'chicago',
    name: 'Chicago',
    fullName: 'Chicago Manual of Style',
    description: 'Chicago style offers two systems: Notes-Bibliography (humanities) and Author-Date (sciences). It\'s widely used in history and publishing.',
    keywords: [
      'Chicago citation',
      'Chicago style',
      'Chicago format guide',
      'Chicago 17th edition',
      'how to cite in Chicago',
      'Chicago citation generator',
    ],
    commonUses: [
      'History papers',
      'Publishing',
      'Business',
      'Fine arts',
    ],
    examples: {
      book: 'Author, First Name. Title of Book. Place: Publisher, Year.',
      journal: 'Author, First Name. "Title of Article." Journal Name Volume, no. Issue (Year): Pages.',
      website: 'Author, First Name. "Title of Page." Website Name. Last modified Date. URL.',
      inText: 'Notes-Bibliography uses footnotes; Author-Date uses (Author Year, Page)',
    },
  },
  {
    slug: 'ieee',
    name: 'IEEE',
    fullName: 'Institute of Electrical and Electronics Engineers',
    description: 'IEEE style is used in engineering, computer science, and technology fields. It uses numbered citations in square brackets.',
    keywords: [
      'IEEE citation',
      'IEEE format',
      'IEEE style guide',
      'IEEE citation format',
      'how to cite in IEEE',
      'IEEE citation generator',
    ],
    commonUses: [
      'Engineering papers',
      'Computer science',
      'Technology research',
      'Electrical engineering',
    ],
    examples: {
      book: '[1] A. Author, Title of Book. Place: Publisher, Year.',
      journal: '[1] A. Author, "Title of Article," Journal Name, vol. Volume, no. Issue, pp. Pages, Year.',
      website: '[1] A. Author, "Title of Page," Website Name. [Online]. Available: URL. [Accessed: Date].',
      inText: '[1] or [1]-[3] for multiple citations',
    },
  },
  {
    slug: 'harvard',
    name: 'Harvard',
    fullName: 'Harvard Referencing Style',
    description: 'Harvard style is widely used in UK universities and emphasizes author-date citations. It\'s common in business, humanities, and social sciences.',
    keywords: [
      'Harvard citation',
      'Harvard format',
      'Harvard style guide',
      'Harvard referencing',
      'how to cite in Harvard',
      'Harvard citation generator',
    ],
    commonUses: [
      'UK universities',
      'Business studies',
      'Social sciences',
      'Humanities',
    ],
    examples: {
      book: 'Author, A. A. Year. Title of Book. Place: Publisher.',
      journal: 'Author, A. A. Year. "Title of Article." Journal Name, Volume(Issue), pp. Pages.',
      website: 'Author, A. A. Year. "Title of Page." Website Name. [Online]. Available at: URL [Accessed Date].',
      inText: '(Author Year) or (Author Year, p. Page)',
    },
  },
  {
    slug: 'vancouver',
    name: 'Vancouver',
    fullName: 'Vancouver Referencing Style',
    description: 'Vancouver style uses numbered citations and is common in medical and scientific journals. Citations are numbered sequentially.',
    keywords: [
      'Vancouver citation',
      'Vancouver format',
      'Vancouver style guide',
      'Vancouver referencing',
      'how to cite in Vancouver',
      'Vancouver citation generator',
    ],
    commonUses: [
      'Medical journals',
      'Scientific papers',
      'Biomedical research',
      'Health sciences',
    ],
    examples: {
      book: '[1] Author AA. Title of Book. Place: Publisher; Year.',
      journal: '[1] Author AA. Title of article. Journal Name. Year;Volume(Issue):Pages.',
      website: '[1] Author AA. Title of page [Internet]. Website Name; Year [cited Date]. Available from: URL',
      inText: '[1] or [1-3] for multiple citations',
    },
  },
  {
    slug: 'acs',
    name: 'ACS',
    fullName: 'American Chemical Society',
    description: 'ACS style is used in chemistry and related fields. It uses numbered citations in superscript or in parentheses.',
    keywords: [
      'ACS citation',
      'ACS format',
      'ACS style guide',
      'ACS referencing',
      'how to cite in ACS',
      'ACS citation generator',
    ],
    commonUses: [
      'Chemistry papers',
      'Chemical engineering',
      'Biochemistry',
      'Materials science',
    ],
    examples: {
      book: '(1) Author, A. A. Title of Book; Publisher: Place, Year.',
      journal: '(1) Author, A. A. Title of Article. Journal Name Year, Volume, Pages.',
      website: '(1) Author, A. A. Title of Page. Website Name. URL (accessed Date).',
      inText: 'Superscript¹ or (1) format',
    },
  },
  {
    slug: 'ama',
    name: 'AMA',
    fullName: 'American Medical Association',
    description: 'AMA style is used in medical and health sciences. It uses superscript numbers for citations.',
    keywords: [
      'AMA citation',
      'AMA format',
      'AMA style guide',
      'AMA referencing',
      'how to cite in AMA',
      'AMA citation generator',
    ],
    commonUses: [
      'Medical journals',
      'Health sciences',
      'Clinical research',
      'Public health',
    ],
    examples: {
      book: '1. Author AA. Title of Book. Place: Publisher; Year.',
      journal: '1. Author AA. Title of article. Journal Name. Year;Volume(Issue):Pages.',
      website: '1. Author AA. Title of page. Website Name. Published Date. Updated Date. Accessed Date. URL.',
      inText: 'Superscript¹ format',
    },
  },
  {
    slug: 'turabian',
    name: 'Turabian',
    fullName: 'Turabian Style',
    description: 'Turabian style is based on Chicago style and is commonly used in history, literature, and the arts. It offers both notes-bibliography and author-date systems.',
    keywords: [
      'Turabian citation',
      'Turabian format',
      'Turabian style guide',
      'Turabian referencing',
      'how to cite in Turabian',
      'Turabian citation generator',
    ],
    commonUses: [
      'History papers',
      'Literature papers',
      'Arts research',
      'Humanities',
    ],
    examples: {
      book: 'Author, First Name. Title of Book. Place: Publisher, Year.',
      journal: 'Author, First Name. "Title of Article." Journal Name Volume, no. Issue (Year): Pages.',
      website: 'Author, First Name. "Title of Page." Website Name. Accessed Date. URL.',
      inText: 'Author, Title, Pages or (Author Year, Pages)',
    },
  },
  {
    slug: 'cse',
    name: 'CSE',
    fullName: 'Council of Science Editors',
    description: 'CSE style is used in biological and physical sciences. It offers name-year, citation-sequence, and citation-name systems.',
    keywords: [
      'CSE citation',
      'CSE format',
      'CSE style guide',
      'CSE referencing',
      'how to cite in CSE',
      'CSE citation generator',
    ],
    commonUses: [
      'Biology papers',
      'Physical sciences',
      'Scientific journals',
      'Life sciences',
    ],
    examples: {
      book: 'Author AA. Year. Title of Book. Place: Publisher.',
      journal: 'Author AA. Year. Title of article. Journal Name. Volume(Issue):Pages.',
      website: 'Author AA. Year. Title of page [Internet]. Website Name. [cited Date]. Available from: URL',
      inText: '(Author Year) or [1]',
    },
  },
  {
    slug: 'oscola',
    name: 'OSCOLA',
    fullName: 'Oxford Standard for Citation of Legal Authorities',
    description: 'OSCOLA is used for legal citations in UK and Commonwealth jurisdictions. It uses footnotes and emphasizes precision in legal references.',
    keywords: [
      'OSCOLA citation',
      'OSCOLA format',
      'OSCOLA style guide',
      'OSCOLA referencing',
      'how to cite in OSCOLA',
      'OSCOLA citation generator',
    ],
    commonUses: [
      'Legal papers',
      'Law journals',
      'UK law schools',
      'Commonwealth jurisdictions',
    ],
    examples: {
      book: 'Author, Title (Publisher, Year) Page.',
      journal: 'Author, "Title" (Year) Volume Journal Name Page.',
      website: 'Author, "Title" (Website Name, Date) <URL> accessed Date.',
      inText: 'Footnote format¹',
    },
  },
  {
    slug: 'mhra',
    name: 'MHRA',
    fullName: 'Modern Humanities Research Association',
    description: 'MHRA style is used in humanities, especially in UK universities. It uses footnotes and a bibliography.',
    keywords: [
      'MHRA citation',
      'MHRA format',
      'MHRA style guide',
      'MHRA referencing',
      'how to cite in MHRA',
      'MHRA citation generator',
    ],
    commonUses: [
      'Humanities papers',
      'UK universities',
      'Literature studies',
      'History research',
    ],
    examples: {
      book: 'Author, Title (Place: Publisher, Year), p. Page.',
      journal: 'Author, "Title", Journal Name, Volume (Year), Pages (p. Page).',
      website: 'Author, "Title", Website Name <URL> [accessed Date].',
      inText: 'Footnote format¹',
    },
  },
  {
    slug: 'bluebook',
    name: 'Bluebook',
    fullName: 'The Bluebook: A Uniform System of Citation',
    description: 'Bluebook is the standard legal citation system used by law schools, courts, and legal journals in the United States. It provides rules for citing cases, statutes, secondary sources, and more.',
    keywords: [
      'Bluebook citation',
      'Bluebook format',
      'Bluebook legal citation',
      'law review citation',
      'how to cite in Bluebook',
      'Bluebook citation generator',
    ],
    commonUses: [
      'Law review articles',
      'Legal briefs',
      'US court filings',
      'Law school papers',
    ],
    examples: {
      book: 'AUTHOR, TITLE Page (Publisher Year).',
      journal: 'Author, Title, Volume Journal Name Page (Year).',
      website: 'Author, Title, Website Name, URL (last visited Date).',
      inText: 'Footnote format¹',
    },
  },
  {
    slug: 'nlm',
    name: 'NLM',
    fullName: 'National Library of Medicine',
    description: 'NLM style is used by the National Library of Medicine and adopted by many biomedical journals. It is closely related to Vancouver style and uses numbered citations.',
    keywords: [
      'NLM citation',
      'NLM format',
      'NLM style guide',
      'National Library of Medicine citation',
      'how to cite in NLM',
      'NLM citation generator',
    ],
    commonUses: [
      'Biomedical journals',
      'Medical research',
      'Health sciences',
      'PubMed-indexed journals',
    ],
    examples: {
      book: 'Author AA. Title of Book. Place: Publisher; Year.',
      journal: 'Author AA. Title of article. Abbreviated Journal Name. Year;Volume(Issue):Pages.',
      website: 'Author AA. Title of page [Internet]. Website Name; Year [cited Date]. Available from: URL',
      inText: '[1] or superscript¹',
    },
  },
  {
    slug: 'apsa',
    name: 'APSA',
    fullName: 'American Political Science Association',
    description: 'APSA style is used in political science research and publications. It uses an author-date citation system similar to Chicago Author-Date.',
    keywords: [
      'APSA citation',
      'APSA format',
      'APSA style guide',
      'political science citation',
      'how to cite in APSA',
      'APSA citation generator',
    ],
    commonUses: [
      'Political science papers',
      'Public policy research',
      'International relations',
      'Government studies',
    ],
    examples: {
      book: 'Author, First Name. Year. Title of Book. Place: Publisher.',
      journal: 'Author, First Name. Year. "Title of Article." Journal Name Volume(Issue): Pages.',
      website: 'Author, First Name. Year. "Title of Page." Website Name. URL (accessed Date).',
      inText: '(Author Year) or (Author Year, Page)',
    },
  },
  {
    slug: 'asa',
    name: 'ASA',
    fullName: 'American Sociological Association',
    description: 'ASA style is used in sociology and related social science disciplines. It uses an author-date citation system and is based on the Chicago Manual of Style.',
    keywords: [
      'ASA citation',
      'ASA format',
      'ASA style guide',
      'sociology citation',
      'how to cite in ASA',
      'ASA citation generator',
    ],
    commonUses: [
      'Sociology papers',
      'Social science research',
      'Demographics research',
      'Criminology papers',
    ],
    examples: {
      book: 'Author, First Name. Year. Title of Book. Place: Publisher.',
      journal: 'Author, First Name. Year. "Title of Article." Journal Name Volume(Issue):Pages.',
      website: 'Author, First Name. Year. "Title of Page." Website Name. Retrieved Date (URL).',
      inText: '(Author Year) or (Author Year:Page)',
    },
  },
  {
    slug: 'aaa',
    name: 'AAA',
    fullName: 'American Anthropological Association',
    description: 'AAA style is used in anthropology and related disciplines. It is based on the Chicago Author-Date system and is used in American Anthropologist and other AAA publications.',
    keywords: [
      'AAA citation',
      'AAA format',
      'AAA style guide',
      'anthropology citation',
      'how to cite in AAA',
      'AAA citation generator',
    ],
    commonUses: [
      'Anthropology papers',
      'Cultural studies',
      'Ethnographic research',
      'Archaeology papers',
    ],
    examples: {
      book: 'Author, First Name. Year. Title of Book. Place: Publisher.',
      journal: 'Author, First Name. Year. "Title of Article." Journal Name Volume(Issue):Pages.',
      website: 'Author, First Name. Year. "Title of Page." Website Name. Accessed Date. URL.',
      inText: '(Author Year) or (Author Year:Page)',
    },
  },
  {
    slug: 'aglc',
    name: 'AGLC',
    fullName: 'Australian Guide to Legal Citation',
    description: 'AGLC is the standard legal citation guide for Australian law schools, courts, and legal journals. It uses a footnote-based citation system.',
    keywords: [
      'AGLC citation',
      'AGLC format',
      'AGLC style guide',
      'Australian legal citation',
      'how to cite in AGLC',
      'AGLC citation generator',
    ],
    commonUses: [
      'Australian law schools',
      'Australian court filings',
      'Law review articles',
      'Legal research papers',
    ],
    examples: {
      book: 'Author, Title (Publisher, Year) Page.',
      journal: 'Author, "Title" (Year) Volume Journal Name Page.',
      website: 'Author, "Title" (Date) Website Name <URL>.',
      inText: 'Footnote format¹',
    },
  },
];

export function getCitationStyleBySlug(slug: string): CitationStyle | undefined {
  return citationStyles.find(style => style.slug === slug);
}

export function getAllCitationStyleSlugs(): string[] {
  return citationStyles.map(style => style.slug);
}

