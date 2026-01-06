// Citation source type data for highly programmatic SEO pages
// These target long-tail keywords like "how to cite a book in APA"

export interface CitationSource {
  sourceType: string; // book, website, journal, etc.
  citationStyle: string; // apa, mla, chicago, ieee
  title: string;
  description: string;
  keywords: string[];
  format: string;
  example: string;
  notes: string[];
}

export const citationSources: CitationSource[] = [
  // APA Book Citations
  {
    sourceType: 'book',
    citationStyle: 'apa',
    title: 'How to Cite a Book in APA: Format and Examples',
    description: 'Complete guide to citing books in APA 7th edition format. Includes examples for single authors, multiple authors, edited books, and e-books.',
    keywords: [
      'how to cite book in APA',
      'APA book citation',
      'cite book APA format',
      'APA 7th edition book citation',
      'book citation APA example',
    ],
    format: 'Author, A. A. (Year). Title of book. Publisher.',
    example: 'Smith, J. A. (2023). Research Methods in Psychology. Academic Press.',
    notes: [
      'Include the publisher name and location (city, state) for older editions',
      'For e-books, include [Kindle edition] or [PDF] in brackets',
      'Use & for multiple authors: (Smith & Jones, 2023)',
    ],
  },
  // APA Website Citations
  {
    sourceType: 'website',
    citationStyle: 'apa',
    title: 'How to Cite a Website in APA: Complete Guide with Examples',
    description: 'Learn how to cite websites in APA 7th edition format. Step-by-step guide with examples for different types of web sources.',
    keywords: [
      'how to cite website in APA',
      'APA website citation',
      'cite website APA format',
      'APA 7th edition website citation',
      'online source APA citation',
    ],
    format: 'Author, A. A. (Year, Month Day). Title of page. Site Name. URL',
    example: 'Johnson, M. (2024, January 15). Climate Change Research Findings. Science Daily. https://www.sciencedaily.com/example',
    notes: [
      'If no author, start with the page title',
      'If no date, use (n.d.) for "no date"',
      'Do not include "Retrieved from" in APA 7th edition',
      'Only include access date if content is likely to change',
    ],
  },
  // APA Journal Citations
  {
    sourceType: 'journal',
    citationStyle: 'apa',
    title: 'How to Cite a Journal Article in APA: Format and Examples',
    description: 'Complete guide to citing journal articles in APA 7th edition. Includes examples for print and online journals with DOIs.',
    keywords: [
      'how to cite journal article in APA',
      'APA journal citation',
      'cite journal APA format',
      'APA 7th edition journal citation',
      'journal article APA example',
    ],
    format: 'Author, A. A. (Year). Title of article. Journal Name, Volume(Issue), pages. https://doi.org/xx.xxx/yyyy',
    example: 'Brown, K. L., & Davis, R. M. (2023). Effects of Sleep on Memory. Journal of Cognitive Psychology, 45(3), 234-250. https://doi.org/10.1234/jcp.2023.45.3.234',
    notes: [
      'Always include DOI if available',
      'Use & for multiple authors',
      'Italicize journal name and volume number',
      'Do not italicize issue number (in parentheses)',
    ],
  },
  // MLA Book Citations
  {
    sourceType: 'book',
    citationStyle: 'mla',
    title: 'How to Cite a Book in MLA: Format and Examples',
    description: 'Complete guide to citing books in MLA 9th edition format. Includes examples for single authors, multiple authors, and edited books.',
    keywords: [
      'how to cite book in MLA',
      'MLA book citation',
      'cite book MLA format',
      'MLA 9th edition book citation',
      'book citation MLA example',
    ],
    format: 'Author, First Name. Title of Book. Publisher, Year.',
    example: 'Smith, John A. Research Methods in Psychology. Academic Press, 2023.',
    notes: [
      'Use full first name (not just initial)',
      'Italicize the book title',
      'Publisher name should be shortened when possible',
      'Include city of publication only for older works',
    ],
  },
  // MLA Website Citations
  {
    sourceType: 'website',
    citationStyle: 'mla',
    title: 'How to Cite a Website in MLA: Complete Guide with Examples',
    description: 'Learn how to cite websites in MLA 9th edition format. Step-by-step guide with examples for different types of web sources.',
    keywords: [
      'how to cite website in MLA',
      'MLA website citation',
      'cite website MLA format',
      'MLA 9th edition website citation',
      'online source MLA citation',
    ],
    format: 'Author, First Name. "Title of Page." Website Name, Day Month Year, URL.',
    example: 'Johnson, Mary. "Climate Change Research Findings." Science Daily, 15 Jan. 2024, www.sciencedaily.com/example.',
    notes: [
      'Use "n.d." if no date is available',
      'Include access date if content is likely to change',
      'Use shortened URLs if very long',
      'Omit http:// or https:// from URL',
    ],
  },
  // MLA Journal Citations
  {
    sourceType: 'journal',
    citationStyle: 'mla',
    title: 'How to Cite a Journal Article in MLA: Format and Examples',
    description: 'Complete guide to citing journal articles in MLA 9th edition. Includes examples for print and online journals.',
    keywords: [
      'how to cite journal article in MLA',
      'MLA journal citation',
      'cite journal MLA format',
      'MLA 9th edition journal citation',
      'journal article MLA example',
    ],
    format: 'Author, First Name. "Title of Article." Journal Name, vol. Volume, no. Issue, Year, pp. Pages.',
    example: 'Brown, Kevin L., and Robert M. Davis. "Effects of Sleep on Memory." Journal of Cognitive Psychology, vol. 45, no. 3, 2023, pp. 234-250.',
    notes: [
      'Use "and" (not &) for multiple authors',
      'Italicize journal name',
      'Use "pp." for page ranges',
      'For online journals, add URL or DOI at the end',
    ],
  },
  // Chicago Book Citations
  {
    sourceType: 'book',
    citationStyle: 'chicago',
    title: 'How to Cite a Book in Chicago Style: Format and Examples',
    description: 'Complete guide to citing books in Chicago 17th edition. Includes examples for Notes-Bibliography and Author-Date systems.',
    keywords: [
      'how to cite book in Chicago',
      'Chicago book citation',
      'cite book Chicago style',
      'Chicago 17th edition book citation',
      'book citation Chicago example',
    ],
    format: 'Author, First Name. Title of Book. Place: Publisher, Year.',
    example: 'Smith, John A. Research Methods in Psychology. New York: Academic Press, 2023.',
    notes: [
      'Notes-Bibliography: Use footnotes for in-text citations',
      'Author-Date: Use (Smith 2023) for in-text citations',
      'Include city of publication',
      'Publisher name can be shortened',
    ],
  },
  // Chicago Website Citations
  {
    sourceType: 'website',
    citationStyle: 'chicago',
    title: 'How to Cite a Website in Chicago Style: Complete Guide',
    description: 'Learn how to cite websites in Chicago 17th edition. Includes examples for Notes-Bibliography and Author-Date systems.',
    keywords: [
      'how to cite website in Chicago',
      'Chicago website citation',
      'cite website Chicago style',
      'Chicago 17th edition website citation',
      'online source Chicago citation',
    ],
    format: 'Author, First Name. "Title of Page." Website Name. Last modified Date. URL.',
    example: 'Johnson, Mary. "Climate Change Research Findings." Science Daily. Last modified January 15, 2024. https://www.sciencedaily.com/example.',
    notes: [
      'Include access date if no publication date',
      'Use "n.d." if no date available',
      'Notes-Bibliography uses footnotes',
      'Author-Date uses (Author Year) format',
    ],
  },
  // IEEE Book Citations
  {
    sourceType: 'book',
    citationStyle: 'ieee',
    title: 'How to Cite a Book in IEEE: Format and Examples',
    description: 'Complete guide to citing books in IEEE format. Includes examples and formatting rules for engineering and technology papers.',
    keywords: [
      'how to cite book in IEEE',
      'IEEE book citation',
      'cite book IEEE format',
      'IEEE citation format book',
      'book citation IEEE example',
    ],
    format: '[1] A. Author, Title of Book. Place: Publisher, Year.',
    example: '[1] J. A. Smith, Research Methods in Engineering. New York: Academic Press, 2023.',
    notes: [
      'Use numbered citations in square brackets',
      'Author initials come first, then last name',
      'Include place of publication',
      'Number citations sequentially as they appear',
    ],
  },
  // IEEE Journal Citations
  {
    sourceType: 'journal',
    citationStyle: 'ieee',
    title: 'How to Cite a Journal Article in IEEE: Format and Examples',
    description: 'Complete guide to citing journal articles in IEEE format. Includes examples for engineering and technology research papers.',
    keywords: [
      'how to cite journal article in IEEE',
      'IEEE journal citation',
      'cite journal IEEE format',
      'IEEE citation format journal',
      'journal article IEEE example',
    ],
    format: '[1] A. Author, "Title of Article," Journal Name, vol. Volume, no. Issue, pp. Pages, Year.',
    example: '[1] K. L. Brown and R. M. Davis, "Effects of Sleep on Memory," Journal of Cognitive Psychology, vol. 45, no. 3, pp. 234-250, 2023.',
    notes: [
      'Use numbered citations in square brackets',
      'Article title in quotation marks',
      'Journal name in italics',
      'Use "and" for multiple authors (not &)',
    ],
  },
  // Additional source types for massive scale - APA
  {
    sourceType: 'video',
    citationStyle: 'apa',
    title: 'How to Cite a Video in APA: YouTube, TED Talks, and More',
    description: 'Complete guide to citing videos in APA 7th edition. Includes examples for YouTube videos, TED talks, films, and online videos.',
    keywords: [
      'how to cite video in APA',
      'APA video citation',
      'how to cite YouTube video APA',
      'cite TED talk APA',
      'APA video format',
    ],
    format: 'Author, A. A. [Username]. (Year, Month Day). Title of video [Video]. Platform. URL',
    example: 'Smith, J. A. [ResearchMethods]. (2024, January 15). How to Write a Literature Review [Video]. YouTube. https://youtube.com/watch?v=example',
    notes: [
      'Include the uploader\'s real name if available, or username in brackets',
      'For YouTube, use [Video] after the title',
      'Include the platform name (YouTube, Vimeo, etc.)',
      'Always include the URL',
    ],
  },
  {
    sourceType: 'podcast',
    citationStyle: 'apa',
    title: 'How to Cite a Podcast in APA: Format and Examples',
    description: 'Learn how to cite podcasts in APA 7th edition format. Includes examples for podcast episodes and series.',
    keywords: [
      'how to cite podcast in APA',
      'APA podcast citation',
      'cite podcast episode APA',
      'APA podcast format',
      'podcast citation example',
    ],
    format: 'Host, A. A. (Host). (Year, Month Day). Episode title (No. episode number) [Audio podcast episode]. In Podcast Name. Publisher. URL',
    example: 'Smith, J. A. (Host). (2024, January 15). Research Methods Explained (No. 42) [Audio podcast episode]. Academic Insights. Academic Press. https://example.com/podcast',
    notes: [
      'List the host as the author',
      'Include episode number if available',
      'Specify [Audio podcast episode]',
      'Include URL if accessed online',
    ],
  },
  {
    sourceType: 'social-media',
    citationStyle: 'apa',
    title: 'How to Cite Social Media in APA: Twitter, Facebook, Instagram',
    description: 'Complete guide to citing social media posts in APA 7th edition. Includes examples for Twitter, Facebook, Instagram, and LinkedIn.',
    keywords: [
      'how to cite social media in APA',
      'APA Twitter citation',
      'cite Facebook post APA',
      'APA Instagram citation',
      'social media citation APA',
    ],
    format: 'Author, A. A. [@username]. (Year, Month Day). First 20 words of post [Post type]. Platform. URL',
    example: 'Smith, J. A. [@researchmethods]. (2024, January 15). New study shows interesting findings about academic writing [Tweet]. Twitter. https://twitter.com/example',
    notes: [
      'Include the first 20 words of the post',
      'Specify the post type: [Tweet], [Facebook status], [Instagram photo], etc.',
      'Include the platform name',
      'Always include the URL',
    ],
  },
  {
    sourceType: 'conference-paper',
    citationStyle: 'apa',
    title: 'How to Cite a Conference Paper in APA: Format and Examples',
    description: 'Complete guide to citing conference papers and proceedings in APA 7th edition format.',
    keywords: [
      'how to cite conference paper in APA',
      'APA conference citation',
      'cite conference proceeding APA',
      'APA conference paper format',
      'conference paper citation example',
    ],
    format: 'Author, A. A. (Year). Title of paper. In Editor, A. A. (Ed.), Conference Proceedings Title (pp. pages). Publisher.',
    example: 'Smith, J. A. (2023). New Methods in Academic Research. In Davis, R. M. (Ed.), Proceedings of the Academic Writing Conference (pp. 45-60). Academic Press.',
    notes: [
      'Include the editor of the proceedings',
      'Specify the conference name',
      'Include page numbers',
      'For online conferences, add URL or DOI',
    ],
  },
  {
    sourceType: 'dissertation',
    citationStyle: 'apa',
    title: 'How to Cite a Dissertation in APA: Format and Examples',
    description: 'Complete guide to citing dissertations and theses in APA 7th edition format.',
    keywords: [
      'how to cite dissertation in APA',
      'APA dissertation citation',
      'cite thesis APA',
      'APA thesis citation',
      'dissertation citation example',
    ],
    format: 'Author, A. A. (Year). Title of dissertation [Doctoral dissertation, University Name]. Database Name. URL',
    example: 'Smith, J. A. (2023). Effects of Sleep on Academic Performance [Doctoral dissertation, University of Example]. ProQuest Dissertations and Theses. https://example.com',
    notes: [
      'Specify [Doctoral dissertation] or [Master\'s thesis]',
      'Include the university name',
      'If from a database, include the database name',
      'Include URL or database accession number',
    ],
  },
  {
    sourceType: 'newspaper',
    citationStyle: 'apa',
    title: 'How to Cite a Newspaper Article in APA: Format and Examples',
    description: 'Learn how to cite newspaper articles in APA 7th edition format, both print and online.',
    keywords: [
      'how to cite newspaper in APA',
      'APA newspaper citation',
      'cite news article APA',
      'APA news citation',
      'newspaper article citation example',
    ],
    format: 'Author, A. A. (Year, Month Day). Article title. Newspaper Name, pages.',
    example: 'Smith, J. A. (2024, January 15). New Research on Academic Writing. The Academic Times, pp. A1, A4.',
    notes: [
      'Include the date of publication',
      'For online articles, add URL',
      'Use "pp." for page numbers',
      'If no author, start with the article title',
    ],
  },
  {
    sourceType: 'magazine',
    citationStyle: 'apa',
    title: 'How to Cite a Magazine Article in APA: Format and Examples',
    description: 'Complete guide to citing magazine articles in APA 7th edition format.',
    keywords: [
      'how to cite magazine in APA',
      'APA magazine citation',
      'cite magazine article APA',
      'magazine citation example',
    ],
    format: 'Author, A. A. (Year, Month Day). Article title. Magazine Name, Volume(Issue), pages.',
    example: 'Smith, J. A. (2024, January 15). The Future of Academic Writing. Research Monthly, 45(3), 12-18.',
    notes: [
      'Include the publication date',
      'Italicize the magazine name',
      'Include volume and issue numbers if available',
      'For online magazines, add URL',
    ],
  },
  {
    sourceType: 'report',
    citationStyle: 'apa',
    title: 'How to Cite a Report in APA: Format and Examples',
    description: 'Complete guide to citing reports in APA 7th edition format, including government and organizational reports.',
    keywords: [
      'how to cite report in APA',
      'APA report citation',
      'cite government report APA',
      'APA report format',
      'report citation example',
    ],
    format: 'Author, A. A. or Organization. (Year). Title of report (Report No. number). Publisher. URL',
    example: 'Smith, J. A. (2023). Annual Research Report (Report No. 2023-001). Academic Research Institute. https://example.com/report',
    notes: [
      'If author is an organization, use the organization name',
      'Include report number if available',
      'Include the publisher',
      'Always include URL for online reports',
    ],
  },
  {
    sourceType: 'blog-post',
    citationStyle: 'apa',
    title: 'How to Cite a Blog Post in APA: Format and Examples',
    description: 'Learn how to cite blog posts in APA 7th edition format.',
    keywords: [
      'how to cite blog post in APA',
      'APA blog citation',
      'cite blog APA',
      'blog post citation example',
    ],
    format: 'Author, A. A. (Year, Month Day). Title of blog post. Blog Name. URL',
    example: 'Smith, J. A. (2024, January 15). Tips for Academic Writing. Research Blog. https://example.com/blog/post',
    notes: [
      'Include the blog name',
      'Use the publication date',
      'Always include the URL',
      'If no author, start with the blog post title',
    ],
  },
  {
    sourceType: 'online-article',
    citationStyle: 'apa',
    title: 'How to Cite an Online Article in APA: Format and Examples',
    description: 'Complete guide to citing online articles in APA 7th edition format.',
    keywords: [
      'how to cite online article in APA',
      'APA online article citation',
      'cite web article APA',
      'online article citation example',
    ],
    format: 'Author, A. A. (Year, Month Day). Article title. Site Name. URL',
    example: 'Smith, J. A. (2024, January 15). New Findings in Research Methods. Science Daily. https://example.com/article',
    notes: [
      'Include the site or publication name',
      'Use the publication date',
      'Always include the URL',
      'If no date, use (n.d.)',
    ],
  },
  // MLA Additional Sources
  {
    sourceType: 'video',
    citationStyle: 'mla',
    title: 'How to Cite a Video in MLA: YouTube, TED Talks, and More',
    description: 'Complete guide to citing videos in MLA 9th edition. Includes examples for YouTube, TED talks, and films.',
    keywords: [
      'how to cite video in MLA',
      'MLA video citation',
      'how to cite YouTube video MLA',
      'cite TED talk MLA',
      'MLA video format',
    ],
    format: '"Title of Video." Platform, uploaded by Username, Day Month Year, URL.',
    example: '"How to Write a Literature Review." YouTube, uploaded by ResearchMethods, 15 Jan. 2024, www.youtube.com/watch?v=example.',
    notes: [
      'Use quotation marks for video title',
      'Include the platform name',
      'Include uploader username',
      'Always include the URL',
    ],
  },
  {
    sourceType: 'podcast',
    citationStyle: 'mla',
    title: 'How to Cite a Podcast in MLA: Format and Examples',
    description: 'Learn how to cite podcasts in MLA 9th edition format.',
    keywords: [
      'how to cite podcast in MLA',
      'MLA podcast citation',
      'cite podcast episode MLA',
      'MLA podcast format',
    ],
    format: 'Host, First Name. "Episode Title." Podcast Name, season Season, episode Episode, Publisher, Day Month Year, URL.',
    example: 'Smith, John. "Research Methods Explained." Academic Insights, season 2, episode 42, Academic Press, 15 Jan. 2024, www.example.com/podcast.',
    notes: [
      'List the host as author',
      'Include season and episode numbers if available',
      'Include the publisher',
      'Add URL if accessed online',
    ],
  },
  {
    sourceType: 'social-media',
    citationStyle: 'mla',
    title: 'How to Cite Social Media in MLA: Twitter, Facebook, Instagram',
    description: 'Complete guide to citing social media posts in MLA 9th edition.',
    keywords: [
      'how to cite social media in MLA',
      'MLA Twitter citation',
      'cite Facebook post MLA',
      'MLA Instagram citation',
    ],
    format: 'Author, First Name [@username]. "First portion of post." Platform, Day Month Year, Time, URL.',
    example: 'Smith, John [@researchmethods]. "New study shows interesting findings about academic writing." Twitter, 15 Jan. 2024, 10:30 a.m., twitter.com/example.',
    notes: [
      'Include the username in brackets',
      'Use the first portion of the post in quotation marks',
      'Include the platform name',
      'Include timestamp if available',
    ],
  },
  {
    sourceType: 'conference-paper',
    citationStyle: 'mla',
    title: 'How to Cite a Conference Paper in MLA: Format and Examples',
    description: 'Complete guide to citing conference papers in MLA 9th edition.',
    keywords: [
      'how to cite conference paper in MLA',
      'MLA conference citation',
      'cite conference proceeding MLA',
      'MLA conference paper format',
    ],
    format: 'Author, First Name. "Title of Paper." Conference Proceedings Title, edited by Editor Name, Publisher, Year, pp. Pages.',
    example: 'Smith, John. "New Methods in Academic Research." Proceedings of the Academic Writing Conference, edited by Robert Davis, Academic Press, 2023, pp. 45-60.',
    notes: [
      'Include the editor of proceedings',
      'Specify the conference name',
      'Include page numbers with "pp."',
      'For online, add URL at the end',
    ],
  },
  {
    sourceType: 'dissertation',
    citationStyle: 'mla',
    title: 'How to Cite a Dissertation in MLA: Format and Examples',
    description: 'Complete guide to citing dissertations in MLA 9th edition.',
    keywords: [
      'how to cite dissertation in MLA',
      'MLA dissertation citation',
      'cite thesis MLA',
      'MLA thesis citation',
    ],
    format: 'Author, First Name. Title of Dissertation. Year. University Name, PhD dissertation. Database Name, URL.',
    example: 'Smith, John. Effects of Sleep on Academic Performance. 2023. University of Example, PhD dissertation. ProQuest, www.proquest.com/example.',
    notes: [
      'Specify PhD dissertation or Master\'s thesis',
      'Include the university name',
      'Include database name if applicable',
      'Add URL for online access',
    ],
  },
  {
    sourceType: 'newspaper',
    citationStyle: 'mla',
    title: 'How to Cite a Newspaper Article in MLA: Format and Examples',
    description: 'Learn how to cite newspaper articles in MLA 9th edition.',
    keywords: [
      'how to cite newspaper in MLA',
      'MLA newspaper citation',
      'cite news article MLA',
      'MLA news citation',
    ],
    format: 'Author, First Name. "Article Title." Newspaper Name, Day Month Year, pp. Pages.',
    example: 'Smith, John. "New Research on Academic Writing." The Academic Times, 15 Jan. 2024, pp. A1, A4.',
    notes: [
      'Include the publication date',
      'Use "pp." for page numbers',
      'For online articles, add URL',
      'If no author, start with article title',
    ],
  },
  {
    sourceType: 'magazine',
    citationStyle: 'mla',
    title: 'How to Cite a Magazine Article in MLA: Format and Examples',
    description: 'Complete guide to citing magazine articles in MLA 9th edition.',
    keywords: [
      'how to cite magazine in MLA',
      'MLA magazine citation',
      'cite magazine article MLA',
    ],
    format: 'Author, First Name. "Article Title." Magazine Name, Day Month Year, pp. Pages.',
    example: 'Smith, John. "The Future of Academic Writing." Research Monthly, 15 Jan. 2024, pp. 12-18.',
    notes: [
      'Include the publication date',
      'Italicize the magazine name',
      'Use "pp." for page numbers',
      'For online, add URL',
    ],
  },
  {
    sourceType: 'report',
    citationStyle: 'mla',
    title: 'How to Cite a Report in MLA: Format and Examples',
    description: 'Complete guide to citing reports in MLA 9th edition.',
    keywords: [
      'how to cite report in MLA',
      'MLA report citation',
      'cite government report MLA',
      'MLA report format',
    ],
    format: 'Author or Organization. "Report Title." Publisher, Day Month Year, URL.',
    example: 'Smith, John. "Annual Research Report." Academic Research Institute, 15 Jan. 2024, www.example.com/report.',
    notes: [
      'If organization is author, use organization name',
      'Include the publisher',
      'Include publication date',
      'Add URL for online reports',
    ],
  },
  {
    sourceType: 'blog-post',
    citationStyle: 'mla',
    title: 'How to Cite a Blog Post in MLA: Format and Examples',
    description: 'Learn how to cite blog posts in MLA 9th edition.',
    keywords: [
      'how to cite blog post in MLA',
      'MLA blog citation',
      'cite blog MLA',
    ],
    format: 'Author, First Name. "Post Title." Blog Name, Day Month Year, URL.',
    example: 'Smith, John. "Tips for Academic Writing." Research Blog, 15 Jan. 2024, www.example.com/blog/post.',
    notes: [
      'Include the blog name',
      'Use publication date',
      'Always include URL',
      'If no author, start with post title',
    ],
  },
  {
    sourceType: 'online-article',
    citationStyle: 'mla',
    title: 'How to Cite an Online Article in MLA: Format and Examples',
    description: 'Complete guide to citing online articles in MLA 9th edition.',
    keywords: [
      'how to cite online article in MLA',
      'MLA online article citation',
      'cite web article MLA',
    ],
    format: 'Author, First Name. "Article Title." Site Name, Day Month Year, URL.',
    example: 'Smith, John. "New Findings in Research Methods." Science Daily, 15 Jan. 2024, www.example.com/article.',
    notes: [
      'Include the site name',
      'Use publication date',
      'Always include URL',
      'If no date, use "n.d."',
    ],
  },
  // Chicago Additional Sources
  {
    sourceType: 'video',
    citationStyle: 'chicago',
    title: 'How to Cite a Video in Chicago Style: YouTube, TED Talks, and More',
    description: 'Complete guide to citing videos in Chicago 17th edition.',
    keywords: [
      'how to cite video in Chicago',
      'Chicago video citation',
      'how to cite YouTube video Chicago',
      'cite TED talk Chicago',
    ],
    format: 'Author, First Name. "Title of Video." Platform, Month Day, Year. URL.',
    example: 'Smith, John. "How to Write a Literature Review." YouTube, January 15, 2024. https://youtube.com/watch?v=example.',
    notes: [
      'Include the platform name',
      'Use full date format',
      'Always include URL',
      'Notes-Bibliography uses footnotes',
    ],
  },
  {
    sourceType: 'podcast',
    citationStyle: 'chicago',
    title: 'How to Cite a Podcast in Chicago Style: Format and Examples',
    description: 'Learn how to cite podcasts in Chicago 17th edition.',
    keywords: [
      'how to cite podcast in Chicago',
      'Chicago podcast citation',
      'cite podcast episode Chicago',
    ],
    format: 'Host, First Name. "Episode Title." Podcast Name. Publisher, Month Day, Year. URL.',
    example: 'Smith, John. "Research Methods Explained." Academic Insights. Academic Press, January 15, 2024. https://example.com/podcast.',
    notes: [
      'List host as author',
      'Include publisher',
      'Use full date format',
      'Add URL for online access',
    ],
  },
  {
    sourceType: 'conference-paper',
    citationStyle: 'chicago',
    title: 'How to Cite a Conference Paper in Chicago Style: Format and Examples',
    description: 'Complete guide to citing conference papers in Chicago 17th edition.',
    keywords: [
      'how to cite conference paper in Chicago',
      'Chicago conference citation',
      'cite conference proceeding Chicago',
    ],
    format: 'Author, First Name. "Title of Paper." In Conference Proceedings Title, edited by Editor Name, pages. Place: Publisher, Year.',
    example: 'Smith, John. "New Methods in Academic Research." In Proceedings of the Academic Writing Conference, edited by Robert Davis, 45-60. New York: Academic Press, 2023.',
    notes: [
      'Include editor of proceedings',
      'Specify conference name',
      'Include place and publisher',
      'Notes-Bibliography uses footnotes',
    ],
  },
  {
    sourceType: 'dissertation',
    citationStyle: 'chicago',
    title: 'How to Cite a Dissertation in Chicago Style: Format and Examples',
    description: 'Complete guide to citing dissertations in Chicago 17th edition.',
    keywords: [
      'how to cite dissertation in Chicago',
      'Chicago dissertation citation',
      'cite thesis Chicago',
    ],
    format: 'Author, First Name. "Title of Dissertation." PhD diss., University Name, Year. Database Name. URL.',
    example: 'Smith, John. "Effects of Sleep on Academic Performance." PhD diss., University of Example, 2023. ProQuest. https://example.com.',
    notes: [
      'Specify PhD diss. or Master\'s thesis',
      'Include university name',
      'Include database if applicable',
      'Add URL for online access',
    ],
  },
  {
    sourceType: 'newspaper',
    citationStyle: 'chicago',
    title: 'How to Cite a Newspaper Article in Chicago Style: Format and Examples',
    description: 'Learn how to cite newspaper articles in Chicago 17th edition.',
    keywords: [
      'how to cite newspaper in Chicago',
      'Chicago newspaper citation',
      'cite news article Chicago',
    ],
    format: 'Author, First Name. "Article Title." Newspaper Name, Month Day, Year.',
    example: 'Smith, John. "New Research on Academic Writing." The Academic Times, January 15, 2024.',
    notes: [
      'Include publication date',
      'For online, add URL',
      'If no author, start with article title',
      'Notes-Bibliography uses footnotes',
    ],
  },
  {
    sourceType: 'magazine',
    citationStyle: 'chicago',
    title: 'How to Cite a Magazine Article in Chicago Style: Format and Examples',
    description: 'Complete guide to citing magazine articles in Chicago 17th edition.',
    keywords: [
      'how to cite magazine in Chicago',
      'Chicago magazine citation',
      'cite magazine article Chicago',
    ],
    format: 'Author, First Name. "Article Title." Magazine Name, Month Day, Year, pages.',
    example: 'Smith, John. "The Future of Academic Writing." Research Monthly, January 15, 2024, 12-18.',
    notes: [
      'Include publication date',
      'Italicize magazine name',
      'Include page numbers',
      'For online, add URL',
    ],
  },
  // IEEE Additional Sources (engineering-focused)
  {
    sourceType: 'conference-paper',
    citationStyle: 'ieee',
    title: 'How to Cite a Conference Paper in IEEE: Format and Examples',
    description: 'Complete guide to citing conference papers in IEEE format for engineering and technology research.',
    keywords: [
      'how to cite conference paper in IEEE',
      'IEEE conference citation',
      'cite conference proceeding IEEE',
      'IEEE conference paper format',
    ],
    format: '[1] A. Author, "Title of Paper," in Conf. Name, Place, Year, pp. Pages.',
    example: '[1] J. A. Smith, "New Methods in Academic Research," in Proc. Academic Writing Conf., New York, USA, 2023, pp. 45-60.',
    notes: [
      'Use numbered citations in square brackets',
      'Include conference abbreviation',
      'Include location and year',
      'Use "pp." for page numbers',
    ],
  },
  {
    sourceType: 'dissertation',
    citationStyle: 'ieee',
    title: 'How to Cite a Dissertation in IEEE: Format and Examples',
    description: 'Complete guide to citing dissertations in IEEE format.',
    keywords: [
      'how to cite dissertation in IEEE',
      'IEEE dissertation citation',
      'cite thesis IEEE',
      'IEEE thesis citation',
    ],
    format: '[1] A. Author, "Title of Dissertation," Ph.D. dissertation, University Name, Place, Year.',
    example: '[1] J. A. Smith, "Effects of Sleep on Academic Performance," Ph.D. dissertation, University of Example, New York, USA, 2023.',
    notes: [
      'Specify Ph.D. dissertation or M.S. thesis',
      'Include university name and location',
      'Use numbered citations',
      'Number sequentially as they appear',
    ],
  },
  {
    sourceType: 'report',
    citationStyle: 'ieee',
    title: 'How to Cite a Report in IEEE: Format and Examples',
    description: 'Complete guide to citing reports in IEEE format.',
    keywords: [
      'how to cite report in IEEE',
      'IEEE report citation',
      'cite technical report IEEE',
      'IEEE report format',
    ],
    format: '[1] A. Author, "Report Title," Organization, Place, Tech. Rep. Number, Year.',
    example: '[1] J. A. Smith, "Annual Research Report," Academic Research Institute, New York, USA, Tech. Rep. 2023-001, 2023.',
    notes: [
      'Include organization name',
      'Include report number',
      'Specify Tech. Rep.',
      'Use numbered citations',
    ],
  },
];

