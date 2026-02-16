'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target, 
  Zap,
  BookOpen,
  Shield,
  FileText,
  CheckCircle,
  Download,
  BarChart3,
  Globe,
  Rocket,
  Award,
  Brain,
  Layers,
  Presentation
} from 'lucide-react';
import Button from '@/components/ui/Button';

interface SlideProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

function Slide({ children, className = '', id }: SlideProps & { id?: string }) {
  return (
    <div id={id} className={`slide min-h-screen flex flex-col justify-center p-8 sm:p-12 lg:p-16 ${className}`}>
      {children}
    </div>
  );
}

function MetricCard({ 
  label, 
  value, 
  subtitle, 
  icon 
}: { 
  label: string; 
  value: string | number; 
  subtitle?: string; 
  icon?: React.ReactNode;
}) {
  return (
    <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg">
      <div className="flex items-center gap-3 mb-3">
        {icon && <span className="text-[hsl(var(--primary))]">{icon}</span>}
        <span className="text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
          {label}
        </span>
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      {subtitle && (
        <div className="text-xs text-[hsl(var(--muted-foreground))]">{subtitle}</div>
      )}
    </div>
  );
}

type PublicMetrics = {
  users: {
    total: number;
    newInPeriod: number;
    newLast7Days: number;
    wau: number;
    wauChange: number;
  };
  projects: {
    total: number;
    createdInPeriod: number;
    avgProjectsPerUser: number;
  };
  usage: {
    totalAIWords: number;
    totalPlagiarismChecks: number;
    aiWordsInPeriod: number;
    plagiarismChecksInPeriod: number;
    citationAdoption: number;
    plagiarismAdoption: number;
  };
  productHealth: {
    activeUsers: number;
    powerUsers: number;
    consistentUsers: number;
  };
  revenue: {
    totalRevenue: number;
    monthlyRecurringRevenue: number;
    annualRecurringRevenue: number;
    activeSubscriptions: number;
  };
  error?: string;
};

const DEFAULT_METRICS: PublicMetrics = {
  users: {
    total: 786,
    newInPeriod: 786,
    newLast7Days: 133,
    wau: 78,
    wauChange: 0,
  },
  projects: {
    total: 623,
    createdInPeriod: 623,
    avgProjectsPerUser: 1.3,
  },
  usage: {
    totalAIWords: 148290,
    totalPlagiarismChecks: 430,
    aiWordsInPeriod: 144000,
    plagiarismChecksInPeriod: 410,
    citationAdoption: 39.4,
    plagiarismAdoption: 37.4,
  },
  productHealth: {
    activeUsers: 406,
    powerUsers: 0,
    consistentUsers: 0,
  },
  revenue: {
    totalRevenue: 11600,
    monthlyRecurringRevenue: 11600,
    annualRecurringRevenue: 0,
    activeSubscriptions: 4,
  },
};

