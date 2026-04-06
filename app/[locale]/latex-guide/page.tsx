import { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo/metadata';
import { Link } from '@/i18n/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { buildEducationalResourceLink } from '@/lib/external-links';

const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://useakowe.com';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const metadata = generateSEOMetadata({
    title: 'LaTeX Math Guide - Akowe',
    description: 'Complete guide to LaTeX mathematical notation for academic writing. Learn how to write mathematical equations, formulas, and symbols in your research papers and theses.',
    keywords: ['LaTeX', 'mathematical notation', 'academic writing', 'math equations', 'research paper', 'thesis writing', 'mathematical symbols', 'formula writing'],
    path: '/latex-guide',
  });
  if (locale !== 'en') {
    return { robots: { index: false, follow: false }, alternates: { canonical: metadata.alternates?.canonical } };
  }
  if (metadata.alternates) {
    metadata.alternates = { canonical: metadata.alternates.canonical };
  }
  return metadata;
}

export default function LaTeXGuide() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">LaTeX Math Guide</h1>
          <p className="text-lg text-gray-600">
            Complete reference for writing mathematical equations in LaTeX format
          </p>
        </div>

        {/* Quick Reference */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-900 mb-3">Quick Reference</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Fractions:</strong> <code>\frac&#123;num&#125;&#123;den&#125;</code>
            </div>
            <div>
              <strong>Powers:</strong> <code>x^2</code> or <code>x^&#123;power&#125;</code>
            </div>
            <div>
              <strong>Subscripts:</strong> <code>x_1</code> or <code>x_&#123;index&#125;</code>
            </div>
            <div>
              <strong>Square Root:</strong> <code>\sqrt&#123;x&#125;</code>
            </div>
            <div>
              <strong>Greek Letters:</strong> <code>\alpha, \beta, \gamma</code>
            </div>
            <div>
              <strong>Summation:</strong> <code>\sum_&#123;i=1&#125;^n</code>
            </div>
          </div>
        </div>

        {/* Basic Math */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Basic Mathematical Operations</h2>
          
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-3">Fractions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">\frac&#123;a&#125;&#123;b&#125;</code>
                  <div className="text-sm text-gray-600 mt-1">Simple fraction</div>
                </div>
                <div>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">\frac&#123;x^2 + 1&#125;&#123;x - 1&#125;</code>
                  <div className="text-sm text-gray-600 mt-1">Complex fraction</div>
                </div>
                <div>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">\frac&#123;\partial f&#125;&#123;\partial x&#125;</code>
                  <div className="text-sm text-gray-600 mt-1">Partial derivative</div>
                </div>
                <div>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">\frac&#123;d&#125;&#123;dx&#125;</code>
                  <div className="text-sm text-gray-600 mt-1">Derivative operator</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-3">Powers and Subscripts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">x^2</code>
                  <div className="text-sm text-gray-600 mt-1">Simple power</div>
                </div>
                <div>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">x^&#123;2n+1&#125;</code>
                  <div className="text-sm text-gray-600 mt-1">Complex power</div>
                </div>
                <div>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">x_1, x_2</code>
                  <div className="text-sm text-gray-600 mt-1">Simple subscripts</div>
                </div>
                <div>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">x_&#123;i+1&#125;</code>
                  <div className="text-sm text-gray-600 mt-1">Complex subscript</div>
                </div>
                <div>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">x_i^2</code>
                  <div className="text-sm text-gray-600 mt-1">Both power and subscript</div>
                </div>
                <div>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">x_&#123;i+1&#125;^&#123;2n&#125;</code>
                  <div className="text-sm text-gray-600 mt-1">Complex both</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-3">Roots and Radicals</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">\sqrt&#123;x&#125;</code>
                  <div className="text-sm text-gray-600 mt-1">Square root</div>
                </div>
                <div>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">\sqrt&#123;n&#125;&#123;x&#125;</code>
                  <div className="text-sm text-gray-600 mt-1">nth root</div>
                </div>
                <div>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">\sqrt&#123;x^2 + y^2&#125;</code>
                  <div className="text-sm text-gray-600 mt-1">Complex expression</div>
                </div>
                <div>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">\sqrt&#123;3&#125;&#123;x^3 + 1&#125;</code>
                  <div className="text-sm text-gray-600 mt-1">Cubic root</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Greek Letters */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Greek Letters</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'Alpha', code: '\\alpha' },
                { name: 'Beta', code: '\\beta' },
                { name: 'Gamma', code: '\\gamma' },
                { name: 'Delta', code: '\\delta' },
                { name: 'Epsilon', code: '\\epsilon' },
                { name: 'Zeta', code: '\\zeta' },
                { name: 'Eta', code: '\\eta' },
                { name: 'Theta', code: '\\theta' },
                { name: 'Iota', code: '\\iota' },
                { name: 'Kappa', code: '\\kappa' },
                { name: 'Lambda', code: '\\lambda' },
                { name: 'Mu', code: '\\mu' },
                { name: 'Nu', code: '\\nu' },
                { name: 'Xi', code: '\\xi' },
                { name: 'Omicron', code: '\\omicron' },
                { name: 'Pi', code: '\\pi' },
                { name: 'Rho', code: '\\rho' },
                { name: 'Sigma', code: '\\sigma' },
                { name: 'Tau', code: '\\tau' },
                { name: 'Upsilon', code: '\\upsilon' },
                { name: 'Phi', code: '\\phi' },
                { name: 'Chi', code: '\\chi' },
                { name: 'Psi', code: '\\psi' },
                { name: 'Omega', code: '\\omega' }
              ].map((letter) => (
                <div key={letter.name} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{letter.name}</span>
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs">{letter.code}</code>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Common Equations */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Common Equations</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="space-y-4">
              {[
                { name: 'Quadratic Formula', code: 'x = \\frac&#123;-b \\pm \\sqrt&#123;b^2 - 4ac&#125;&#125;&#123;2a&#125;' },
                { name: 'Pythagorean Theorem', code: 'a^2 + b^2 = c^2' },
                { name: 'Einstein Mass-Energy', code: 'E = mc^2' },
                { name: 'Newton\'s Second Law', code: 'F = ma' },
                { name: 'Area of Circle', code: 'A = \\pi r^2' },
                { name: 'Volume of Sphere', code: 'V = \\frac&#123;4&#125;&#123;3&#125;\\pi r^3' },
                { name: 'Derivative Definition', code: 'f\'(x) = \\lim_&#123;h \\to 0&#125; \\frac&#123;f(x+h) - f(x)&#125;&#123;h&#125;' },
                { name: 'Binomial Theorem', code: '(a+b)^n = \\sum_&#123;k=0&#125;^&#123;n&#125; \\binom&#123;n&#125;&#123;k&#125; a^&#123;n-k&#125;b^k' },
                { name: 'Euler\'s Identity', code: 'e^&#123;i\\pi&#125; + 1 = 0' }
              ].map((eq) => (
                <div key={eq.name} className="border-b border-gray-100 pb-3 last:border-b-0">
                  <div className="font-medium text-sm text-gray-700 mb-1">{eq.name}</div>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">{eq.code}</code>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tips */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Tips and Best Practices</h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 font-bold">•</span>
                <span>Use curly braces <code className="bg-yellow-100 px-1 rounded">&#123;&#125;</code> to group expressions: <code className="bg-yellow-100 px-1 rounded">x^&#123;2n+1&#125;</code></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 font-bold">•</span>
                <span>Escape backslashes in strings: <code className="bg-yellow-100 px-1 rounded">\\frac</code> instead of <code className="bg-yellow-100 px-1 rounded">\frac</code></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 font-bold">•</span>
                <span>Use <code className="bg-yellow-100 px-1 rounded">\left(</code> and <code className="bg-yellow-100 px-1 rounded">\right)</code> for auto-sizing parentheses</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 font-bold">•</span>
                <span>For inline math, use single <code className="bg-yellow-100 px-1 rounded">$</code> symbols: <code className="bg-yellow-100 px-1 rounded">$x^2$</code></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-600 font-bold">•</span>
                <span>For display math, use double <code className="bg-yellow-100 px-1 rounded">$$</code> symbols: <code className="bg-yellow-100 px-1 rounded">$$x^2 + y^2 = z^2$$</code></span>
              </li>
            </ul>
          </div>
        </section>

        {/* External Resources */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">External Resources</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="space-y-3">
              <a 
                href={buildEducationalResourceLink('https://katex.org/docs/supported.html', 'KaTeX Supported Functions')}
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
              >
                <ExternalLink className="h-4 w-4" />
                KaTeX Supported Functions
              </a>
              <a 
                href={buildEducationalResourceLink('https://www.overleaf.com/learn/latex/Mathematical_expressions', 'Overleaf LaTeX Math Guide')}
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
              >
                <ExternalLink className="h-4 w-4" />
                Overleaf LaTeX Math Guide
              </a>
              <a 
                href={buildEducationalResourceLink('https://en.wikibooks.org/wiki/LaTeX/Mathematics', 'LaTeX Mathematics Wikibook')}
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
              >
                <ExternalLink className="h-4 w-4" />
                LaTeX Mathematics Wikibook
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}