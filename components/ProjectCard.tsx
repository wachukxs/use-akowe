import Link from 'next/link';
import { Project, ProjectType } from '@/types';
import { cn, formatDate } from '@/lib/utils';
import { FileText, BookOpen, GraduationCap, FlaskConical, MoreVertical } from 'lucide-react';
import Card from './ui/Card';

const projectIcons: Record<ProjectType, React.ElementType> = {
  essay: FileText,
  thesis: GraduationCap,
  journal: BookOpen,
  research: FlaskConical,
};

const projectAccents: Record<ProjectType, string> = {
  essay: 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]',
  thesis: 'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]',
  journal: 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]',
  research: 'bg-[hsl(var(--surface-muted))] text-[hsl(var(--foreground))]',
};

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const Icon = projectIcons[project.type];
  const accentClass = projectAccents[project.type];

  return (
    <Link href={`/project/${project._id}`}>
      <Card hover className="p-6 cursor-pointer space-y-6">
        <div className="flex items-start justify-between">
          <div
            className={`w-14 h-14 rounded-[var(--radius)] border-2 border-[hsl(var(--border-strong))] flex items-center justify-center ${accentClass}`}
          >
            <Icon size={24} />
          </div>
          <button className="p-2 border-2 border-transparent rounded-[var(--radius)] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--border-strong))] hover:bg-[hsl(var(--surface-muted))] transition-transform duration-150 hover:-translate-y-[0.125rem] hover:-translate-x-[0.125rem]">
            <MoreVertical size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <h3 className="text-xl font-bold text-[hsl(var(--foreground))] leading-tight line-clamp-2 uppercase tracking-[0.08em]">
          {project.name}
        </h3>
        
          <div className="flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
            <span>{project.type}</span>
            <span>•</span>
            <span>{project.wordCount} words</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <span className="block text-[0.7rem] uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
              Sections
            </span>
            <span className="text-lg font-semibold text-[hsl(var(--foreground))]">
              {project.sections.length}
            </span>
          </div>
          <div className="space-y-1">
            <span className="block text-[0.7rem] uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
              Citations
            </span>
            <span className="text-lg font-semibold text-[hsl(var(--foreground))]">
              {project.citations.length}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t-2 border-[hsl(var(--border-strong))] pt-4">
          <span className={cn('px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] rounded-[var(--radius)] border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))]', {
            'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]': project.status === 'draft',
            'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))]': project.status === 'in_progress',
            'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]': project.status === 'completed',
            'bg-[hsl(var(--surface-muted))] text-[hsl(var(--foreground))]': project.status === 'archived',
          })}>
            {project.status.replace('_', ' ')}
          </span>
          <span className="text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
            {formatDate(new Date(project.lastEditedAt))}
          </span>
        </div>
      </Card>
    </Link>
  );
}

