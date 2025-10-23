'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Project {
  _id: string;
  name: string;
  type: string;
  topic: string;
  wordCount: number;
  targetWordCount: number;
  status: string;
  citationStyle: string;
  methodology: string;
  lastEditedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectContextType {
  activeProject: Project | null;
  projects: Project[];
  selectProject: (id: string | null) => void;
  loading: boolean;
  error: string | null;
  refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/projects');
      
      if (response.status === 401) {
        // User not authenticated - this is normal, not an error
        setProjects([]);
        setError(null);
        return;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch projects: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
      // Don't set projects to empty array on error, keep existing data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    const storedProjectId = localStorage.getItem('activeProjectId');
    if (storedProjectId && projects.length > 0) {
      const project = projects.find(p => p._id === storedProjectId);
      setActiveProject(project || null);
    }
  }, [projects]);

  const selectProject = (id: string | null) => {
    if (id === null) {
      setActiveProject(null);
      localStorage.removeItem('activeProjectId');
    } else {
      const project = projects.find(p => p._id === id);
      setActiveProject(project || null);
      if (project) {
        localStorage.setItem('activeProjectId', project._id);
      }
    }
  };

  const refreshProjects = async () => {
    await fetchProjects();
  };

  const contextValue = {
    activeProject,
    projects,
    selectProject,
    loading,
    error,
    refreshProjects
  };

  return (
    <ProjectContext.Provider value={contextValue}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjectContext() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjectContext must be used within a ProjectProvider');
  }
  return context;
}
