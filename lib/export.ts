import { Project } from '@/types';

// Helper to convert Lexical JSON to HTML
export function lexicalToHTML(content: string): string {
  if (!content) return '';
  
  try {
    // Simplified conversion - in production, use proper Lexical serialization
    JSON.parse(content);
    return '<p>' + content + '</p>';
  } catch {
    return '<p>' + content + '</p>';
  }
}

// Generate HTML document from project
export function generateProjectHTML(project: Project): string {
  const sections = project.sections
    .sort((a, b) => a.order - b.order)
    .map(section => {
      const content = lexicalToHTML(section.content);
      return `
        <section class="section">
          <h2>${section.title}</h2>
          ${content}
        </section>
      `;
    })
    .join('\n');

  const citations = project.citations
    .map((citation, index) => {
      return `<p class="citation">${index + 1}. ${citation.citationText}</p>`;
    })
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

// Generate simplified DOCX structure
export function generateDOCXHTML(project: Project): string {
  // This generates HTML that can be converted to DOCX
  // In production, use a library like docx or html-docx-js
  return generateProjectHTML(project);
}

