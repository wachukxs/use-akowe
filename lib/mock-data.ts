// Mock data for frontend-only integration
export interface MockProject {
  id: string;
  name: string;
  type: 'essay' | 'thesis' | 'journal' | 'research';
  topic: string;
  status: 'planning' | 'writing' | 'reviewing' | 'completed';
  createdAt: string;
  lastActivity: string;
  wordCount: number;
  targetWordCount: number;
  methodology?: string;
  citationStyle?: 'APA' | 'MLA' | 'Chicago' | 'Harvard';
  field?: string;
}

export interface MockResource {
  id: string;
  title: string;
  description: string;
  type: 'Guide' | 'Template' | 'Checklist' | 'Manual';
  category: 'Writing' | 'Citations' | 'Research' | 'Presentation' | 'Ethics';
  rating: number;
  downloads: number;
  lastUpdated: string;
  url: string;
  featured: boolean;
  projectTypes: string[];
  tags: string[];
}

export const mockProjects: MockProject[] = [
  {
    id: '1',
    name: 'Climate Change Impact on Agriculture',
    type: 'thesis',
    topic: 'Environmental Science',
    status: 'writing',
    createdAt: '2024-01-15',
    lastActivity: '2024-01-20',
    wordCount: 8500,
    targetWordCount: 15000,
    methodology: 'Mixed Methods',
    citationStyle: 'APA',
    field: 'Environmental Science'
  },
  {
    id: '2',
    name: 'Social Media and Mental Health',
    type: 'essay',
    topic: 'Psychology',
    status: 'planning',
    createdAt: '2024-01-18',
    lastActivity: '2024-01-19',
    wordCount: 0,
    targetWordCount: 3000,
    methodology: 'Literature Review',
    citationStyle: 'MLA',
    field: 'Psychology'
  },
  {
    id: '3',
    name: 'Machine Learning in Healthcare',
    type: 'journal',
    topic: 'Computer Science',
    status: 'reviewing',
    createdAt: '2024-01-10',
    lastActivity: '2024-01-21',
    wordCount: 12000,
    targetWordCount: 8000,
    methodology: 'Quantitative Research',
    citationStyle: 'APA',
    field: 'Computer Science'
  }
];

export const mockResources: MockResource[] = [
  {
    id: '1',
    title: 'Thesis Writing Guide',
    description: 'Complete guide to writing a successful thesis from start to finish',
    type: 'Guide',
    category: 'Writing',
    rating: 4.8,
    downloads: 1250,
    lastUpdated: '2024-01-15',
    url: '#',
    featured: true,
    projectTypes: ['thesis'],
    tags: ['thesis', 'writing', 'structure', 'academic']
  },
  {
    id: '2',
    title: 'APA Citation Style Manual',
    description: 'Comprehensive manual for APA 7th edition citation formatting',
    type: 'Manual',
    category: 'Citations',
    rating: 4.9,
    downloads: 2100,
    lastUpdated: '2024-01-10',
    url: '#',
    featured: true,
    projectTypes: ['thesis', 'journal', 'research'],
    tags: ['apa', 'citations', 'formatting', 'academic']
  },
  {
    id: '3',
    title: 'Literature Review Template',
    description: 'Structured template for conducting comprehensive literature reviews',
    type: 'Template',
    category: 'Research',
    rating: 4.7,
    downloads: 890,
    lastUpdated: '2024-01-08',
    url: '#',
    featured: false,
    projectTypes: ['thesis', 'research', 'journal'],
    tags: ['literature-review', 'research', 'template', 'academic']
  },
  {
    id: '4',
    title: 'Mixed Methods Research Checklist',
    description: 'Step-by-step checklist for conducting mixed methods research',
    type: 'Checklist',
    category: 'Research',
    rating: 4.6,
    downloads: 1560,
    lastUpdated: '2024-01-05',
    url: '#',
    featured: false,
    projectTypes: ['thesis', 'research'],
    tags: ['mixed-methods', 'research', 'methodology', 'checklist']
  },
  {
    id: '5',
    title: 'Environmental Science Writing Guide',
    description: 'Specialized writing guide for environmental science research',
    type: 'Guide',
    category: 'Writing',
    rating: 4.8,
    downloads: 750,
    lastUpdated: '2024-01-03',
    url: '#',
    featured: false,
    projectTypes: ['thesis', 'journal', 'research'],
    tags: ['environmental-science', 'writing', 'field-specific', 'academic']
  },
  {
    id: '6',
    title: 'Psychology Research Ethics Guide',
    description: 'Ethical guidelines and best practices for psychology research',
    type: 'Guide',
    category: 'Ethics',
    rating: 4.9,
    downloads: 3200,
    lastUpdated: '2024-01-01',
    url: '#',
    featured: true,
    projectTypes: ['thesis', 'research', 'journal'],
    tags: ['psychology', 'ethics', 'research', 'guidelines']
  }
];

// Project context management
export const getActiveProject = (): MockProject | null => {
  if (typeof window === 'undefined') return null;
  const activeProjectId = localStorage.getItem('activeProjectId');
  if (!activeProjectId) return null;
  return mockProjects.find(p => p.id === activeProjectId) || null;
};

export const setActiveProject = (projectId: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('activeProjectId', projectId);
};

export const getRecommendedResources = (project: MockProject | null): MockResource[] => {
  if (!project) return mockResources.filter(r => r.featured);
  
  return mockResources.filter(resource => 
    resource.projectTypes.includes(project.type) ||
    resource.tags.some(tag => 
      project.topic.toLowerCase().includes(tag) ||
      project.field?.toLowerCase().includes(tag) ||
      project.methodology?.toLowerCase().includes(tag)
    )
  ).sort((a, b) => b.rating - a.rating);
};

export const getProjectSpecificAIAdvice = (project: MockProject | null): string[] => {
  if (!project) return [
    "I can help you with any research questions you have!",
    "What type of project are you working on?",
    "Need help with writing, citations, or research methodology?"
  ];

  const advice: string[] = [];
  
  if (project.status === 'planning') {
    advice.push(`I see you're planning your ${project.type} on ${project.topic}. Let me help you structure your research approach.`);
    advice.push(`For ${project.type}s, I recommend starting with a literature review to establish your theoretical framework.`);
    if (project.methodology) {
      advice.push(`Your ${project.methodology} approach is excellent for this type of research. I can help you design your methodology.`);
    }
  } else if (project.status === 'writing') {
    advice.push(`Great progress on your ${project.type}! You're at ${Math.round((project.wordCount / project.targetWordCount) * 100)}% of your target word count.`);
    advice.push(`I can help you with ${project.citationStyle} citations and improve your writing structure.`);
    if (project.field) {
      advice.push(`As an expert in ${project.field}, I can provide field-specific writing guidance.`);
    }
  } else if (project.status === 'reviewing') {
    advice.push(`Time to polish your ${project.type}! I can help with final revisions and formatting.`);
    advice.push(`Let's review your ${project.citationStyle} citations and ensure everything is properly formatted.`);
  }

  return advice;
};
