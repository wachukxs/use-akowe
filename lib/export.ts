import { Project } from '@/types';

// Citation style types
export type CitationStyle = 'apa' | 'mla' | 'chicago' | 'harvard' | 'ieee';

// Automatic detection functions
export function detectAcademicTemplate(projectType: string): AcademicTemplate {
  switch (projectType) {
    case 'thesis':
      return 'thesis';
    case 'journal':
      return 'conference-paper';
    case 'research':
      return 'research-paper';
    case 'essay':
      return 'research-paper';
    default:
      return 'research-paper';
  }
}

export function normalizeCitationStyle(storedStyle: string): CitationStyle {
  const styleMap: Record<string, CitationStyle> = {
    'APA': 'apa',
    'MLA': 'mla',
    'Chicago': 'chicago',
    'IEEE': 'ieee',
    'Harvard': 'harvard'
  };
  return styleMap[storedStyle] || 'apa';
}

export function detectExportSettings(project: Project): { template: AcademicTemplate; citationStyle: CitationStyle } {
  const template = detectAcademicTemplate(project.type);
  const citationStyle = normalizeCitationStyle(project.citationStyle);
  
  return { template, citationStyle };
}

// Helper to convert content to HTML (simplified for contentEditable)
export function contentToHTML(content: string): string {
  if (!content) return '';
  
  // Since we're using contentEditable, content is already HTML
  // Just ensure it's properly wrapped
  return content.trim();
}

// Format citations according to style
export function formatCitations(citations: any[], style: CitationStyle = 'apa'): string {
  return citations.map((citation, index) => {
    const { authors, title, journal, year, url, doi } = citation;
    
    switch (style) {
      case 'apa':
        return `${authors?.join(', ') || 'Unknown Author'} (${year || 'n.d.'}). ${title || 'Untitled'}. ${journal ? `*${journal}*` : ''}${doi ? ` https://doi.org/${doi}` : ''}${url ? ` Retrieved from ${url}` : ''}`;
      
      case 'mla':
        return `${authors?.join(', ') || 'Unknown Author'}. "${title || 'Untitled'}." ${journal ? `*${journal}*` : ''} ${year || 'n.d.'}${doi ? `, https://doi.org/${doi}` : ''}${url ? `. ${url}` : ''}`;
      
      case 'chicago':
        return `${authors?.join(', ') || 'Unknown Author'}. "${title || 'Untitled'}." ${journal ? `*${journal}*` : ''} ${year || 'n.d.'}${doi ? `, https://doi.org/${doi}` : ''}${url ? `. ${url}` : ''}`;
      
      case 'harvard':
        return `${authors?.join(', ') || 'Unknown Author'} ${year || 'n.d.'}, ${title || 'Untitled'}, ${journal ? `*${journal}*` : ''}${doi ? `, viewed ${new Date().toLocaleDateString()}, <https://doi.org/${doi}>` : ''}${url ? `, <${url}>` : ''}`;
      
      case 'ieee':
        return `[${index + 1}] ${authors?.join(', ') || 'Unknown Author'}, "${title || 'Untitled'}," ${journal ? `*${journal}*` : ''}, ${year || 'n.d.'}${doi ? `. doi: ${doi}` : ''}${url ? `. [Online]. Available: ${url}` : ''}`;
      
      default:
        return `${index + 1}. ${authors?.join(', ') || 'Unknown Author'} (${year || 'n.d.'}). ${title || 'Untitled'}`;
    }
  }).join('\n');
}

