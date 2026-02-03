'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Sidebar, { MobileMenuButton } from '@/components/Sidebar';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { ProjectType } from '@/types';
import { FileText, BookOpen, GraduationCap, FlaskConical, Lightbulb, Info, CheckCircle2, AlertCircle, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import TopicFinderModal from '@/components/TopicFinderModal';
import { trackFunnel } from '@/lib/gtag';

const projectTypes: { 
  type: ProjectType;
  label: string;
  description: string;
  icon: React.ElementType;
  typicalWordCount: { min: number; max: number };
  commonMethodologies: string[];
  citationStyles: string[];
  insights: string[];
}[] = [
  {
    type: 'essay',
    label: 'Essay',
    description: 'Short academic papers and assignments',
    icon: FileText,
    typicalWordCount: { min: 1000, max: 5000 },
    commonMethodologies: ['Literature review', 'Argumentative analysis', 'Comparative study'],
    citationStyles: ['APA', 'MLA', 'Chicago'],
    insights: ['Focus on clear argumentation', 'Strong thesis statement required', 'Usually 3-5 main points']
  },
  {
    type: 'thesis',
    label: 'Thesis',
    description: 'Graduate research and thesis projects',
    icon: GraduationCap,
    typicalWordCount: { min: 15000, max: 50000 },
    commonMethodologies: ['Qualitative research', 'Quantitative research', 'Mixed methods', 'Case study'],
    citationStyles: ['APA', 'Chicago', 'Harvard'],
    insights: ['Requires original research contribution', 'Extensive literature review needed', 'Methodology section is crucial']
  },
  {
    type: 'journal',
    label: 'Journal Article',
    description: 'Research papers for publication',
    icon: BookOpen,
    typicalWordCount: { min: 3000, max: 8000 },
    commonMethodologies: ['Experimental design', 'Survey research', 'Meta-analysis', 'Systematic review'],
    citationStyles: ['APA', 'IEEE', 'Chicago'],
    insights: ['Must follow journal guidelines', 'Abstract and keywords important', 'Peer review process expected']
  },
  {
    type: 'research',
    label: 'Research Paper',
    description: 'Comprehensive research documents',
    icon: FlaskConical,
    typicalWordCount: { min: 5000, max: 15000 },
    commonMethodologies: ['Empirical research', 'Theoretical analysis', 'Comparative study', 'Longitudinal study'],
    citationStyles: ['APA', 'MLA', 'Chicago', 'Harvard'],
    insights: ['Rigorous methodology required', 'Data analysis section important', 'Clear research questions needed']
  },
];

export default function NewProjectPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [projectName, setProjectName] = useState('');
  const [selectedType, setSelectedType] = useState<ProjectType>('essay');
  const [topic, setTopic] = useState('');
  const [targetWordCount, setTargetWordCount] = useState(3000);
  const [citationStyle, setCitationStyle] = useState('APA');
  const [methodology, setMethodology] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitError, setLimitError] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showTopicFinder, setShowTopicFinder] = useState(false);
  const [userPlan, setUserPlan] = useState<'free' | 'pro' | 'team'>('free');

  // Get current project type details
  const currentType = projectTypes.find(type => type.type === selectedType);

  // Get user plan from session
  useEffect(() => {
    if (session?.user) {
      // Plan is available in session token
      const plan = (session.user as any).plan || 'free';
      setUserPlan(plan as 'free' | 'pro' | 'team');
    }
  }, [session]);

  // Handle topic from URL query parameter (from landing page topic finder)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const topicParam = params.get('topic');
      if (topicParam && !topic.trim()) {
        setTopic(decodeURIComponent(topicParam));
        // Optionally open topic finder modal if user wants to refine
        // setShowTopicFinder(true);
      }
    }
  }, []);

  // Auto-update word count and citation style based on project type
  useEffect(() => {
    if (currentType) {
      setTargetWordCount(currentType.typicalWordCount.min);
      setCitationStyle(currentType.citationStyles[0]);
    }
  }, [selectedType]);

  // Handle topic selection from TopicFinderModal
  const handleTopicSelect = (selectedTopic: string, suggestion?: any) => {
    setTopic(selectedTopic);
    // Optionally update project name if suggestion provided
    if (suggestion && !projectName.trim()) {
      setProjectName(suggestion.title);
    }
    // Update methodology if suggestion has relevant info
    if (suggestion?.gaps?.length > 0) {
      const methodologyGap = suggestion.gaps.find((g: any) => g.type === 'methodology');
      if (methodologyGap && !methodology) {
        // Extract methodology from gap description if possible
        const methodMatch = methodologyGap.description.match(/(qualitative|quantitative|mixed methods)/i);
        if (methodMatch) {
          setMethodology(methodMatch[1].toLowerCase());
        }
      }
    }
  };

  // Validate form
  const validateForm = () => {
    const errors: string[] = [];
    
    if (!projectName.trim()) errors.push('Project name is required');
    if (!topic.trim()) errors.push('Research topic is required');
    if (!methodology.trim()) errors.push('Research methodology is required');
    if (targetWordCount < 100) errors.push('Target word count should be at least 100');
    if (targetWordCount > 100000) errors.push('Target word count seems too high (max 100,000)');
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) {
      return;
    }

    setIsCreating(true);
    
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName.trim(),
          type: selectedType,
          topic: topic.trim(),
          targetWordCount: targetWordCount,
          citationStyle: citationStyle,
          methodology: methodology.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Track first project creation if server indicates it
        if (data.tracking?.trackEvent) {
          const { eventName, params } = data.tracking.trackEvent;
          trackFunnel.firstProjectCreated(params.user_id, params.project_type);
        }
        
        router.push(`/project/${data.project._id}`);
      } else {
        const error = await response.json();
        if (error.error === 'Project limit reached') {
          // Track paywall view
          trackFunnel.paywallView('project_limit', 'new_project');
          setLimitError(error.message || 'You have reached the maximum number of projects for your plan.');
          setShowLimitModal(true);
        } else {
          alert(`Error creating project: ${error.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert('An error occurred while creating the project');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <Sidebar />
      <MobileMenuButton />
      
      <div className="flex-1 md:ml-64 overflow-auto">
        <div className="max-w-6xl mx-auto p-4 pt-16 md:pt-10 md:p-10 space-y-6 md:space-y-10">
          <div className="flex items-center gap-4 text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 border-2 border-[hsl(var(--border-strong))] px-3 py-2 rounded-[var(--radius)] hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform duration-150"
            >
              ← Back
            </button>
            <span className="hidden sm:inline">New project workspace</span>
          </div>
          <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 md:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-4xl font-bold uppercase tracking-[0.12em]">Create New Project</h1>
                <p className="text-xs md:text-sm uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))] mt-2">
                  Start a new academic writing project with AI-powered guidance.
                </p>
              </div>
              <Link href="/dashboard/import">
                <Button variant="outline" className="w-full sm:w-auto">
                  Import Existing Document
                </Button>
              </Link>
            </div>
          </div>

          {/* New User Guide */}
          <Card className="p-4 md:p-6 border-[hsl(var(--accent))] bg-[hsl(var(--accent))]/10">
            <div className="flex items-start gap-3">
              <Info className="text-[hsl(var(--accent))] flex-shrink-0 mt-1" size={20} />
              <div className="flex-1">
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] mb-2">Getting Started</h3>
                <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] mb-3">
                  New to Akọ̀wé? Fill in your project details below. We&apos;ll create structured sections with AI-powered guidance to help you write your academic work.
                </p>
                <div className="text-xs uppercase tracking-[0.16em] space-y-1">
                  <p>• Choose your project type to get tailored sections</p>
                  <p>• Specify your research topic for contextual AI assistance</p>
                  <p>• Select citation style (APA, MLA, etc.) for proper formatting</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Card className="p-4 mb-4 md:mb-6 border-red-200 bg-red-50">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-red-800 mb-2">Please fix the following issues:</h3>
                  <ul className="text-sm text-red-700 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-start">
            {/* Left Column - Form Fields */}
            <div className="space-y-4 md:space-y-6 order-2 lg:order-1">
              {/* Project Name */}
              <Card className="p-4 md:p-6">
                <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                  <label className="font-semibold text-[hsl(var(--foreground))]">
                    Project Name *
                  </label>
                  <button type="button" className="relative group" aria-label="What is project name?">
                    <Info className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                    <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-6 whitespace-nowrap rounded bg-[hsl(var(--foreground))] px-2 py-1 text-[10px] text-[hsl(var(--surface))] opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity z-10">
                      A clear title that reflects your research focus.
                    </span>
                  </button>
                </div>
                <Input
                  type="text"
                  placeholder="e.g., Climate Change Impact Study"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="text-base md:text-lg"
                />
                <p className="text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] mt-3">
                  Choose a clear, descriptive name that reflects your research focus
                </p>
              </Card>

              {/* Topic */}
              <Card className="p-4 md:p-6">
                <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                  <label className="font-semibold text-[hsl(var(--foreground))]">
                    Research Topic *
                  </label>
                  <button type="button" className="relative group" aria-label="What is research topic?">
                    <Info className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                    <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-6 whitespace-nowrap rounded bg-[hsl(var(--foreground))] px-2 py-1 text-[10px] text-[hsl(var(--surface))] opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity z-10">
                      Be specific so Akowe can tailor suggestions.
                    </span>
                  </button>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="e.g., Impact of rising sea levels on coastal communities"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="text-base md:text-lg flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTopicFinder(true)}
                    className="px-4 py-2 border-[2px] border-[hsl(var(--border-strong))] rounded-[var(--radius)] bg-[hsl(var(--surface))] hover:bg-[hsl(var(--surface-muted))] transition-colors flex items-center gap-2 text-xs uppercase tracking-[0.14em] font-semibold"
                    title="Find unique research topics"
                  >
                    <Sparkles className="w-4 h-4 text-[hsl(var(--primary))]" />
                    <span className="hidden sm:inline">Find Unique Topic</span>
                    <span className="sm:hidden">Find</span>
                  </button>
                </div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] mt-3">
                  Be specific about what you&apos;re researching. This helps Akowe provide better suggestions.
                </p>
              </Card>

              {/* Target Word Count */}
              <Card className="p-4 md:p-6">
                <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                  <label className="font-semibold text-[hsl(var(--foreground))]">
                    Target Word Count
                  </label>
                  <button type="button" className="relative group" aria-label="What is target word count?">
                    <Info className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                    <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-6 whitespace-nowrap rounded bg-[hsl(var(--foreground))] px-2 py-1 text-[10px] text-[hsl(var(--surface))] opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity z-10">
                      Choose a target within the typical range for your type.
                    </span>
                  </button>
                </div>
                <Input
                  type="number"
                  placeholder="3000"
                  value={targetWordCount}
                  onChange={(e) => setTargetWordCount(parseInt(e.target.value) || 0)}
                  className="text-base md:text-lg"
                />
                <p className="text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] mt-3">
                  Typical range for {selectedType}: {currentType?.typicalWordCount.min.toLocaleString()} - {currentType?.typicalWordCount.max.toLocaleString()} words
                </p>
              </Card>

              {/* Citation Style */}
              <Card className="p-4 md:p-6">
                <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                  <label className="font-semibold text-[hsl(var(--foreground))]">
                    Citation Style
                  </label>
                  <button type="button" className="relative group" aria-label="What is citation style?">
                    <Info className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                    <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-6 whitespace-nowrap rounded bg-[hsl(var(--foreground))] px-2 py-1 text-[10px] text-[hsl(var(--surface))] opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity z-10">
                      Pick the style your department or journal requires.
                    </span>
                  </button>
                </div>
                <select
                  value={citationStyle}
                  onChange={(e) => setCitationStyle(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-[hsl(var(--border-strong))] rounded-[var(--radius)] bg-[hsl(var(--surface))] text-sm uppercase tracking-[0.16em] focus-visible:outline-2 focus-visible:outline-[hsl(var(--ring))] focus-visible:outline-offset-2"
                >
                  {currentType?.citationStyles.map(style => (
                    <option key={style} value={style}>{style}</option>
                  ))}
                </select>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] mt-3">
                  Common for {selectedType}: {currentType?.citationStyles.join(', ')}
                </p>
              </Card>

              {/* Methodology */}
              <Card className="p-4 md:p-6">
                <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                  <label className="font-semibold text-[hsl(var(--foreground))]">
                    Research Methodology *
                  </label>
                  <button type="button" className="relative group" aria-label="What is research methodology?">
                    <Info className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                    <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-6 whitespace-nowrap rounded bg-[hsl(var(--foreground))] px-2 py-1 text-[10px] text-[hsl(var(--surface))] opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity z-10">
                      Select your research approach
                    </span>
                  </button>
                </div>
                <select
                  value={methodology}
                  onChange={(e) => setMethodology(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-[hsl(var(--border-strong))] rounded-[var(--radius)] bg-[hsl(var(--surface))] text-base md:text-lg uppercase tracking-[0.08em]"
                >
                  <option value="">Select methodology...</option>
                  <option value="qualitative">Qualitative Research</option>
                  <option value="quantitative">Quantitative Research</option>
                  <option value="mixed methods">Mixed Methods</option>
                  <option value="literature review">Literature Review</option>
                  <option value="case study">Case Study</option>
                </select>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] mt-3">
                  Common for {currentType?.label.toLowerCase()}: {currentType?.commonMethodologies.join(', ')}
                </p>
              </Card>
            </div>

            {/* Right Column - Project Type & Insights */}
            <div className="space-y-4 md:space-y-6 order-1 lg:order-2">
              {/* Project Type Selection */}
              <Card className="p-4 md:p-6 space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-[hsl(var(--foreground))]">
                  Select Project Type
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                  {projectTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selectedType === type.type;
                    
                    return (
                      <button
                        key={type.type}
                        onClick={() => setSelectedType(type.type)}
                        className={cn(
                          'text-left p-3 md:p-4 border-2 rounded-[var(--radius)] transition-transform duration-150',
                          isSelected
                            ? 'border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] -translate-x-[0.125rem] -translate-y-[0.125rem] shadow-[6px_6px_0_rgba(29,41,57,0.14)]'
                            : 'border-[hsl(var(--border))] bg-[hsl(var(--surface))] hover:border-[hsl(var(--border-strong))] hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem]'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 md:w-12 md:h-12 border-2 border-[hsl(var(--border-strong))] rounded-[var(--radius)] bg-[hsl(var(--surface))] flex items-center justify-center flex-shrink-0">
                            <Icon size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs md:text-sm font-semibold uppercase tracking-[0.18em]">
                              {type.label}
                            </h4>
                            <p className="text-[10px] md:text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] truncate">
                              {type.description}
                            </p>
                          </div>
                          {isSelected && <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* Project Insights */}
              {currentType && (
                <Card className="p-4 md:p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-[hsl(var(--accent))]" />
                    <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-[hsl(var(--foreground))]">
                      Key Insights for {currentType.label}
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {currentType.insights.map((insight, index) => (
                      <li key={index} className="flex items-start gap-2 text-xs uppercase tracking-[0.18em] text-[hsl(var(--foreground))]">
                        <CheckCircle2 className="w-4 h-4 text-[hsl(var(--secondary))] mt-0.5 flex-shrink-0" />
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

            </div>
          </div>

          {/* Create Button */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 md:gap-4 pb-6 md:pb-0">
            <Button
              variant="secondary"
              onClick={() => router.back()}
              className="px-6 order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={validationErrors.length > 0 || isCreating}
              className="min-w-[180px] order-1 sm:order-2"
            >
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating Project...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Create Project
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Project Limit Modal */}
      {showLimitModal && (
        <div 
          className="fixed inset-0 bg-[hsl(var(--foreground))]/60 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowLimitModal(false);
            }
          }}
        >
          <div className="w-full max-w-md">
            <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-[var(--radius)] shadow-[10px_10px_0_rgba(29,41,57,0.2)] p-6 md:p-8 space-y-6 text-center">
              <div className="mx-auto w-14 h-14 md:w-16 md:h-16 border-[4px] border-[hsl(var(--border-strong))] rounded-[var(--radius)] flex items-center justify-center text-[hsl(var(--destructive))]">
                <X className="w-6 h-6 md:w-8 md:h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl md:text-2xl font-bold uppercase tracking-[0.16em]">
                  Project Limit Reached
                </h3>
                <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                  {limitError}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowLimitModal(false)}
                  className="flex-1 py-3 text-xs uppercase tracking-[0.2em]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setShowLimitModal(false);
                    router.push('/settings');
                  }}
                  className="flex-1 py-3 text-xs uppercase tracking-[0.2em]"
                >
                  Upgrade Plan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Topic Finder Modal */}
      <TopicFinderModal
        isOpen={showTopicFinder}
        onClose={() => setShowTopicFinder(false)}
        onSelectTopic={handleTopicSelect}
        initialTopic={topic}
        projectType={selectedType}
        methodology={methodology}
        userPlan={userPlan}
      />
    </div>
  );
}
