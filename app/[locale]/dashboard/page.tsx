'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from '@/i18n/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Sidebar, { MobileMenuButton } from '@/components/Sidebar';
import ProjectCard from '@/components/ProjectCard';
import { Project } from '@/types';
import { Search, Grid, List, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import LeadMagnetContinuation from '@/components/LeadMagnetContinuation';
import Active37DiscountPopup from '@/components/Active37DiscountPopup';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showActive37Popup, setShowActive37Popup] = useState(false);
  const [active37Eligibility, setActive37Eligibility] = useState<{ eligible: boolean; activeDays?: number } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.email) {
      fetchProjects();
      checkActive37Eligibility();
    }
  }, [session]);

  // Check if user is eligible for ACTIVE37 discount
  const checkActive37Eligibility = async () => {
    if (!session?.user?.email) return;

    // IMPORTANT: Never show popup to Pro users (client-side check)
    const userPlan = (session.user as any)?.plan;
    if (userPlan && userPlan !== 'free') {
      return;
    }

    // Check if user has already dismissed permanently
    const dismissedPermanently = localStorage.getItem('akowe_active37_dismissed_permanent');
    if (dismissedPermanently === 'true') return;

    // Check if shown today
    const lastShownDate = localStorage.getItem('akowe_active37_last_shown');
    const today = new Date().toDateString();
    if (lastShownDate === today) return;

    try {
      const response = await fetch('/api/user/active-discount-eligibility');
      if (response.ok) {
        const data = await response.json();
        // Double-check: Only show if eligible AND still on free plan
        if (data.eligible && userPlan === 'free') {
          setActive37Eligibility(data);
          setShowActive37Popup(true);
          localStorage.setItem('akowe_active37_last_shown', today);
        }
      }
    } catch (error) {
      console.error('Error checking ACTIVE37 eligibility:', error);
    }
  };

  // Refresh projects when user returns to dashboard (e.g., from project page)
  useEffect(() => {
    const handleFocus = () => {
      if (session?.user?.email) {
        fetchProjects();
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && session?.user?.email) {
        fetchProjects();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        // console.log('Dashboard fetched projects:', data.projects?.length, 'projects');
        // console.log('Project citations:', data.projects?.map((p: Project) => ({ name: p.name, citations: p.citations?.length || 0 })));
        setProjects(data.projects || []);
      } else if (response.status === 401) {
        // User not authenticated - this is normal
        setProjects([]);
      } else {
        console.error('Error fetching projects:', response.status);
        setProjects([]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProjects = (projects || []).filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex h-screen bg-[hsl(var(--background))]">
        <Sidebar />
        <MobileMenuButton />
        <div className="flex-1 md:ml-64 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-[4px] border-[hsl(var(--secondary))] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs uppercase tracking-[0.28em] text-[hsl(var(--muted-foreground))]">
              {t('loadingWorkspace')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <Active37DiscountPopup
        isOpen={showActive37Popup}
        onClose={() => {
          setShowActive37Popup(false);
        }}
        onUpgrade={() => {
          router.push('/settings');
        }}
        activeDays={active37Eligibility?.activeDays || 0}
      />
      <Sidebar />
      <MobileMenuButton />
      <LeadMagnetContinuation />

      <div className="flex-1 md:ml-64 overflow-auto">
        <div className="max-w-7xl mx-auto p-4 pt-16 md:pt-10 md:p-10 space-y-6 md:space-y-10">
          <div className="grid grid-cols-12 gap-4 md:gap-6 items-stretch">
            <div className="col-span-12 lg:col-span-8 space-y-3 md:space-y-4">
              <span className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">
                {t('projectArchive')}
              </span>
              <h1 className="text-3xl md:text-5xl font-bold uppercase tracking-[0.12em] leading-tight">
                {t('title')}
              </h1>
              <p className="text-xs md:text-sm uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))] max-w-xl">
                {t('subtitle')}
              </p>
            </div>
            <div className="col-span-12 lg:col-span-4">
              <div className="h-full border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] p-4 md:p-6 flex flex-row lg:flex-col justify-between items-center lg:items-start gap-4">
                <span className="text-xs uppercase tracking-[0.32em] text-[hsl(var(--accent-foreground))]">
                  {t('activeCount')}
                </span>
                <span className="text-4xl md:text-6xl font-black text-[hsl(var(--accent-foreground))] leading-none">
                  {projects.length.toString().padStart(2, '0')}
                </span>
                <span className="text-[10px] uppercase tracking-[0.32em] text-[hsl(var(--accent-foreground))] hidden sm:block">
                  {t('projectsInWorkspace')}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 md:gap-6">
            <div className="col-span-12 lg:col-span-9">
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-3 md:p-5 flex flex-col md:flex-row gap-3 md:gap-4 md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" size={18} />
                  <input
                    type="text"
                    placeholder={t('searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] text-xs uppercase tracking-[0.24em] rounded-(--radius) focus-visible:outline-2 focus-visible:outline-[hsl(var(--ring))] focus-visible:outline-offset-2"
                  />
                </div>
                <div className="flex items-center gap-3 justify-end">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      'px-4 py-2 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) text-xs font-semibold uppercase tracking-[0.24em] transition-transform duration-150',
                      viewMode === 'grid'
                        ? 'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] -translate-x-[0.125rem] -translate-y-[0.125rem]'
                        : 'bg-[hsl(var(--surface))] text-[hsl(var(--muted-foreground))] hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem]'
                    )}
                  >
                    <Grid size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      'px-4 py-2 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) text-xs font-semibold uppercase tracking-[0.24em] transition-transform duration-150',
                      viewMode === 'list'
                        ? 'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] -translate-x-[0.125rem] -translate-y-[0.125rem]'
                        : 'bg-[hsl(var(--surface))] text-[hsl(var(--muted-foreground))] hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem]'
                    )}
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-3 space-y-3">
              <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 md:p-5 space-y-3">
                <span className="text-[10px] uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">
                  {t('quickActions')}
                </span>
                <button
                  onClick={() => router.push('/dashboard/new')}
                  className="w-full px-4 py-3 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) text-xs font-semibold uppercase tracking-[0.24em] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] transition-transform duration-150 hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem]"
                >
                  {t('createNewProject')}
                </button>
                <button
                  onClick={() => router.push('/dashboard/import')}
                  className="w-full px-4 py-3 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) text-xs font-semibold uppercase tracking-[0.24em] bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-muted))] transition-transform duration-150 hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem]"
                >
                  {t('importDocument')}
                </button>
                <button
                  onClick={() => router.push('/settings')}
                  className="w-full px-4 py-3 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) text-xs font-semibold uppercase tracking-[0.24em] bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-muted))] transition-transform duration-150 hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem]"
                >
                  {t('reviewPlans')}
                </button>
              </div>
            </div>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="border-[4px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] py-12 md:py-16 px-4 md:px-6 flex flex-col items-center gap-4 md:gap-6">
              <div className="w-20 h-20 md:w-24 md:h-24 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-muted))] flex items-center justify-center">
                <FileText className="text-[hsl(var(--secondary))]" size={32} />
              </div>
              <h3 className="text-xl md:text-2xl font-bold uppercase tracking-[0.16em] text-center">
                {searchQuery ? t('noProjectsFound') : t('noProjectsYet')}
              </h3>
              <p className="text-xs uppercase tracking-[0.28em] text-[hsl(var(--muted-foreground))] max-w-md text-center">
                {searchQuery ? t('emptyAdjustFilters') : t('emptyGetStarted')}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => router.push('/dashboard/new')}
                  className="px-6 py-3 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-(--radius) text-xs font-semibold uppercase tracking-[0.24em] transition-transform duration-150 hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem]"
                >
                  {t('createNewProject')}
                </button>
              )}
            </div>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6'
                  : 'space-y-4'
              }
            >
              {filteredProjects.map((project) => (
                <ProjectCard key={project._id} project={project} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