// Generate HTML document from project
export function generateProjectHTML(project: Project, citationStyle: CitationStyle = 'apa'): string {
  const sections = project.sections
    .sort((a, b) => a.order - b.order)
    .map(section => {
      const content = contentToHTML(section.content);
      return `
        <section class="section">
          <h2>${section.title}</h2>
          ${content}
        </section>
      `;
    })
    .join('\n');

  // Format citations according to style
  const formattedCitations = formatCitations(project.citations, citationStyle);
  const citations = formattedCitations
    .split('\n')
    .map(citation => `<p class="citation">${citation}</p>`)
    .join('\n');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${project.name}</title>
  <style>
    body {
      font-family: 'Times New Roman', Times, serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
      line-height: 1.6;
      color: #333;
    }
    h1 {
      text-align: center;
      font-size: 24px;
      margin-bottom: 40px;
    }
    h2 {
      font-size: 18px;
      margin-top: 30px;
      margin-bottom: 15px;
    }
    .section {
      margin-bottom: 30px;
    }
    .references {
      margin-top: 50px;
      page-break-before: always;
    }
    .citation {
      margin-left: 40px;
      text-indent: -40px;
      margin-bottom: 10px;
    }
    @media print {
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <h1>${project.name}</h1>
  
  ${sections}
  
  ${citations.length > 0 ? `
    <div class="references">
      <h2>References</h2>
      ${citations}
    </div>
  ` : ''}
</body>
</html>
  `;
}

// Academic paper templates
export type AcademicTemplate = 'research-paper' | 'thesis' | 'report' | 'conference-paper';

export function getAcademicTemplate(template: AcademicTemplate): { title: string; sections: string[] } {
  switch (template) {
    case 'research-paper':
      return {
        title: 'Research Paper',
        sections: ['Abstract', 'Introduction', 'Literature Review', 'Methodology', 'Results', 'Discussion', 'Conclusion', 'References']
      };
    case 'thesis':
      return {
        title: 'Thesis',
        sections: ['Abstract', 'Acknowledgments', 'Table of Contents', 'Introduction', 'Literature Review', 'Methodology', 'Results', 'Discussion', 'Conclusion', 'References', 'Appendices']
      };
    case 'report':
      return {
        title: 'Research Report',
        sections: ['Executive Summary', 'Introduction', 'Background', 'Methodology', 'Findings', 'Analysis', 'Recommendations', 'Conclusion', 'References']
      };
    case 'conference-paper':
      return {
        title: 'Conference Paper',
        sections: ['Abstract', 'Keywords', 'Introduction', 'Related Work', 'Methodology', 'Results', 'Discussion', 'Conclusion', 'References']
      };
    default:
      return {
        title: 'Academic Paper',
        sections: ['Introduction', 'Literature Review', 'Methodology', 'Results', 'Discussion', 'Conclusion', 'References']
      };
  }
}

// Generate HTML with academic template
export function generateAcademicHTML(project: Project, template: AcademicTemplate = 'research-paper', citationStyle: CitationStyle = 'apa'): string {
  const academicTemplate = getAcademicTemplate(template);
  
  // Add template-specific styling
  const templateStyles = `
    .academic-header {
      text-align: center;
      margin-bottom: 2rem;
      border-bottom: 2px solid #333;
      padding-bottom: 1rem;
    }
    .abstract {
      background-color: #f8f9fa;
      padding: 1rem;
      margin: 1rem 0;
      border-left: 4px solid #007bff;
    }
    .keywords {
      font-style: italic;
      margin: 1rem 0;
    }
    .acknowledgments {
      font-style: italic;
      margin: 2rem 0;
    }
  `;

  const sections = project.sections
    .sort((a, b) => a.order - b.order)
    .map(section => {
      const content = contentToHTML(section.content);
      const isAbstract = section.title.toLowerCase().includes('abstract');
      const isKeywords = section.title.toLowerCase().includes('keyword');
      const isAcknowledgments = section.title.toLowerCase().includes('acknowledgment');
      
      let sectionClass = 'section';
      if (isAbstract) sectionClass += ' abstract';
      if (isKeywords) sectionClass += ' keywords';
      if (isAcknowledgments) sectionClass += ' acknowledgments';
      
      return `
        <section class="${sectionClass}">
          <h2>${section.title}</h2>
          ${content}
        </section>
      `;
    })
    .join('\n');

  // Format citations according to style
  const formattedCitations = formatCitations(project.citations, citationStyle);
  const citations = formattedCitations
    .split('\n')
    .map(citation => `<p class="citation">${citation}</p>`)
    .join('\n');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${project.name} - ${academicTemplate.title}</title>
  <style>
    body {
      font-family: 'Times New Roman', Times, serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
      line-height: 1.6;
      color: #333;
    }
    h1 {
      text-align: center;
      font-size: 24px;
      margin-bottom: 40px;
    }
    h2 {
      font-size: 18px;
      margin-top: 30px;
      margin-bottom: 15px;
    }
    .section {
      margin-bottom: 30px;
    }
    .references {
      margin-top: 50px;
      page-break-before: always;
    }
    .citation {
      margin-left: 40px;
      text-indent: -40px;
      margin-bottom: 10px;
    }
    ${templateStyles}
    @media print {
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="academic-header">
    <h1>${project.name}</h1>
    <p>${academicTemplate.title}</p>
  </div>
  
  ${sections}
  
  ${citations.length > 0 ? `
    <div class="references">
      <h2>References</h2>
      ${citations}
    </div>
  ` : ''}
</body>
</html>
  `;
}

// Generate LaTeX document
export function generateLaTeX(project: Project, template: AcademicTemplate = 'research-paper', citationStyle: CitationStyle = 'apa'): string {
  getAcademicTemplate(template);
  
  // Convert HTML content to LaTeX
  const convertHTMLToLaTeX = (html: string): string => {
    return html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\\section{$1}')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\\subsection{$1}')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\\subsubsection{$1}')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '\\textbf{$1}')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '\\textit{$1}')
      .replace(/<ul[^>]*>(.*?)<\/ul>/gi, (match, content) => {
        const items = content.match(/<li[^>]*>(.*?)<\/li>/gi);
        if (items) {
          return '\\begin{itemize}\n' + items.map((item: string) => 
            '\\item ' + item.replace(/<li[^>]*>(.*?)<\/li>/i, '$1').trim()
          ).join('\n') + '\n\\end{itemize}';
        }
        return match;
      })
      .replace(/<ol[^>]*>(.*?)<\/ol>/gi, (match, content) => {
        const items = content.match(/<li[^>]*>(.*?)<\/li>/gi);
        if (items) {
          return '\\begin{enumerate}\n' + items.map((item: string) => 
            '\\item ' + item.replace(/<li[^>]*>(.*?)<\/li>/i, '$1').trim()
          ).join('\n') + '\n\\end{enumerate}';
        }
        return match;
      })
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '\\item $1')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<br\s*\/?>/gi, '\\\\')
      .replace(/<[^>]*>/g, '') // Remove remaining HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  };

  const sections = project.sections
    .sort((a, b) => a.order - b.order)
    .map(section => {
      const content = convertHTMLToLaTeX(section.content);
      return `\\section{${section.title}}\n\n${content}`;
    })
    .join('\n\n');

  // Format citations for LaTeX
  const formattedCitations = formatCitations(project.citations, citationStyle);
  const citations = formattedCitations
    .split('\n')
    .map(citation => `\\item ${citation}`)
    .join('\n');

  return `\\documentclass[12pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath}
\\usepackage{amsfonts}
\\usepackage{amssymb}
\\usepackage{graphicx}
\\usepackage{geometry}
\\usepackage{setspace}
\\usepackage{cite}
\\usepackage{url}

\\geometry{margin=1in}
\\doublespacing

\\title{${project.name}}
\\author{Your Name}
\\date{\\today}

\\begin{document}

\\maketitle

${sections}

\\bibliographystyle{${citationStyle === 'apa' ? 'apalike' : citationStyle === 'mla' ? 'mla' : 'plain'}}
\\begin{thebibliography}{99}
${citations}
\\end{thebibliography}

\\end{document}`;
}

// Generate simplified DOCX structure
export function generateDOCXHTML(project: Project): string {
  // This generates HTML that can be converted to DOCX
  // In production, use a library like docx or html-docx-js
  return generateProjectHTML(project);
}

