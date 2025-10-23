import Link from 'next/link';
import { Project, ProjectType } from '@/types';
import { formatDate } from '@/lib/utils';
import { FileText, BookOpen, GraduationCap, FlaskConical, MoreVertical } from 'lucide-react';
import Card from './ui/Card';

const projectIcons: Record<ProjectType, React.ElementType> = {
  essay: FileText,
  thesis: GraduationCap,
  journal: BookOpen,
  research: FlaskConical,
};

const projectColors: Record<ProjectType, string> = {
  essay: 'from-accent-blue to-accent-teal',
  thesis: 'from-accent-purple to-accent-pink',
  journal: 'from-accent-orange to-accent-yellow',
  research: 'from-primary to-accent-purple',
};

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const Icon = projectIcons[project.type];
  const colorClass = projectColors[project.type];

  return (
    <Link href={`/project/${project._id}`}>
      <Card hover className="p-6 cursor-pointer">
        {/* Icon and Menu */}
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center`}>
            <Icon className="text-white" size={24} />
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <MoreVertical size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Project Info */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {project.name}
        </h3>
        
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <span className="capitalize">{project.type}</span>
          <span>•</span>
          <span>{project.wordCount} words</span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-gray-500">Sections: </span>
            <span className="font-medium text-gray-900">{project.sections.length}</span>
          </div>
          <div>
            <span className="text-gray-500">Citations: </span>
            <span className="font-medium text-gray-900">{project.citations.length}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            project.status === 'completed' ? 'bg-green-100 text-green-700' :
            project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {project.status.replace('_', ' ')}
          </span>
          <span className="text-xs text-gray-400">
            {formatDate(new Date(project.lastEditedAt))}
          </span>
        </div>
      </Card>
    </Link>
  );
}

