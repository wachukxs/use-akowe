'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useRouter, Link } from '@/i18n/navigation';
import Sidebar, { MobileMenuButton } from '@/components/Sidebar';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { ProjectType } from '@/types';
import { FileText, BookOpen, GraduationCap, FlaskConical, Lightbulb, Info, CheckCircle2, AlertCircle, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import TopicFinderModal from '@/components/TopicFinderModal';
import GuidedFirstProject from '@/components/GuidedFirstProject';
import { trackFunnel } from '@/lib/gtag';

const projectTypeConfig: {
  type: ProjectType;
  icon: React.ElementType;
  typicalWordCount: { min: number; max: number };
}[] = [
  { type: 'essay', icon: FileText, typicalWordCount: { min: 1000, max: 5000 } },
  { type: 'thesis', icon: GraduationCap, typicalWordCount: { min: 15000, max: 50000 } },
  { type: 'journal', icon: BookOpen, typicalWordCount: { min: 3000, max: 8000 } },
  { type: 'research', icon: FlaskConical, typicalWordCount: { min: 5000, max: 15000 } },
];

export default function NewProjectPage() {
  const t = useTranslations('dashboardNew');
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
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [showGuidedModal, setShowGuidedModal] = useState(false);

  const projectTypes = useMemo(() => {
    return projectTypeConfig.map((config) => ({
      ...config,
      label: t(`projectTypes.${config.type}.label`),
      description: t(`projectTypes.${config.type}.description`),
      commonMethodologies: t.raw(`projectTypes.${config.type}.commonMethodologies`) as string[],
      citationStyles: t.raw(`projectTypes.${config.type}.citationStyles`) as string[],
      insights: t.raw(`projectTypes.${config.type}.insights`) as string[],
    }));
  }, [t]);

  // Get current project type details
  const currentType = projectTypes.find(type => type.type === selectedType);

  // Get user plan from session and check if first-time user
  useEffect(() => {
    if (session?.user) {
      // Plan is available in session token
      const plan = (session.user as any).plan || 'free';
      setUserPlan(plan as 'free' | 'pro' | 'team');
      
      // Check if user has any projects (first-time user detection)
      const checkFirstTimeUser = async () => {
        try {
          const response = await fetch('/api/projects');
          if (response.ok) {
            const data = await response.json();
            const projectCount = data.projects?.length || 0;
            const isFirstTime = projectCount === 0;
            setIsFirstTimeUser(isFirstTime);
            
            // Show guided modal if first-time user and hasn't seen it
            if (isFirstTime) {
              const hasSeen = localStorage.getItem('akowe_guided_first_project_seen');
              if (!hasSeen) {
                setShowGuidedModal(true);
              }
              
              // Pre-fill sensible defaults for first-time users
              setSelectedType('essay'); // Most common starting point
              setTargetWordCount(3000); // Already default
              setCitationStyle('APA'); // Already default
              // Don't pre-fill name/topic/methodology - let user fill these
            }
          }
        } catch (error) {
          console.error('Error checking project count:', error);
        }
      };
      
      checkFirstTimeUser();
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
    
    if (!projectName.trim()) errors.push(t('validationProjectNameRequired'));
    if (!topic.trim()) errors.push(t('validationTopicRequired'));
    if (!methodology.trim()) errors.push(t('validationMethodologyRequired'));
    if (targetWordCount < 100) errors.push(t('validationWordCountMin'));
    if (targetWordCount > 100000) errors.push(t('validationWordCountMax'));
    
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
          const { params } = data.tracking.trackEvent;
          trackFunnel.firstProjectCreated(params.user_id, params.project_type);
          
          // Mark guided flow as completed
          if (isFirstTimeUser) {
            localStorage.setItem('akowe_guided_first_project_seen', 'true');
            localStorage.setItem('akowe_first_project_completed', 'true');
          }
        }
        
        router.push(`/project/${data.project._id}`);
      } else {
        const error = await response.json();
        if (error.error === 'Project limit reached') {
          // Track paywall view
          trackFunnel.paywallView('project_limit', 'new_project');
          setLimitError(error.message || t('limitReachedDefault'));
          setShowLimitModal(true);
        } else {
          alert(`Error creating project: ${error.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert(t('errorCreatingProject'));
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
              className="flex items-center gap-2 border-2 border-[hsl(var(--border-strong))] px-3 py-2 rounded-(--radius) hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform duration-150"
            >
              {t('back')}
            </button>
            <span className="hidden sm:inline">{t('newProjectWorkspace')}</span>
          </div>
          <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 md:p-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-4xl font-bold uppercase tracking-[0.12em]">{t('title')}</h1>
                <p className="text-xs md:text-sm uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))] mt-2">
                  {t('subtitle')}
                </p>
              </div>
              <Link href="/dashboard/import">
                <Button variant="outline" className="w-full sm:w-auto">
                  {t('importExistingDocument')}
                </Button>
              </Link>
            </div>
          </div>

          {/* New User Guide - Enhanced for first-time users */}
          {isFirstTimeUser && (
            <Card className="p-4 md:p-6 border-4 border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10">
              <div className="flex items-start gap-3">
                <Sparkles className="text-[hsl(var(--primary))] flex-shrink-0 mt-1" size={24} />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] mb-2">{t('welcomeFirstTitle')}</h3>
                  <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] mb-3">
                    {t('welcomeFirstDescription')}
                  </p>
                  <div className="text-xs uppercase tracking-[0.16em] space-y-1">
                    <p>{t('welcomeFirstBullet1')}</p>
                    <p>{t('welcomeFirstBullet2')}</p>
                    <p>{t('welcomeFirstBullet3')}</p>
                    <p>{t('welcomeFirstBullet4')}</p>
                  </div>
                </div>
              </div>
            </Card>
          )}
          
          {!isFirstTimeUser && (
            <Card className="p-4 md:p-6 border-[hsl(var(--accent))] bg-[hsl(var(--accent))]/10">
              <div className="flex items-start gap-3">
                <Info className="text-[hsl(var(--accent))] flex-shrink-0 mt-1" size={20} />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] mb-2">{t('createNewInfoTitle')}</h3>
                  <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] mb-3">
                    {t('createNewInfoDescription')}
                  </p>
                  <div className="text-xs uppercase tracking-[0.16em] space-y-1">
                    <p>{t('createNewInfoBullet1')}</p>
                    <p>{t('createNewInfoBullet2')}</p>
                    <p>{t('createNewInfoBullet3')}</p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Card className="p-4 mb-4 md:mb-6 border-red-200 bg-red-50">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-red-800 mb-2">{t('validationTitle')}</h3>
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
                    {t('projectNameLabel')}
                  </label>
                  <button type="button" className="relative group" aria-label={t('projectNameAria')}>
                    <Info className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                    <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-6 whitespace-nowrap rounded bg-[hsl(var(--foreground))] px-2 py-1 text-[10px] text-[hsl(var(--surface))] opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity z-10">
                      {t('projectNameHint')}
                    </span>
                  </button>
                </div>
                <Input
                  type="text"
                  placeholder={t('projectNamePlaceholder')}
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className={cn(
                    "text-base md:text-lg",
                    isFirstTimeUser && !projectName && "ring-2 ring-[hsl(var(--primary))] ring-offset-2"
                  )}
                />
                <p className="text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] mt-3">
                  {t('projectNameHelp')}
                </p>
              </Card>

              {/* Topic */}
              <Card className="p-4 md:p-6">
                <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                  <label className="font-semibold text-[hsl(var(--foreground))]">
                    {t('researchTopicLabel')}
                  </label>
                  <button type="button" className="relative group" aria-label={t('researchTopicAria')}>
                    <Info className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                    <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-6 whitespace-nowrap rounded bg-[hsl(var(--foreground))] px-2 py-1 text-[10px] text-[hsl(var(--surface))] opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity z-10">
                      {t('researchTopicHint')}
                    </span>
                  </button>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder={t('researchTopicPlaceholder')}
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className={cn(
                      "text-base md:text-lg flex-1",
                      isFirstTimeUser && !topic && "ring-2 ring-[hsl(var(--primary))] ring-offset-2"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowTopicFinder(true)}
                    className="px-4 py-2 border-[2px] border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--surface))] hover:bg-[hsl(var(--surface-muted))] transition-colors flex items-center gap-2 text-xs uppercase tracking-[0.14em] font-semibold"
                    title={t('findTopicTitle')}
                  >
                    <Sparkles className="w-4 h-4 text-[hsl(var(--primary))]" />
                    <span className="hidden sm:inline">{t('findTopicButton')}</span>
                    <span className="sm:hidden">{t('findTopicButtonShort')}</span>
                  </button>
                </div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] mt-3">
                  {t('researchTopicHelp')}
                </p>
              </Card>

              {/* Target Word Count */}
              <Card className="p-4 md:p-6">
                <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                  <label className="font-semibold text-[hsl(var(--foreground))]">
                    {t('targetWordCountLabel')}
                  </label>
                  <button type="button" className="relative group" aria-label={t('targetWordCountAria')}>
                    <Info className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                    <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-6 whitespace-nowrap rounded bg-[hsl(var(--foreground))] px-2 py-1 text-[10px] text-[hsl(var(--surface))] opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity z-10">
                      {t('targetWordCountHint')}
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
                  {currentType && t('typicalRange', {
                    type: selectedType,
                    min: currentType.typicalWordCount.min.toLocaleString(),
                    max: currentType.typicalWordCount.max.toLocaleString(),
                  })}
                </p>
              </Card>

              {/* Citation Style */}
              <Card className="p-4 md:p-6">
                <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                  <label className="font-semibold text-[hsl(var(--foreground))]">
                    {t('citationStyleLabel')}
                  </label>
                  <button type="button" className="relative group" aria-label={t('citationStyleAria')}>
                    <Info className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                    <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-6 whitespace-nowrap rounded bg-[hsl(var(--foreground))] px-2 py-1 text-[10px] text-[hsl(var(--surface))] opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity z-10">
                      {t('citationStyleHint')}
                    </span>
                  </button>
                </div>
                <select
                  value={citationStyle}
                  onChange={(e) => setCitationStyle(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--surface))] text-sm uppercase tracking-[0.16em] focus-visible:outline-2 focus-visible:outline-[hsl(var(--ring))] focus-visible:outline-offset-2"
                >
                  {currentType?.citationStyles.map(style => (
                    <option key={style} value={style}>{style}</option>
                  ))}
                </select>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] mt-3">
                  {currentType && t('commonForTypeStyles', { type: selectedType, styles: currentType.citationStyles.join(', ') })}
                </p>
              </Card>

              {/* Methodology */}
              <Card className="p-4 md:p-6">
                <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                  <label className="font-semibold text-[hsl(var(--foreground))]">
                    {t('methodologyLabel')}
                  </label>
                  <button type="button" className="relative group" aria-label={t('methodologyAria')}>
                    <Info className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                    <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-6 whitespace-nowrap rounded bg-[hsl(var(--foreground))] px-2 py-1 text-[10px] text-[hsl(var(--surface))] opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity z-10">
                      {t('methodologyHint')}
                    </span>
                  </button>
                </div>
                <select
                  value={methodology}
                  onChange={(e) => setMethodology(e.target.value)}
                  className={cn(
                    "w-full px-4 py-3 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--surface))] text-base md:text-lg uppercase tracking-[0.08em]",
                    isFirstTimeUser && !methodology && "ring-2 ring-[hsl(var(--primary))] ring-offset-2"
                  )}
                >
                  <option value="">{t('selectMethodology')}</option>
                  {isFirstTimeUser && (
                    <option value="" disabled className="text-xs">
                      {t('methodologyTipOption')}
                    </option>
                  )}
                  <option value="qualitative">{t('methodologyQualitative')}</option>
                  <option value="quantitative">{t('methodologyQuantitative')}</option>
                  <option value="mixed methods">{t('methodologyMixedMethods')}</option>
                  <option value="literature review">{t('methodologyLiteratureReview')}</option>
                  <option value="case study">{t('methodologyCaseStudy')}</option>
                </select>
                {isFirstTimeUser && !methodology && (
                  <p className="text-xs uppercase tracking-[0.16em] text-[hsl(var(--primary))] mt-2 font-semibold">
                    {t('methodologyRequiredHint')}
                  </p>
                )}
                <p className="text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] mt-3">
                  {currentType && t('commonForTypeMethodologies', { type: currentType.label.toLowerCase(), methodologies: currentType.commonMethodologies.join(', ') })}
                </p>
              </Card>
            </div>

            {/* Right Column - Project Type & Insights */}
            <div className="space-y-4 md:space-y-6 order-1 lg:order-2">
              {/* Project Type Selection */}
              <Card className="p-4 md:p-6 space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-[hsl(var(--foreground))]">
                  {t('selectProjectType')}
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
                          'text-left p-3 md:p-4 border-2 rounded-(--radius) transition-transform duration-150',
                          isSelected
                            ? 'border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] -translate-x-[0.125rem] -translate-y-[0.125rem] shadow-[6px_6px_0_rgba(29,41,57,0.14)]'
                            : 'border-[hsl(var(--border))] bg-[hsl(var(--surface))] hover:border-[hsl(var(--border-strong))] hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem]'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 md:w-12 md:h-12 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--surface))] flex items-center justify-center flex-shrink-0">
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
                      {t('keyInsightsFor', { label: currentType.label })}
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
              {t('cancel')}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={validationErrors.length > 0 || isCreating}
              className="min-w-[180px] order-1 sm:order-2"
            >
              {isCreating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t('creatingProject')}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {t('createProject')}
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
            <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-(--radius) shadow-[10px_10px_0_rgba(29,41,57,0.2)] p-6 md:p-8 space-y-6 text-center">
              <div className="mx-auto w-14 h-14 md:w-16 md:h-16 border-4 border-[hsl(var(--border-strong))] rounded-(--radius) flex items-center justify-center text-[hsl(var(--destructive))]">
                <X className="w-6 h-6 md:w-8 md:h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl md:text-2xl font-bold uppercase tracking-[0.16em]">
                  {t('projectLimitReached')}
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
                  {t('cancel')}
                </Button>
                <Button
                  onClick={() => {
                    setShowLimitModal(false);
                    router.push('/settings');
                  }}
                  className="flex-1 py-3 text-xs uppercase tracking-[0.2em]"
                >
                  {t('upgradePlan')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Guided First Project Modal */}
      <GuidedFirstProject
        isOpen={showGuidedModal}
        onClose={() => {
          setShowGuidedModal(false);
          localStorage.setItem('akowe_guided_first_project_seen', 'true');
        }}
        onStart={() => {
          setShowGuidedModal(false);
          localStorage.setItem('akowe_guided_first_project_seen', 'true');
        }}
      />

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