export function getCitationSourceByTypeAndStyle(
  sourceType: string,
  citationStyle: string
): CitationSource | undefined {
  // Check manual sources first, then generated
  return getAllCitationSources().find(
    (source) => source.sourceType === sourceType && source.citationStyle === citationStyle
  );
}

export function getAllCitationSourceCombinations(): Array<{ sourceType: string; citationStyle: string }> {
  return citationSources.map((source) => ({
    sourceType: source.sourceType,
    citationStyle: source.citationStyle,
  }));
}

// Lazy load generated sources to avoid circular dependencies
let allCitationSourcesCache: CitationSource[] | null = null;

export function getAllCitationSources(): CitationSource[] {
  if (allCitationSourcesCache) {
    return allCitationSourcesCache;
  }

  // Dynamic import to avoid circular dependency
  const { generateAllCitationSources } = require('./citation-source-generator');
  const generatedSources = generateAllCitationSources();

  // Combine manual + generated, removing duplicates (manual takes precedence)
  allCitationSourcesCache = [
    ...citationSources,
    ...generatedSources.filter((gen: CitationSource) => {
      return !citationSources.some(
        (manual) => manual.sourceType === gen.sourceType && manual.citationStyle === gen.citationStyle
      );
    }),
  ];

  return allCitationSourcesCache;
}

// Updated function to use all sources (scaled)
export function getAllCitationSourceCombinationsScaled(): Array<{ sourceType: string; citationStyle: string }> {
  return getAllCitationSources().map((source) => ({
    sourceType: source.sourceType,
    citationStyle: source.citationStyle,
  }));
}