function InvestorPageContent() {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [metrics, setMetrics] = useState<PublicMetrics | null>(null);
  const searchParams = useSearchParams();
  const isPDFMode = searchParams?.get('pdf') === 'true';

  // Hide download button in PDF mode and set PDF class for styling
  useEffect(() => {
    if (isPDFMode) {
      // Add class to body and html for PDF-specific styling
      document.body.classList.add('pdf-mode');
      document.documentElement.classList.add('pdf-mode');
    } else {
      document.body.classList.remove('pdf-mode');
      document.documentElement.classList.remove('pdf-mode');
    }
  }, [isPDFMode]);

  // Fetch public metrics for the traction slide; fall back to defaults if anything fails.
  useEffect(() => {
    let isMounted = true;

    const loadMetrics = async () => {
      try {
        const res = await fetch('/api/investor/metrics', {
          method: 'GET',
          credentials: 'omit',
        });

        if (!res.ok) {
          throw new Error('Failed to load metrics');
        }

        const data = (await res.json()) as PublicMetrics;
        if (isMounted && !data.error) {
          setMetrics(data);
        } else if (isMounted) {
          setMetrics(DEFAULT_METRICS);
        }
      } catch (error) {
        console.error('Error loading public investor metrics:', error);
        if (isMounted) {
          setMetrics(DEFAULT_METRICS);
        }
      }
    };

    loadMetrics();

    return () => {
      isMounted = false;
    };
  }, [isPDFMode]);

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const response = await fetch('/api/investor/export-pdf', {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'akowe-investor-pitch-deck.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <>
      <style jsx global>{`
        @media print {
          .slide {
            page-break-after: always;
            page-break-inside: avoid;
          }
          .slide:last-child {
            page-break-after: auto;
          }
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        html {
          scroll-behavior: smooth;
        }
        .touch-manipulation {
          touch-action: manipulation;
        }
        /* Reduce heading font sizes in PDF mode */
        .pdf-mode h1 {
          font-size: 50% !important;
        }
        .pdf-mode h2 {
          font-size: 50% !important;
        }
        .pdf-mode h3 {
          font-size: 50% !important;
        }
        .pdf-mode h4 {
          font-size: 50% !important;
        }
        .pdf-mode h5 {
          font-size: 50% !important;
        }
        .pdf-mode h6 {
          font-size: 50% !important;
        }
      `}</style>
      <div className={`min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] ${isPDFMode ? 'pdf-mode' : ''}`}>
      {/* Floating Download Button - Hidden in PDF mode */}
      {!isPDFMode && (
        <div className="fixed top-14 sm:top-20 right-2 sm:right-6 z-50">
          <Button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="px-3 sm:px-6 py-2 sm:py-3 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
          >
            <Download size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span className="hidden sm:inline">{isGeneratingPDF ? 'Generating...' : 'Download PDF'}</span>
            <span className="sm:hidden">{isGeneratingPDF ? '...' : 'PDF'}</span>
          </Button>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Slide 1: Cover */}
        <Slide id="cover">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold uppercase tracking-[0.08em]">
                Akọ̀wé
              </h1>
              <p className="text-xl sm:text-2xl uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))]">
                Write research that holds up
              </p>
            </div>
            <div className="pt-8">
              <h2 className="text-3xl sm:text-4xl font-bold uppercase tracking-[0.16em] mb-4">
                Investor Pitch Deck
              </h2>
              <p className="text-lg uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                December 2025
              </p>
            </div>
          </div>
        </Slide>

        {/* Slide 2: Problem */}
        <Slide id="problem">
          <div className="space-y-8">
            <div className="flex items-center gap-4 mb-8">
              <Target className="text-[hsl(var(--primary))]" size={32} />
              <h2 className="text-4xl sm:text-5xl font-bold uppercase tracking-[0.12em]">
                The Problem
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg">
                <h3 className="text-xl font-bold uppercase tracking-[0.16em] mb-4">
                  Fragmented Tools
                </h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="text-[hsl(var(--primary))] mt-1">•</span>
                    <span>Students use 5+ separate tools for writing, citations, plagiarism checks</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[hsl(var(--primary))] mt-1">•</span>
                    <span>50%+ cost premium vs. integrated solution</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[hsl(var(--primary))] mt-1">•</span>
                    <span>Context switching kills productivity (10+ hours/month lost)</span>
                  </li>
                </ul>
              </div>
              <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] p-6 rounded-lg">
                <h3 className="text-xl font-bold uppercase tracking-[0.16em] mb-4">
                  Market Gap
                </h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="mt-1">•</span>
                    <span>No true all-in-one academic writing platform</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1">•</span>
                    <span>Existing tools lack AI integration depth</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1">•</span>
                    <span>Academic-specific workflows poorly supported</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </Slide>

        {/* Slide 3: Solution */}
        <Slide id="solution">
          <div className="space-y-8">
            <div className="flex items-center gap-4 mb-8">
              <Zap className="text-[hsl(var(--primary))]" size={32} />
              <h2 className="text-4xl sm:text-5xl font-bold uppercase tracking-[0.12em]">
                Our Solution
              </h2>
            </div>
            <div className="border-2 border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 p-8 rounded-lg mb-8">
              <p className="text-xl sm:text-2xl font-semibold uppercase tracking-[0.16em] text-center">
                The First Integrated AI-Powered Academic Writing Platform
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg">
                <Brain className="text-[hsl(var(--primary))] mb-4" size={32} />
                <h3 className="text-lg font-bold uppercase tracking-[0.16em] mb-3">
                  AI Writing
                </h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Advanced AI-powered content generation with academic context awareness
                </p>
              </div>
              <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg">
                <BookOpen className="text-[hsl(var(--primary))] mb-4" size={32} />
                <h3 className="text-lg font-bold uppercase tracking-[0.16em] mb-3">
                  Smart Citations
                </h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Comprehensive academic database integration with auto-formatting (APA, MLA, IEEE)
                </p>
              </div>
              <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg">
                <Shield className="text-[hsl(var(--primary))] mb-4" size={32} />
                <h3 className="text-lg font-bold uppercase tracking-[0.16em] mb-3">
                  Plagiarism Detection
                </h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Built-in plagiarism checking with detailed reports
                </p>
              </div>
              <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg">
                <FileText className="text-[hsl(var(--primary))] mb-4" size={32} />
                <h3 className="text-lg font-bold uppercase tracking-[0.16em] mb-3">
                  PDF Assistant
                </h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Upload PDFs and ask questions about content
                </p>
              </div>
              <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg">
                <Layers className="text-[hsl(var(--primary))] mb-4" size={32} />
                <h3 className="text-lg font-bold uppercase tracking-[0.16em] mb-3">
                  Section-Based Editor
                </h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Organized workspace for essays, theses, and research papers
                </p>
              </div>
              <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg">
                <Download className="text-[hsl(var(--primary))] mb-4" size={32} />
                <h3 className="text-lg font-bold uppercase tracking-[0.16em] mb-3">
                  Export
                </h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Professional PDF/DOCX export with academic templates
                </p>
              </div>
            </div>
          </div>
        </Slide>

        {/* Slide 4: Market Opportunity */}
        <Slide id="market">
          <div className="space-y-8">
            <div className="flex items-center gap-4 mb-8">
              <BarChart3 className="text-[hsl(var(--primary))]" size={32} />
              <h2 className="text-4xl sm:text-5xl font-bold uppercase tracking-[0.12em]">
                Market Opportunity
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg">
                  <h3 className="text-2xl font-bold uppercase tracking-[0.16em] mb-4">
                    Total Addressable Market (TAM)
                  </h3>
                  <div className="text-5xl font-bold text-[hsl(var(--primary))] mb-2">
                    $1.8B+
                  </div>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    Academic writing software market (subset of $8.5B total academic writing market, projected to reach $15.5B by 2033)
                  </p>
                </div>
                <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] p-6 rounded-lg">
                  <h3 className="text-xl font-bold uppercase tracking-[0.16em] mb-4">
                    Serviceable Addressable Market (SAM)
                  </h3>
                  <div className="text-4xl font-bold mb-2">$450M</div>
                  <p className="text-sm">
                    English-speaking academic markets (26M+ students in US, UK, Canada, Australia, NZ, Ireland)
                  </p>
                </div>
                <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg">
                  <h3 className="text-xl font-bold uppercase tracking-[0.16em] mb-4">
                    Serviceable Obtainable Market (SOM)
                  </h3>
                  <div className="text-4xl font-bold mb-2">$18M</div>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    Year 1-3 target (4% of SAM with aggressive marketing)
                  </p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg">
                  <h3 className="text-xl font-bold uppercase tracking-[0.16em] mb-4">
                    Market Growth Indicators
                  </h3>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="text-green-500 mt-1" size={20} />
                      <div>
                        <div className="font-semibold">Jenni AI: 481% YoY Growth</div>
                        <div className="text-sm text-[hsl(var(--muted-foreground))]">
                          $5.1M ARR (April 2024)
                        </div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="text-green-500 mt-1" size={20} />
                      <div>
                        <div className="font-semibold">Global Higher Education Market</div>
                        <div className="text-sm text-[hsl(var(--muted-foreground))]">
                          235M+ students worldwide
                        </div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="text-green-500 mt-1" size={20} />
                      <div>
                        <div className="font-semibold">AI Adoption in Academia</div>
                        <div className="text-sm text-[hsl(var(--muted-foreground))]">
                          Accelerating with GPT-4 era
                        </div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="text-green-500 mt-1" size={20} />
                      <div>
                        <div className="font-semibold">SaaS in Education</div>
                        <div className="text-sm text-[hsl(var(--muted-foreground))]">
                          $12B market, 18% CAGR
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Slide>

        {/* Slide 5: Competitive Advantage */}
        <Slide id="competitive">
          <div className="space-y-8">
            <div className="flex items-center gap-4 mb-8">
              <Award className="text-[hsl(var(--primary))]" size={32} />
              <h2 className="text-4xl sm:text-5xl font-bold uppercase tracking-[0.12em]">
                Competitive Advantage
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="border-2 border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 p-8 rounded-lg">
                <h3 className="text-2xl font-bold uppercase tracking-[0.16em] mb-6 text-center">
                  Akowe vs. Jenni AI
                </h3>
                <div className="space-y-4">
                  <div className="border-b border-[hsl(var(--border-strong))] pb-4">
                    <div className="font-semibold mb-2">All-in-One Integration</div>
                    <div className="text-sm text-[hsl(var(--muted-foreground))]">
                      Akowe: ✓ Deep integration of writing, citations, plagiarism, PDF analysis
                      <br />
                      Jenni AI: ✗ Focuses primarily on writing assistance
                    </div>
                  </div>
                  <div className="border-b border-[hsl(var(--border-strong))] pb-4">
                    <div className="font-semibold mb-2">Academic-First Design</div>
                    <div className="text-sm text-[hsl(var(--muted-foreground))]">
                      Akowe: ✓ Section-based editor, citation auto-formatting, academic templates
                      <br />
                      Jenni AI: ✗ More generic writing tool
                    </div>
                  </div>
                  <div className="border-b border-[hsl(var(--border-strong))] pb-4">
                    <div className="font-semibold mb-2">Pricing</div>
                    <div className="text-sm text-[hsl(var(--muted-foreground))]">
                      Akowe: $12/month (Pro) vs. Jenni AI: Higher pricing
                      <br />
                      Better value proposition for students
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold mb-2">PDF Analysis</div>
                    <div className="text-sm text-[hsl(var(--muted-foreground))]">
                      Akowe: ✓ Built-in PDF Q&A assistant
                      <br />
                      Jenni AI: ✗ Limited PDF support
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg">
                  <h3 className="text-xl font-bold uppercase tracking-[0.16em] mb-4">
                    Key Differentiators
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="text-[hsl(var(--primary))] mt-1" size={20} />
                      <span>50%+ cost savings vs. using separate tools</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="text-[hsl(var(--primary))] mt-1" size={20} />
                      <span>10+ hours saved per month per user</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="text-[hsl(var(--primary))] mt-1" size={20} />
                      <span>Native academic workflow (not retrofitted)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="text-[hsl(var(--primary))] mt-1" size={20} />
                      <span>Superior citation integration with comprehensive academic databases</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="text-[hsl(var(--primary))] mt-1" size={20} />
                      <span>Built-in plagiarism detection (no third-party required)</span>
                    </li>
                  </ul>
                </div>
                <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] p-6 rounded-lg">
                  <h3 className="text-xl font-bold uppercase tracking-[0.16em] mb-4">
                    Moat
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li>• Deep integration creates switching costs</li>
                    <li>• Academic-specific features difficult to replicate</li>
                    <li>• First-mover advantage in all-in-one space</li>
                    <li>• Community-driven growth creates network effects</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Slide>

        {/* Slide 6: Traction */}
        <Slide id="traction">
          <div className="space-y-8">
            <div className="flex items-center gap-4 mb-8">
              <TrendingUp className="text-[hsl(var(--primary))]" size={32} />
              <h2 className="text-4xl sm:text-5xl font-bold uppercase tracking-[0.12em]">
                Traction & Metrics
              </h2>
            </div>
            <div className="border-2 border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 p-6 rounded-lg mb-6">
              <p className="text-center text-sm uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
                Soft Launch: December 2025 | Organic & Creator-Led Growth
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-6 mb-6">
              <MetricCard
                label="Total Users"
                value={(metrics?.users.total ?? DEFAULT_METRICS.users.total).toLocaleString()}
                subtitle="Organic signups since launch"
                icon={<Users size={20} />}
              />
              <MetricCard
                label="Projects Created"
                value={(metrics?.projects.total ?? DEFAULT_METRICS.projects.total).toLocaleString()}
                subtitle={`${(metrics?.projects.avgProjectsPerUser ?? DEFAULT_METRICS.projects.avgProjectsPerUser).toFixed(1)} per user avg`}
                icon={<FileText size={20} />}
              />
              <MetricCard
                label="AI Words Generated"
                value={(metrics?.usage.totalAIWords ?? DEFAULT_METRICS.usage.totalAIWords).toLocaleString()}
                subtitle="All-time platform usage"
                icon={<Zap size={20} />}
              />
              <MetricCard
                label="Plagiarism Checks"
                value={(metrics?.usage.totalPlagiarismChecks ?? DEFAULT_METRICS.usage.totalPlagiarismChecks).toLocaleString()}
                subtitle="Built-in integrity tool"
                icon={<Shield size={20} />}
              />
            </div>
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg">
                <h3 className="text-sm uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))] mb-3">
                  User Engagement
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Weekly Active Users</span>
                    <span className="font-bold">
                      {metrics?.users.wau ?? DEFAULT_METRICS.users.wau}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Monthly Active Users</span>
                    <span className="font-bold">
                      {metrics?.productHealth.activeUsers ?? DEFAULT_METRICS.productHealth.activeUsers}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Projects per User</span>
                    <span className="font-bold">
                      {(metrics?.projects.avgProjectsPerUser ?? DEFAULT_METRICS.projects.avgProjectsPerUser).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg">
                <h3 className="text-sm uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))] mb-3">
                  Feature Adoption
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Citation Adoption</span>
                    <span className="font-bold">
                      {(metrics?.usage.citationAdoption ?? DEFAULT_METRICS.usage.citationAdoption).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Plagiarism Adoption</span>
                    <span className="font-bold">
                      {(metrics?.usage.plagiarismAdoption ?? DEFAULT_METRICS.usage.plagiarismAdoption).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">New Users (7d)</span>
                    <span className="font-bold">
                      {metrics?.users.newLast7Days ?? DEFAULT_METRICS.users.newLast7Days}
                    </span>
                  </div>
                </div>
              </div>
              <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg">
                <h3 className="text-sm uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))] mb-3">
                  Early Revenue
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Paying Subscribers</span>
                    <span className="font-bold">
                      {metrics?.revenue.activeSubscriptions ?? DEFAULT_METRICS.revenue.activeSubscriptions}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">MRR</span>
                    <span className="font-bold">
                      ${((metrics?.revenue.monthlyRecurringRevenue ?? DEFAULT_METRICS.revenue.monthlyRecurringRevenue) / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">New Users (30d)</span>
                    <span className="font-bold">
                      {metrics?.users.newInPeriod ?? DEFAULT_METRICS.users.newInPeriod}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] p-6 rounded-lg">
              <h3 className="text-sm uppercase tracking-[0.24em] mb-3">
                Pre-Investment Growth Context
              </h3>
              <div className="grid md:grid-cols-3 gap-6 text-sm">
                <div>
                  <div className="font-semibold mb-1">Creator-Led Growth</div>
                  <div>Partnering with creators who have built-in audiences. Investment unlocks scaled paid acquisition.</div>
                </div>
                <div>
                  <div className="font-semibold mb-1">Strong Product Signals</div>
                  <div>~{(metrics?.projects.avgProjectsPerUser ?? DEFAULT_METRICS.projects.avgProjectsPerUser).toFixed(1)} projects/user with {(metrics?.usage.citationAdoption ?? DEFAULT_METRICS.usage.citationAdoption).toFixed(0)}% citation adoption shows real utility.</div>
                </div>
                <div>
                  <div className="font-semibold mb-1">Conversion Opportunity</div>
                  <div>At industry 5-10% conversion, {(metrics?.users.total ?? DEFAULT_METRICS.users.total).toLocaleString()} users = {Math.round((metrics?.users.total ?? DEFAULT_METRICS.users.total) * 0.08)}-{Math.round((metrics?.users.total ?? DEFAULT_METRICS.users.total) * 0.10)} potential subscribers.</div>
                </div>
              </div>
            </div>
          </div>
        </Slide>

        {/* Slide 7: Business Model */}
        <Slide id="business-model">
          <div className="space-y-8">
            <div className="flex items-center gap-4 mb-8">
              <DollarSign className="text-[hsl(var(--primary))]" size={32} />
              <h2 className="text-4xl sm:text-5xl font-bold uppercase tracking-[0.12em]">
                Business Model
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg">
                <h3 className="text-xl font-bold uppercase tracking-[0.16em] mb-4">
                  Free
                </h3>
                <div className="text-4xl font-bold mb-4">$0</div>
                <ul className="space-y-2 text-sm mb-6">
                  <li>• 1,500 AI words/day</li>
                  <li>• 3 plagiarism checks/day</li>
                  <li>• 3 projects max</li>
                  <li>• Basic citations</li>
                </ul>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">
                  Freemium conversion funnel
                </div>
              </div>
              <div className="border-4 border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 p-6 rounded-lg relative">
                <div className="absolute -top-3 left-6 px-3 py-1 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-xs font-bold uppercase tracking-[0.2em]">
                  Popular
                </div>
                <h3 className="text-xl font-bold uppercase tracking-[0.16em] mb-4">
                  Pro
                </h3>
                <div className="text-4xl font-bold mb-1">$12</div>
                <div className="text-sm text-[hsl(var(--muted-foreground))] mb-4">per month</div>
                <div className="text-sm font-semibold mb-4">or $120/year (save $24)</div>
                <ul className="space-y-2 text-sm mb-6">
                  <li>• Unlimited AI words</li>
                  <li>• Unlimited plagiarism checks</li>
                  <li>• Unlimited projects</li>
                  <li>• Advanced AI model access</li>
                  <li>• Advanced citations</li>
                  <li>• Priority support</li>
                </ul>
              </div>
              <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg">
                <h3 className="text-xl font-bold uppercase tracking-[0.16em] mb-4">
                  Team
                </h3>
                <div className="text-4xl font-bold mb-4">Coming Soon</div>
                <ul className="space-y-2 text-sm mb-6">
                  <li>• All Pro features</li>
                  <li>• 10 team members</li>
                  <li>• Shared workspaces</li>
                  <li>• Admin controls</li>
                  <li>• Shared citation library</li>
                </ul>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">
                  Enterprise revenue stream
                </div>
              </div>
            </div>
            <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] p-6 rounded-lg">
              <h3 className="text-xl font-bold uppercase tracking-[0.16em] mb-4">
                Revenue Model
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <div className="font-semibold mb-2">Subscription Revenue</div>
                  <div className="text-sm">Primary: Monthly/annual subscriptions</div>
                </div>
                <div>
                  <div className="font-semibold mb-2">Conversion Rate Target</div>
                  <div className="text-sm">5-10% free-to-paid (industry avg: 3%)</div>
                </div>
                <div>
                  <div className="font-semibold mb-2">LTV:CAC Ratio</div>
                  <div className="text-sm">Target: 3:1 (healthy SaaS metric)</div>
                </div>
              </div>
            </div>
          </div>
        </Slide>

        {/* Slide 8: Go-to-Market */}
        <Slide id="gtm">
          <div className="space-y-8">
            <div className="flex items-center gap-4 mb-8">
              <Rocket className="text-[hsl(var(--primary))]" size={32} />
              <h2 className="text-4xl sm:text-5xl font-bold uppercase tracking-[0.12em]">
                Go-to-Market Strategy
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg">
                  <h3 className="text-xl font-bold uppercase tracking-[0.16em] mb-4 flex items-center gap-3">
                    <Globe size={24} />
                    Community Engagement
                  </h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="text-[hsl(var(--primary))] mt-1" size={18} />
                      <span>Reddit communities (r/GradSchool, r/PhD, r/AcademicWriting)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="text-[hsl(var(--primary))] mt-1" size={18} />
                      <span>Discord/Slack communities for researchers</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="text-[hsl(var(--primary))] mt-1" size={18} />
                      <span>Twitter/X academic communities</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="text-[hsl(var(--primary))] mt-1" size={18} />
                      <span>University student forums and groups</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="text-[hsl(var(--primary))] mt-1" size={18} />
                      <span>Partnerships with academic writing centers</span>
                    </li>
                  </ul>
                </div>
                <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg">
                  <h3 className="text-xl font-bold uppercase tracking-[0.16em] mb-4 flex items-center gap-3">
                    <Presentation size={24} />
                    Content Marketing
                  </h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="text-[hsl(var(--primary))] mt-1" size={18} />
                      <span>SEO-optimized blog (academic writing tips, citation guides)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="text-[hsl(var(--primary))] mt-1" size={18} />
                      <span>YouTube tutorials and product demos</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="text-[hsl(var(--primary))] mt-1" size={18} />
                      <span>Academic writing templates and resources</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="text-[hsl(var(--primary))] mt-1" size={18} />
                      <span>Guest posts on academic blogs</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="space-y-6">
                <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] p-6 rounded-lg">
                  <h3 className="text-xl font-bold uppercase tracking-[0.16em] mb-4">
                    Growth Channels
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="font-semibold mb-2">1. Organic (60%)</div>
                      <div className="text-sm">SEO, content marketing, community</div>
                    </div>
                    <div>
                      <div className="font-semibold mb-2">2. Referrals (25%)</div>
                      <div className="text-sm">Student-to-student referrals, affiliate program</div>
                    </div>
                    <div>
                      <div className="font-semibold mb-2">3. Paid (15%)</div>
                      <div className="text-sm">Targeted ads (Google, Reddit, Twitter)</div>
                    </div>
                  </div>
                </div>
                <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg">
                  <h3 className="text-xl font-bold uppercase tracking-[0.16em] mb-4">
                    Target Segments
                  </h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                      <span className="text-[hsl(var(--primary))] font-bold">1.</span>
                      <div>
                        <div className="font-semibold">Graduate Students (Primary)</div>
                        <div className="text-[hsl(var(--muted-foreground))]">Theses, dissertations, research papers</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[hsl(var(--primary))] font-bold">2.</span>
                      <div>
                        <div className="font-semibold">Undergraduate Students</div>
                        <div className="text-[hsl(var(--muted-foreground))]">Essays, term papers, assignments</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[hsl(var(--primary))] font-bold">3.</span>
                      <div>
                        <div className="font-semibold">Researchers & Academics</div>
                        <div className="text-[hsl(var(--muted-foreground))]">Journal articles, conference papers</div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Slide>

        {/* Slide 9: Team */}
        <Slide id="team">
          <div className="space-y-8">
            <div className="flex items-center gap-4 mb-8">
              <Users className="text-[hsl(var(--primary))]" size={32} />
              <h2 className="text-4xl sm:text-5xl font-bold uppercase tracking-[0.12em]">
                Team
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg">
                <h3 className="text-xl font-bold uppercase tracking-[0.16em] mb-2">
                  Olamide Akomolafe
                </h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
                  Product Manager | Co-Founder
                </p>
                <p className="text-sm">
                  10 years experience in technology and product management. Expert in building user-centric products and driving product-market fit.
                </p>
              </div>
              <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg">
                <h3 className="text-xl font-bold uppercase tracking-[0.16em] mb-2">
                  Nwachukwu Ossai
                </h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
                  Technical Co-Founder
                </p>
                <p className="text-sm">
                  10 years in engineering. Full-stack expertise with deep experience in scalable systems, AI integration, and modern web technologies.
                </p>
              </div>
              <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg">
                <h3 className="text-xl font-bold uppercase tracking-[0.16em] mb-2">
                  Obakam Tom-George
                </h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
                  Operations & Product | Co-Founder
                </p>
                <p className="text-sm">
                  10 years experience in operations and product. Proven track record in scaling operations and building efficient product workflows.
                </p>
              </div>
              <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg">
                <h3 className="text-xl font-bold uppercase tracking-[0.16em] mb-2">
                  Sylva Elendu
                </h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
                  Software Development | Co-Founder
                </p>
                <p className="text-sm">
                  7 years in software development. Specialized in frontend architecture, UI/UX implementation, and creating delightful user experiences.
                </p>
              </div>
            </div>
            <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] p-6 rounded-lg">
              <h3 className="text-xl font-bold uppercase tracking-[0.16em] mb-4">
                Marketing Team
              </h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-semibold">Marketing Lead</div>
                  <div>Strategic marketing & brand building</div>
                </div>
                <div>
                  <div className="font-semibold">Marketing Associate</div>
                  <div>Community engagement & content creation</div>
                </div>
                <div>
                  <div className="font-semibold">Junior Marketer</div>
                  <div>Social media & outreach support</div>
                </div>
              </div>
            </div>
          </div>
        </Slide>

        {/* Slide 10: Financial Projections */}
        <Slide id="financials">
          <div className="space-y-8">
            <div className="flex items-center gap-4 mb-8">
              <BarChart3 className="text-[hsl(var(--primary))]" size={32} />
              <h2 className="text-4xl sm:text-5xl font-bold uppercase tracking-[0.12em]">
                Financial Projections
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg">
                <h3 className="text-lg font-bold uppercase tracking-[0.16em] mb-4">Year 1</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-[hsl(var(--muted-foreground))]">Users</div>
                    <div className="text-2xl font-bold">5,000</div>
                  </div>
                  <div>
                    <div className="text-sm text-[hsl(var(--muted-foreground))]">Paid Users (8%)</div>
                    <div className="text-2xl font-bold">400</div>
                  </div>
                  <div>
                    <div className="text-sm text-[hsl(var(--muted-foreground))]">MRR</div>
                    <div className="text-2xl font-bold text-[hsl(var(--primary))]">$7,600</div>
                  </div>
                  <div>
                    <div className="text-sm text-[hsl(var(--muted-foreground))]">ARR</div>
                    <div className="text-2xl font-bold">$91,200</div>
                  </div>
                </div>
              </div>
              <div className="border-4 border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 p-6 rounded-lg">
                <h3 className="text-lg font-bold uppercase tracking-[0.16em] mb-4">Year 2</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-[hsl(var(--muted-foreground))]">Users</div>
                    <div className="text-2xl font-bold">25,000</div>
                  </div>
                  <div>
                    <div className="text-sm text-[hsl(var(--muted-foreground))]">Paid Users (10%)</div>
                    <div className="text-2xl font-bold">2,500</div>
                  </div>
                  <div>
                    <div className="text-sm text-[hsl(var(--muted-foreground))]">MRR</div>
                    <div className="text-2xl font-bold text-[hsl(var(--primary))]">$30,000</div>
                  </div>
                  <div>
                    <div className="text-sm text-[hsl(var(--muted-foreground))]">ARR</div>
                    <div className="text-2xl font-bold">$360,000</div>
                  </div>
                </div>
              </div>
              <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg">
                <h3 className="text-lg font-bold uppercase tracking-[0.16em] mb-4">Year 3</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-[hsl(var(--muted-foreground))]">Users</div>
                    <div className="text-2xl font-bold">80,000</div>
                  </div>
                  <div>
                    <div className="text-sm text-[hsl(var(--muted-foreground))]">Paid Users (12%)</div>
                    <div className="text-2xl font-bold">9,600</div>
                  </div>
                  <div>
                    <div className="text-sm text-[hsl(var(--muted-foreground))]">MRR</div>
                    <div className="text-2xl font-bold text-[hsl(var(--primary))]">$115,200</div>
                  </div>
                  <div>
                    <div className="text-sm text-[hsl(var(--muted-foreground))]">ARR</div>
                    <div className="text-2xl font-bold">$1,382,400</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg">
                <h3 className="text-lg font-bold uppercase tracking-[0.16em] mb-4">Key Assumptions</h3>
                <ul className="space-y-2 text-sm">
                  <li>• 8% free-to-paid conversion (Year 1) → 12% (Year 3)</li>
                  <li>• $12/month average subscription (mix of monthly/annual)</li>
                  <li>• 5% monthly churn rate (improving to 4% by Year 3)</li>
                  <li>• Aggressive marketing with $250K investment drives rapid growth</li>
                  <li>• CAC: $60 (Year 1) → $40 (Year 3) with paid + organic mix</li>
                  <li>• LTV: $380 (20 months average lifetime)</li>
                  <li>• Strong community + content marketing foundation</li>
                </ul>
              </div>
              <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] p-6 rounded-lg">
                <h3 className="text-lg font-bold uppercase tracking-[0.16em] mb-4">Milestones</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="mt-1" size={18} />
                    <div>
                      <div className="font-semibold">Year 1: Rapid Growth</div>
                      <div>5,000 users, $91K ARR with marketing push</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="mt-1" size={18} />
                    <div>
                      <div className="font-semibold">Year 2: Market Leadership</div>
                      <div>25,000 users, $570K ARR, strong PMF</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="mt-1" size={18} />
                    <div>
                      <div className="font-semibold">Year 3: Scale & Series A</div>
                      <div>80,000 users, $2.2M ARR, ready for next round</div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </Slide>

        {/* Slide 11: Roadmap */}
        <Slide id="roadmap">
          <div className="space-y-8">
            <div className="flex items-center gap-4 mb-8">
              <Rocket className="text-[hsl(var(--primary))]" size={32} />
              <h2 className="text-4xl sm:text-5xl font-bold uppercase tracking-[0.12em]">
                Product Roadmap
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg">
                  <h3 className="text-xl font-bold uppercase tracking-[0.16em] mb-4 flex items-center gap-3">
                    <Layers size={24} />
                    Vertical Scaling (Q1-Q2 2026)
                  </h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="text-green-500 mt-1" size={18} />
                      <div>
                        <div className="font-semibold">Enhanced AI Models</div>
                        <div className="text-[hsl(var(--muted-foreground))]">Fine-tuned models for academic writing</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="text-green-500 mt-1" size={18} />
                      <div>
                        <div className="font-semibold">Advanced Citation Support</div>
                        <div className="text-[hsl(var(--muted-foreground))]">Chicago, Harvard, Vancouver styles</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="text-green-500 mt-1" size={18} />
                      <div>
                        <div className="font-semibold">Real-time Collaboration</div>
                        <div className="text-[hsl(var(--muted-foreground))]">Co-authoring and commenting</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="text-green-500 mt-1" size={18} />
                      <div>
                        <div className="font-semibold">Performance Optimization</div>
                        <div className="text-[hsl(var(--muted-foreground))]">Faster rendering, better UX</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="text-green-500 mt-1" size={18} />
                      <div>
                        <div className="font-semibold">Mobile App</div>
                        <div className="text-[hsl(var(--muted-foreground))]">iOS and Android native apps</div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="space-y-6">
                <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg">
                  <h3 className="text-xl font-bold uppercase tracking-[0.16em] mb-4 flex items-center gap-3">
                    <Globe size={24} />
                    Horizontal Scaling (Q3-Q4 2026)
                  </h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                      <Target className="text-blue-500 mt-1" size={18} />
                      <div>
                        <div className="font-semibold">Team Workspaces</div>
                        <div className="text-[hsl(var(--muted-foreground))]">Multi-user collaboration, shared libraries</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Target className="text-blue-500 mt-1" size={18} />
                      <div>
                        <div className="font-semibold">Institutional Plans</div>
                        <div className="text-[hsl(var(--muted-foreground))]">University and department licenses</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Target className="text-blue-500 mt-1" size={18} />
                      <div>
                        <div className="font-semibold">Professional Writing</div>
                        <div className="text-[hsl(var(--muted-foreground))]">Expand to business writing, reports</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Target className="text-blue-500 mt-1" size={18} />
                      <div>
                        <div className="font-semibold">API & Integrations</div>
                        <div className="text-[hsl(var(--muted-foreground))]">Zotero, Mendeley, Overleaf integrations</div>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <Target className="text-blue-500 mt-1" size={18} />
                      <div>
                        <div className="font-semibold">White-Label Solutions</div>
                        <div className="text-[hsl(var(--muted-foreground))]">Customizable for institutions</div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] p-6 rounded-lg">
              <h3 className="text-xl font-bold uppercase tracking-[0.16em] mb-4">
                Long-Term Vision (2027+)
              </h3>
              <div className="grid md:grid-cols-3 gap-6 text-sm">
                <div>
                  <div className="font-semibold mb-2">AI Research Assistant</div>
                  <div>Advanced AI that understands research context deeply</div>
                </div>
                <div>
                  <div className="font-semibold mb-2">Global Expansion</div>
                  <div>Multi-language support, international markets</div>
                </div>
                <div>
                  <div className="font-semibold mb-2">Ecosystem</div>
                  <div>Plugins, extensions, third-party integrations</div>
                </div>
              </div>
            </div>
          </div>
        </Slide>

        {/* Slide 12: Investment Ask */}
        <Slide id="investment">
          <div className="space-y-8">
            <div className="flex items-center gap-4 mb-8">
              <DollarSign className="text-[hsl(var(--primary))]" size={32} />
              <h2 className="text-4xl sm:text-5xl font-bold uppercase tracking-[0.12em]">
                Investment Ask
              </h2>
            </div>
            <div className="border-4 border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 p-12 rounded-lg text-center mb-8">
              <div className="text-6xl font-bold mb-4">$500K</div>
              <p className="text-2xl uppercase tracking-[0.2em] mb-6">Seed Round</p>
              <p className="text-lg text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
                To accelerate product development, expand marketing, and achieve product-market fit
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg">
                <h3 className="text-xl font-bold uppercase tracking-[0.16em] mb-6">
                  Use of Funds
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold">Marketing & Growth (50%)</span>
                      <span className="text-[hsl(var(--primary))] font-bold">$250K</span>
                    </div>
                    <div className="text-sm text-[hsl(var(--muted-foreground))]">
                      Aggressive community building, content marketing, paid acquisition, partnerships
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold">Product Development (20%)</span>
                      <span className="text-[hsl(var(--primary))] font-bold">$100K</span>
                    </div>
                    <div className="text-sm text-[hsl(var(--muted-foreground))]">
                      AI improvements, mobile apps, feature enhancements (leverage in-house team)
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold">Operations (15%)</span>
                      <span className="text-[hsl(var(--primary))] font-bold">$75K</span>
                    </div>
                    <div className="text-sm text-[hsl(var(--muted-foreground))]">
                      Infrastructure, tools, legal, accounting, compliance
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold">Team (15%)</span>
                      <span className="text-[hsl(var(--primary))] font-bold">$75K</span>
                    </div>
                    <div className="text-sm text-[hsl(var(--muted-foreground))]">
                      Key hires, contractor support, talent acquisition
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-6 rounded-lg">
                <h3 className="text-xl font-bold uppercase tracking-[0.16em] mb-6">
                  Expected Outcomes (18 Months)
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="text-[hsl(var(--primary))] mt-1" size={20} />
                    <div>
                      <div className="font-semibold">25,000+ Active Users</div>
                      <div className="text-sm text-[hsl(var(--muted-foreground))]">10% conversion to paid</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="text-[hsl(var(--primary))] mt-1" size={20} />
                    <div>
                      <div className="font-semibold">$570K+ ARR</div>
                      <div className="text-sm text-[hsl(var(--muted-foreground))]">Strong growth trajectory with marketing investment</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="text-[hsl(var(--primary))] mt-1" size={20} />
                    <div>
                      <div className="font-semibold">Product-Market Fit</div>
                      <div className="text-sm text-[hsl(var(--muted-foreground))]">Validated with 2,500+ paid users</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="text-[hsl(var(--primary))] mt-1" size={20} />
                    <div>
                      <div className="font-semibold">Market Position</div>
                      <div className="text-sm text-[hsl(var(--muted-foreground))]">Leading all-in-one academic platform</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="text-[hsl(var(--primary))] mt-1" size={20} />
                    <div>
                      <div className="font-semibold">Series A Ready</div>
                      <div className="text-sm text-[hsl(var(--muted-foreground))]">Strong metrics for next round</div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] p-6 rounded-lg text-center">
              <p className="text-lg font-semibold mb-2">
                Join us in transforming academic writing
              </p>
              <p className="text-sm">
                Contact: founders@placeholderllc.name.ng | invest@placeholderllc.name.ng
              </p>
            </div>
          </div>
        </Slide>

        {/* Slide 13: Closing */}
        <Slide id="closing">
          <div className="text-center space-y-12">
            <div className="space-y-6">
              <h2 className="text-5xl sm:text-6xl font-bold uppercase tracking-[0.12em]">
                Thank You
              </h2>
              <p className="text-2xl uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
                Let&apos;s build the future of academic writing together
              </p>
            </div>
            <div className="pt-8">
              <div className="text-4xl font-bold uppercase tracking-[0.16em] mb-4">
                Akọ̀wé
              </div>
              <p className="text-lg uppercase tracking-[0.3em] text-[hsl(var(--muted-foreground))]">
                Write research that holds up
              </p>
            </div>
            <div className="pt-8 text-sm uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
              <p>useakowe.com</p>
              <p className="mt-2">founders@placeholderllc.name.ng | invest@placeholderllc.name.ng</p>
            </div>
          </div>
        </Slide>
      </div>

      {/* Sticky Navigation Menu */}
      {!isPDFMode && (
        <nav className="fixed top-0 left-0 right-0 z-40 bg-[hsl(var(--surface))] border-b-2 border-[hsl(var(--border-strong))] shadow-lg">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-3">
            <div className="flex items-center gap-1 sm:gap-2 md:gap-4 overflow-x-auto scrollbar-hide pb-1">
              <button
                onClick={() => {
                  document.getElementById('cover')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] whitespace-nowrap px-2 sm:px-3 py-1.5 sm:py-2 hover:text-[hsl(var(--primary))] active:text-[hsl(var(--primary))] transition-colors touch-manipulation"
              >
                Cover
              </button>
              <span className="text-[hsl(var(--muted-foreground))] hidden sm:inline">•</span>
              <button
                onClick={() => {
                  document.getElementById('problem')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] whitespace-nowrap px-2 sm:px-3 py-1.5 sm:py-2 hover:text-[hsl(var(--primary))] active:text-[hsl(var(--primary))] transition-colors touch-manipulation"
              >
                Problem
              </button>
              <span className="text-[hsl(var(--muted-foreground))] hidden sm:inline">•</span>
              <button
                onClick={() => {
                  document.getElementById('solution')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] whitespace-nowrap px-2 sm:px-3 py-1.5 sm:py-2 hover:text-[hsl(var(--primary))] active:text-[hsl(var(--primary))] transition-colors touch-manipulation"
              >
                Solution
              </button>
              <span className="text-[hsl(var(--muted-foreground))] hidden sm:inline">•</span>
              <button
                onClick={() => {
                  document.getElementById('market')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] whitespace-nowrap px-2 sm:px-3 py-1.5 sm:py-2 hover:text-[hsl(var(--primary))] active:text-[hsl(var(--primary))] transition-colors touch-manipulation"
              >
                Market
              </button>
              <span className="text-[hsl(var(--muted-foreground))] hidden sm:inline">•</span>
              <button
                onClick={() => {
                  document.getElementById('competitive')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] whitespace-nowrap px-2 sm:px-3 py-1.5 sm:py-2 hover:text-[hsl(var(--primary))] active:text-[hsl(var(--primary))] transition-colors touch-manipulation"
              >
                Competitive
              </button>
              <span className="text-[hsl(var(--muted-foreground))] hidden sm:inline">•</span>
              <button
                onClick={() => {
                  document.getElementById('traction')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] whitespace-nowrap px-2 sm:px-3 py-1.5 sm:py-2 hover:text-[hsl(var(--primary))] active:text-[hsl(var(--primary))] transition-colors touch-manipulation"
              >
                Traction
              </button>
              <span className="text-[hsl(var(--muted-foreground))] hidden sm:inline">•</span>
              <button
                onClick={() => {
                  document.getElementById('business-model')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] whitespace-nowrap px-2 sm:px-3 py-1.5 sm:py-2 hover:text-[hsl(var(--primary))] active:text-[hsl(var(--primary))] transition-colors touch-manipulation"
              >
                <span className="hidden sm:inline">Business Model</span>
                <span className="sm:hidden">Model</span>
              </button>
              <span className="text-[hsl(var(--muted-foreground))] hidden sm:inline">•</span>
              <button
                onClick={() => {
                  document.getElementById('gtm')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] whitespace-nowrap px-2 sm:px-3 py-1.5 sm:py-2 hover:text-[hsl(var(--primary))] active:text-[hsl(var(--primary))] transition-colors touch-manipulation"
              >
                GTM
              </button>
              <span className="text-[hsl(var(--muted-foreground))] hidden sm:inline">•</span>
              <button
                onClick={() => {
                  document.getElementById('team')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] whitespace-nowrap px-2 sm:px-3 py-1.5 sm:py-2 hover:text-[hsl(var(--primary))] active:text-[hsl(var(--primary))] transition-colors touch-manipulation"
              >
                Team
              </button>
              <span className="text-[hsl(var(--muted-foreground))] hidden sm:inline">•</span>
              <button
                onClick={() => {
                  document.getElementById('financials')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] whitespace-nowrap px-2 sm:px-3 py-1.5 sm:py-2 hover:text-[hsl(var(--primary))] active:text-[hsl(var(--primary))] transition-colors touch-manipulation"
              >
                Financials
              </button>
              <span className="text-[hsl(var(--muted-foreground))] hidden sm:inline">•</span>
              <button
                onClick={() => {
                  document.getElementById('roadmap')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] whitespace-nowrap px-2 sm:px-3 py-1.5 sm:py-2 hover:text-[hsl(var(--primary))] active:text-[hsl(var(--primary))] transition-colors touch-manipulation"
              >
                Roadmap
              </button>
              <span className="text-[hsl(var(--muted-foreground))] hidden sm:inline">•</span>
              <button
                onClick={() => {
                  document.getElementById('investment')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] whitespace-nowrap px-2 sm:px-3 py-1.5 sm:py-2 hover:text-[hsl(var(--primary))] active:text-[hsl(var(--primary))] transition-colors touch-manipulation"
              >
                Investment
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* Add padding-top to account for fixed nav - responsive height */}
      {!isPDFMode && <div className="h-12 sm:h-16"></div>}
      </div>
    </>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[hsl(var(--primary))] border-t-transparent mx-auto mb-4"></div>
        <p className="text-sm uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">Loading...</p>
      </div>
    </div>
  );
}

export default function InvestorPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <InvestorPageContent />
    </Suspense>
  );
}

