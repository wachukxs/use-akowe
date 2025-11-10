'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Sidebar from '@/components/Sidebar';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { ProjectType } from '@/types';
import { FileText, BookOpen, GraduationCap, FlaskConical, Sparkles, Lightbulb, Info, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Get current project type details
  const currentType = projectTypes.find(type => type.type === selectedType);

  // Auto-update word count and citation style based on project type
  useEffect(() => {
    if (currentType) {
      setTargetWordCount(currentType.typicalWordCount.min);
      setCitationStyle(currentType.citationStyles[0]);
    }
  }, [selectedType]);

  // Generate AI suggestions for the project
  const generateAISuggestions = async () => {
    if (!topic.trim() || !projectName.trim()) {
      alert('Please enter a project name and topic first');
      return;
    }

    setIsGeneratingSuggestions(true);
    try {
      const response = await fetch('/api/ai/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic,
          projectType: selectedType,
          projectName: projectName,
          methodology: methodology
        }),
      });

      if (response.ok) {
        const suggestions = await response.json();
        setAiSuggestions(suggestions);
      } else {
        console.error('Failed to generate AI suggestions');
      }
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
    } finally {
      setIsGeneratingSuggestions(false);
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
        router.push(`/project/${data.project._id}`);
      } else {
        const error = await response.json();
        if (error.error === 'Project limit reached') {
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
      
      <div className="flex-1 ml-64 overflow-auto">
        <div className="max-w-6xl mx-auto p-10 space-y-10">
          <div className="flex items-center gap-4 text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 border-2 border-[hsl(var(--border-strong))] px-3 py-2 rounded-[var(--radius)] hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform duration-150"
            >
              ← Back
            </button>
            <span>New project workspace</span>
          </div>
          <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-8 space-y-2">
            <h1 className="text-4xl font-bold uppercase tracking-[0.12em]">Create New Project</h1>
            <p className="text-sm uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
              Start a new academic writing project with AI-powered guidance.
            </p>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Card className="p-4 mb-6 border-red-200 bg-red-50">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left Column - Form Fields */}
            <div className="space-y-6">
              {/* Project Name */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                  <label className="font-semibold text-[hsl(var(--foreground))]">
                    Project Name *
                  </label>
                  <button type="button" className="relative group" aria-label="What is project name?">
                    <Info className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                    <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-6 whitespace-nowrap rounded bg-[hsl(var(--foreground))] px-2 py-1 text-[10px] text-[hsl(var(--surface))] opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
                      A clear title that reflects your research focus.
                    </span>
                  </button>
                </div>
                <Input
                  type="text"
                  placeholder="e.g., Climate Change Impact Study"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="text-lg"
                />
                <p className="text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] mt-3">
                  Choose a clear, descriptive name that reflects your research focus
                </p>
              </Card>

              {/* Topic */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                  <label className="font-semibold text-[hsl(var(--foreground))]">
                    Research Topic *
                  </label>
                  <button type="button" className="relative group" aria-label="What is research topic?">
                    <Info className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                    <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-6 whitespace-nowrap rounded bg-[hsl(var(--foreground))] px-2 py-1 text-[10px] text-[hsl(var(--surface))] opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
                      Be specific so Akowe can tailor suggestions.
                    </span>
                  </button>
                </div>
                <Input
                  type="text"
                  placeholder="e.g., &quot;Impact of rising sea levels on coastal communities&quot;"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="text-lg"
                />
                <p className="text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] mt-3">
                  Be specific about what you&apos;re researching. This helps Akowe provide better suggestions.
                </p>
              </Card>

              {/* Target Word Count */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                  <label className="font-semibold text-[hsl(var(--foreground))]">
                    Target Word Count
                  </label>
                  <button type="button" className="relative group" aria-label="What is target word count?">
                    <Info className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                    <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-6 whitespace-nowrap rounded bg-[hsl(var(--foreground))] px-2 py-1 text-[10px] text-[hsl(var(--surface))] opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
                      Choose a target within the typical range for your type.
                    </span>
                  </button>
                </div>
                <Input
                  type="number"
                  placeholder="3000"
                  value={targetWordCount}
                  onChange={(e) => setTargetWordCount(parseInt(e.target.value) || 0)}
                  className="text-lg"
                />
                <p className="text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] mt-3">
                  Typical range for {selectedType}: {currentType?.typicalWordCount.min.toLocaleString()} - {currentType?.typicalWordCount.max.toLocaleString()} words
                </p>
              </Card>

              {/* Citation Style */}
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                  <label className="font-semibold text-[hsl(var(--foreground))]">
                    Citation Style
                  </label>
                  <button type="button" className="relative group" aria-label="What is citation style?">
                    <Info className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                    <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-6 whitespace-nowrap rounded bg-[hsl(var(--foreground))] px-2 py-1 text-[10px] text-[hsl(var(--surface))] opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
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
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                  <label className="font-semibold text-[hsl(var(--foreground))]">
                    Research Methodology *
                  </label>
                  <button type="button" className="relative group" aria-label="What is research methodology?">
                    <Info className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                    <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-6 whitespace-nowrap rounded bg-[hsl(var(--foreground))] px-2 py-1 text-[10px] text-[hsl(var(--surface))] opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
                      Describe your approach, e.g. qualitative, quantitative, mixed methods.
                    </span>
                  </button>
                </div>
                <Input
                  type="text"
                  placeholder="e.g., Qualitative case study, Literature review, Experimental design"
                  value={methodology}
                  onChange={(e) => setMethodology(e.target.value)}
                  className="text-lg"
                />
                <p className="text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] mt-3">
                  Common methodologies: {currentType?.commonMethodologies.join(', ')}
                </p>
              </Card>
            </div>

            {/* Right Column - Project Type & Insights */}
            <div className="space-y-6">
              {/* Project Type Selection */}
              <Card className="p-6 space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-[hsl(var(--foreground))]">
                  Select Project Type
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {projectTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selectedType === type.type;
                    
                    return (
                      <button
                        key={type.type}
                        onClick={() => setSelectedType(type.type)}
                        className={cn(
                          'text-left p-4 border-2 rounded-[var(--radius)] transition-transform duration-150',
                          isSelected
                            ? 'border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] -translate-x-[0.125rem] -translate-y-[0.125rem] shadow-[6px_6px_0_rgba(29,41,57,0.14)]'
                            : 'border-[hsl(var(--border))] bg-[hsl(var(--surface))] hover:border-[hsl(var(--border-strong))] hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem]'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 border-2 border-[hsl(var(--border-strong))] rounded-[var(--radius)] bg-[hsl(var(--surface))] flex items-center justify-center">
                            <Icon size={20} />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold uppercase tracking-[0.18em]">
                              {type.label}
                            </h4>
                            <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                              {type.description}
                            </p>
                          </div>
                          {isSelected && <CheckCircle2 className="w-5 h-5" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* Project Insights */}
              {currentType && (
                <Card className="p-6 space-y-4">
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

              {/* AI Suggestions */}
              <Card className="p-6 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[hsl(var(--secondary))]" />
                    <h3 className="text-sm font-semibold uppercase tracking-[0.24em]">
                      Akọ̀wé Smart Suggestions
                    </h3>
                  </div>
                  <Button
                    onClick={generateAISuggestions}
                    disabled={isGeneratingSuggestions || !topic.trim() || !projectName.trim()}
                    size="sm"
                    className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em]"
                  >
                    {isGeneratingSuggestions ? 'Akowe is thinking...' : 'Get Akowe Help'}
                  </Button>
                </div>
                
                {aiSuggestions ? (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Suggested Outline:</h4>
                    <div className="space-y-2">
                      {aiSuggestions.map((section: any, index: number) => (
                        <div key={index} className="p-3 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-[var(--radius)]">
                          <h5 className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(var(--foreground))]">
                            {section.title}
                          </h5>
                          <p className="text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                            {section.summary}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                    Enter your project details and click "Get Akowe Help" to receive personalized suggestions for your research structure and approach.
                  </p>
                )}
              </Card>
            </div>
          </div>

          {/* Create Button */}
          <div className="flex justify-end gap-4">
            <Button
              variant="secondary"
              onClick={() => router.back()}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={validationErrors.length > 0 || isCreating}
              className="min-w-[180px]"
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
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowLimitModal(false);
            }
          }}
        >
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Project Limit Reached
              </h3>
              
              <p className="text-gray-600 mb-6">
                {limitError}
              </p>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowLimitModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setShowLimitModal(false);
                    router.push('/settings');
                  }}
                  className="flex-1"
                >
                  Upgrade Plan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

