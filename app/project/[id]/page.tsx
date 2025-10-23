'use client';

import { useEffect, useState, use, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Sidebar from '@/components/Sidebar';
import { Project } from '@/types';
import { 
  BookOpen, GripVertical, Plus, Download, CheckCircle2, FileText, X, Send, Bot, 
  Edit3, Trash2, ChevronDown, ChevronRight, Target, Clock, BookMarked, Search, 
  Shield, Bold, Italic, List, Hash, Quote, Link, Sparkles, Copy, Save
} from 'lucide-react';
import Button from '@/components/ui/Button';

export default function ProjectEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { data: session, status } = useSession();
  const [project, setProject] = useState<Project | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiIsLoading, setAiIsLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState<Array<{ id: number; type: 'user' | 'assistant'; content: string; timestamp: Date }>>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isDiscoveringCitations, setIsDiscoveringCitations] = useState(false);
  const [discoveredCitations, setDiscoveredCitations] = useState<any[]>([]);
  const [showCitationDiscovery, setShowCitationDiscovery] = useState(false);
  const [citationSearchQuery, setCitationSearchQuery] = useState('');
  const [isSearchingCitations, setIsSearchingCitations] = useState(false);
  const [citationFilter, setCitationFilter] = useState<'all' | 'recent' | 'highly_cited'>('all');
  const [citationSortBy, setCitationSortBy] = useState<'relevance' | 'year' | 'title'>('relevance');
  const [isLoadingMoreCitations, setIsLoadingMoreCitations] = useState(false);
  const [currentCitationOffset, setCurrentCitationOffset] = useState(0);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);
  const [totalWordCount, setTotalWordCount] = useState(0);
  const [localWordCount, setLocalWordCount] = useState(0);
  const [localSectionContent, setLocalSectionContent] = useState<string>('');
  const [showManualCitationModal, setShowManualCitationModal] = useState(false);
  const [manualCitation, setManualCitation] = useState({
    title: '',
    authors: '',
    year: '',
    journal: '',
    doi: '',
    url: '',
    abstract: ''
  });
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDetectingCitations, setIsDetectingCitations] = useState(false);
  const [lastDetectionResult, setLastDetectionResult] = useState<{detectedCount: number, totalCount: number} | null>(null);
  const [hasContentToScan, setHasContentToScan] = useState(false);
  const [showPlagiarismModal, setShowPlagiarismModal] = useState(false);
  const [isCheckingPlagiarism, setIsCheckingPlagiarism] = useState(false);
  const [plagiarismResult, setPlagiarismResult] = useState<{
    matchPercentage: number;
    matches: Array<{ text: string; source: string; url?: string; similarity?: number }>;
    remaining: number;
    sources?: {
      crossref: number;
      arxiv: number;
      scholar: number;
    };
  } | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    resources: false,
    akowe: false,
  });

  // Helper functions
  const extractTextFromLexical = (content: string): string => {
    if (!content) return '';
    
    try {
      const parsed = JSON.parse(content);
      if (parsed.root && parsed.root.children) {
        return extractTextFromNodes(parsed.root.children);
      }
    } catch (e) {
      return content;
    }
    
    return content;
  };

  const extractTextFromNodes = (nodes: any[]): string => {
    let text = '';
    
    nodes.forEach(node => {
      if (node.type === 'paragraph' && node.children) {
        node.children.forEach((child: any) => {
          if (child.text) {
            text += child.text;
          }
        });
        text += '\n';
      } else if (node.type === 'heading' && node.children) {
        const headingLevel = node.tag || 'h1';
        const headingText = node.children.map((child: any) => child.text || '').join('');
        text += `${headingLevel === 'h1' ? '# ' : '## '}${headingText}\n`;
      } else if (node.children) {
        text += extractTextFromNodes(node.children);
      } else if (node.text) {
        text += node.text;
      }
    });
    
    return text.trim();
  };

  const countWords = (text: string): number => {
    if (!text) return 0;
    
    // If it's HTML, strip tags for word count
    let cleanText = text;
    if (text.includes('<') && text.includes('>')) {
      cleanText = text.replace(/<[^>]*>/g, ' ');
    }
    
    return cleanText.trim().split(/\s+/).filter(word => word.length > 0).length;
  };


  const cleanupSectionContent = (content: string): string => {
    if (!content) return '';
    
    try {
      const parsed = JSON.parse(content);
      if (parsed.root && parsed.root.children) {
        const extracted = extractTextFromLexical(content);
        // If Lexical JSON is empty (just empty paragraphs), return empty string
        if (!extracted.trim()) {
          return '';
        }
        return extracted;
      }
    } catch (e) {
      // Not JSON, could be HTML or plain text
      if (content.includes('<') && content.includes('>')) {
        // It's HTML, return as is
        return content;
      }
      // Plain text, return as is
      return content;
    }
    
    return content;
  };

  const calculateTotalWordCount = (project: Project): number => {
    if (!project?.sections) return 0;
    
    let totalWords = 0;
    project.sections.forEach(section => {
      const readableText = cleanupSectionContent(section.content || '');
      totalWords += countWords(readableText);
    });
    
    return totalWords;
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchProject();
    }
  }, [session, resolvedParams.id]);

  useEffect(() => {
    if (project) {
      const wordCount = calculateTotalWordCount(project);
      setTotalWordCount(wordCount);
      setLocalWordCount(wordCount);
      
      // Check if there's content to scan for citations
      const hasContent = project.sections?.some(section => 
        cleanupSectionContent(section.content || '').trim().length > 0
      ) || false;
      setHasContentToScan(hasContent);
    }
  }, [project]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${resolvedParams.id}`);
      if (response.ok) {
        const data = await response.json();
        const proj = data.project || data;
        setProject(proj);
        if (proj?.sections?.length > 0) {
          setActiveSection(proj.sections[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced section change handler
  const debounceTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  
  const handleSectionChange = useCallback(async (sectionId: string, content: string) => {
    if (!project) return;

    // Find the current section to check if content actually changed
    const currentSection = project.sections?.find(s => s.id === sectionId);
    if (!currentSection) return;

    // Check if content actually changed
    const currentContent = cleanupSectionContent(currentSection.content || '');
    if (currentContent === content) {
      return; // No change, don't save
    }

    // Update local word count immediately for responsive UI
    const updatedSections = (project.sections || []).map(section =>
      section.id === sectionId
        ? { ...section, content, updatedAt: new Date() }
        : section
    );
    const updatedProject = { ...project, sections: updatedSections };
    const newWordCount = calculateTotalWordCount(updatedProject);
    setLocalWordCount(newWordCount);

    // Update local section content for immediate word count display
    if (sectionId === activeSection) {
      setLocalSectionContent(content);
    }

    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Only save after user stops typing for 3 seconds - don't update state to prevent cursor reset
    debounceTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        await fetch(`/api/projects/${resolvedParams.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            sections: updatedSections,
            wordCount: newWordCount
          }),
        });

        // Don't update state during auto-save to prevent cursor reset
        // The content is already saved to the backend, state will be updated on next page load
      } catch (error) {
        console.error('Error saving section:', error);
      } finally {
        setIsSaving(false);
      }
    }, 3000); // 3 seconds after user stops typing
  }, [project, resolvedParams.id]);

  // AI Assistant functions
  const handleAIWrite = async (sectionId: string) => {
    if (!project || !aiInput.trim()) return;
    
    const section = project.sections.find(s => s.id === sectionId);
    if (!section) return;

    setAiIsLoading(true);
    
    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      type: 'user' as const,
      content: aiInput,
      timestamp: new Date()
    };
    setAiMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: aiInput,
          projectId: resolvedParams.id
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Add assistant response to chat
        const assistantMessage = {
          id: Date.now() + 1,
          type: 'assistant' as const,
          content: data.response,
          timestamp: new Date()
        };
        setAiMessages(prev => [...prev, assistantMessage]);
        
        setAiInput('');
      } else {
        const errorData = await response.json();
        console.error('AI Assistant error:', errorData);
        setShowSuccessMessage(errorData.error || 'AI Assistant error');
        setTimeout(() => setShowSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      setShowSuccessMessage('AI Assistant error. Please try again.');
      setTimeout(() => setShowSuccessMessage(''), 3000);
    } finally {
      setAiIsLoading(false);
    }
  };

  // Citation functions
  const discoverCitations = async (offset: number = 0, append: boolean = false) => {
    if (!project) return;
    
    if (offset === 0) {
      setIsDiscoveringCitations(true);
      setCurrentCitationOffset(0);
    } else {
      setIsLoadingMoreCitations(true);
    }
    
    try {
      const response = await fetch('/api/citations/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: project.topic,
          projectType: project.type,
          citationStyle: project.citationStyle,
          methodology: project.methodology || 'qualitative',
          limit: 8,
          offset: offset
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const newCitations = data.citations || [];
        
        if (append) {
          setDiscoveredCitations(prev => [...prev, ...newCitations]);
        } else {
          setDiscoveredCitations(newCitations);
        }
        
        setCurrentCitationOffset(offset + 8);
        
        if (offset === 0) {
          setShowCitationDiscovery(true);
        }
      }
    } catch (error) {
      console.error('Error discovering citations:', error);
    } finally {
      setIsDiscoveringCitations(false);
      setIsLoadingMoreCitations(false);
    }
  };

  const loadMoreCitations = () => {
    discoverCitations(currentCitationOffset, true);
  };

  const addCitationToEditor = async (citation: any) => {
    if (!project || !activeSection) return;

    const authorsText = Array.isArray(citation.authors) 
      ? citation.authors.join(', ') 
      : citation.authors || 'Unknown Author';
    const citationText = `(${authorsText}, ${citation.year})`;
    const section = project.sections.find(s => s.id === activeSection);
    if (!section) return;

    const newContent = section.content + (section.content ? ' ' : '') + citationText;
    handleSectionChange(activeSection, newContent);
    setShowCitationDiscovery(false);
    setShowSuccessMessage('Citation added to editor!');
    setTimeout(() => setShowSuccessMessage(''), 3000);
  };

  // Citation filtering and sorting functions
  const getFilteredAndSortedCitations = () => {
    let filtered = [...discoveredCitations];

    // Apply search filter
    if (citationSearchQuery.trim()) {
      const query = citationSearchQuery.toLowerCase();
      filtered = filtered.filter(citation => 
        citation.title?.toLowerCase().includes(query) ||
        citation.authors?.toString().toLowerCase().includes(query) ||
        citation.journal?.toLowerCase().includes(query) ||
        citation.abstract?.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (citationFilter === 'recent') {
      const currentYear = new Date().getFullYear();
      filtered = filtered.filter(citation => 
        citation.year && citation.year >= currentYear - 5
      );
    } else if (citationFilter === 'highly_cited') {
      // Assuming citations with more than 100 citations are "highly cited"
      filtered = filtered.filter(citation => 
        citation.citationCount && citation.citationCount > 100
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (citationSortBy) {
        case 'year':
          return (b.year || 0) - (a.year || 0);
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'relevance':
        default:
          // Sort by relevance (could be based on citation count, year, etc.)
          const aScore = (a.citationCount || 0) + ((a.year || 0) - 2000) / 10;
          const bScore = (b.citationCount || 0) + ((b.year || 0) - 2000) / 10;
          return bScore - aScore;
      }
    });

    return filtered;
  };

  // Section management functions
  const addNewSection = async () => {
    if (!project) return;

    const newSection = {
      id: `section_${Date.now()}`,
      type: 'custom' as const,
      title: 'New Section',
      content: '',
      order: (project.sections?.length || 0) + 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedSections = [...(project.sections || []), newSection];
    const updatedProject = { ...project, sections: updatedSections };

    setProject(updatedProject);
    setActiveSection(newSection.id);
    setEditingSectionId(newSection.id);
    setEditingTitle('New Section');

    // Save to backend
    try {
      await fetch(`/api/projects/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: updatedSections }),
      });
    } catch (error) {
      console.error('Error adding section:', error);
    }
  };

  const updateSectionTitle = async (sectionId: string, newTitle: string) => {
    if (!project || !newTitle.trim()) return;

    const updatedSections = (project.sections || []).map(section =>
      section.id === sectionId
        ? { ...section, title: newTitle.trim(), updatedAt: new Date() }
        : section
    );

    const updatedProject = { ...project, sections: updatedSections };
    setProject(updatedProject);
    setEditingSectionId(null);

    // Save to backend
    try {
      await fetch(`/api/projects/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: updatedSections }),
      });
    } catch (error) {
      console.error('Error updating section title:', error);
    }
  };

  const deleteSection = async (sectionId: string) => {
    if (!project) return;

    const updatedSections = (project.sections || []).filter(s => s.id !== sectionId);
    const updatedProject = { ...project, sections: updatedSections };
    
    setProject(updatedProject);
    setSectionToDelete(null);
    
    // Set active section to first available
    if (updatedSections.length > 0) {
      setActiveSection(updatedSections[0].id);
    } else {
      setActiveSection(null);
    }

    // Save to backend
    try {
      await fetch(`/api/projects/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: updatedSections }),
      });
    } catch (error) {
      console.error('Error deleting section:', error);
    }
  };

  // Plagiarism check function
  const checkPlagiarism = async () => {
    if (!project) return;

    setIsCheckingPlagiarism(true);
    try {
      const allContent = (project.sections || [])
        .map(section => cleanupSectionContent(section.content || ''))
        .join('\n\n');

      // Check if there's content to analyze
      if (!allContent.trim()) {
        setShowSuccessMessage('No content available to check for plagiarism. Please add some content to your sections first.');
        setTimeout(() => setShowSuccessMessage(''), 5000);
        setIsCheckingPlagiarism(false);
        return;
      }

      const response = await fetch('/api/plagiarism/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectId: resolvedParams.id,
          text: allContent 
        }),
      });

        if (response.ok) {
          const data = await response.json();
        setPlagiarismResult(data);
        setShowPlagiarismModal(true);
      } else {
        const errorData = await response.json();
        setShowSuccessMessage(errorData.error || 'Plagiarism check failed');
        setTimeout(() => setShowSuccessMessage(''), 3000);
        }
      } catch (error) {
      console.error('Error checking plagiarism:', error);
      setShowSuccessMessage('Plagiarism check failed. Please try again.');
      setTimeout(() => setShowSuccessMessage(''), 3000);
    } finally {
      setIsCheckingPlagiarism(false);
    }
  };

  // Manual citation function
  const addManualCitation = async () => {
    if (!project || !manualCitation.title.trim()) return;

    const newCitation = {
      id: `manual_${Date.now()}`,
      title: manualCitation.title,
      authors: manualCitation.authors.split(',').map(a => a.trim()),
      year: parseInt(manualCitation.year) || new Date().getFullYear(),
      journal: manualCitation.journal || 'Unknown Journal',
      doi: manualCitation.doi,
      url: manualCitation.url,
      citationKey: `cite_${Date.now()}`,
      citationText: `(${manualCitation.authors}, ${manualCitation.year})`,
      addedAt: new Date()
    };
    
    const updatedCitations = [...(project.citations || []), newCitation];
    const updatedProject = { ...project, citations: updatedCitations };
    setProject(updatedProject);
    setShowManualCitationModal(false);
    setManualCitation({ title: '', authors: '', year: '', journal: '', doi: '', url: '', abstract: '' });
    
    // Save to backend
    try {
      await fetch(`/api/projects/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ citations: updatedCitations }),
      });
    } catch (error) {
      console.error('Error adding manual citation:', error);
    }
  };

  // Citation detection function
  const detectCitations = async () => {
    if (!project) return;
    
    // Check if there's content to scan
    if (!hasContentToScan) {
      setShowSuccessMessage('No content available to scan for citations. Please add some content to your sections first.');
      setTimeout(() => setShowSuccessMessage(''), 5000);
      return;
    }
    
    setIsDetectingCitations(true);
    try {
      const response = await fetch(`/api/projects/${resolvedParams.id}/detect-citations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const data = await response.json();
        setLastDetectionResult(data);
        
        // Update project state immediately with the returned data
        if (data.project) {
          setProject(data.project);
          // Update word count with new project data
          const wordCount = calculateTotalWordCount(data.project);
          setTotalWordCount(wordCount);
          setLocalWordCount(wordCount);
        }
        
        if (data.detectedCount > 0) {
          setShowSuccessMessage(`✅ Successfully detected ${data.detectedCount} citations from your content`);
        } else {
          setShowSuccessMessage(`No citations detected in your content. Try adding more specific academic content.`);
        }
        setTimeout(() => setShowSuccessMessage(''), 5000);
      } else {
        let errorMessage = 'Citation detection failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        setShowSuccessMessage(`❌ ${errorMessage}`);
        setTimeout(() => setShowSuccessMessage(''), 5000);
      }
    } catch (error) {
      console.error('Error detecting citations:', error);
      setShowSuccessMessage('❌ Citation detection failed. Please check your connection and try again.');
      setTimeout(() => setShowSuccessMessage(''), 5000);
    } finally {
      setIsDetectingCitations(false);
    }
  };

  // Export functions
  const handleExport = async (format: 'pdf' | 'docx' | 'txt') => {
    if (!project) return;
    
    setIsExporting(true);
    try {
      const response = await fetch(`/api/projects/${resolvedParams.id}/export?format=${format}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Export failed');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
      a.download = `${project.name}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setShowSuccessMessage(`Project exported as ${format.toUpperCase()} successfully!`);
      setTimeout(() => setShowSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Export error:', error);
      setShowSuccessMessage('Export failed. Please try again.');
      setTimeout(() => setShowSuccessMessage(''), 3000);
    } finally {
      setIsExporting(false);
      setShowExportModal(false);
    }
  };

  // Update local section content when active section changes
  useEffect(() => {
    if (project && activeSection) {
      const activeS = project.sections?.find(s => s.id === activeSection);
      if (activeS) {
        setLocalSectionContent(activeS.content || '');
      }
    }
  }, [project, activeSection]);

  if (isLoading) {
  return (
      <div className="flex h-screen">
      <Sidebar />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
                </div>
                </div>
              </div>
    );
  }

  const activeS = project?.sections?.find(s => s.id === activeSection);

  if (!project) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Project not found</h1>
            <Button onClick={() => router.push('/dashboard')}>
              Back to Dashboard
                </Button>
              </div>
            </div>
          </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className={`flex-1 ml-64 overflow-y-auto transition-all duration-300 ${isAIDrawerOpen ? 'mr-96' : ''}`}>
        <div className="max-w-7xl mx-auto p-8">
          {/* Project Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
            <p className="text-gray-600">
              {project.type} • {localWordCount} / {project.targetWordCount} words • {project.citationStyle}
            </p>
            <div className="h-1 bg-gradient-to-r from-purple-500 to-red-500 rounded-full my-4" />
              </div>

          <div className="grid grid-cols-12 gap-8">
            {/* Left Column - Sections List */}
            <div className="col-span-3">
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Sections</h3>
                  <button 
                    onClick={addNewSection}
                    className="p-1 hover:bg-gray-100 rounded-full"
                  >
                    <Plus className="h-5 w-5 text-gray-500" />
              </button>
            </div>
                <div className="space-y-2">
                  {project.sections?.map((section) => (
                    <div
                  key={section.id}
                      className={`w-full px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 group ${
                    activeSection === section.id
                          ? 'bg-purple-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                      <button
                        onClick={() => setActiveSection(section.id)}
                        className="flex items-center gap-2 flex-1 text-left"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      {editingSectionId === section.id ? (
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onBlur={() => {
                              if (editingTitle.trim()) {
                                updateSectionTitle(section.id, editingTitle);
                              } else {
                                setEditingSectionId(null);
                              }
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && editingTitle.trim()) {
                                updateSectionTitle(section.id, editingTitle);
                              } else if (e.key === 'Escape') {
                                setEditingSectionId(null);
                                setEditingTitle(section.title);
                              }
                            }}
                            className="bg-transparent border-none outline-none flex-1 text-sm"
                            autoFocus
                            style={{ minWidth: '100px' }}
                          />
                        ) : (
                          <span 
                            className="flex-1 cursor-pointer hover:bg-gray-200 px-1 py-0.5 rounded"
                            onDoubleClick={() => {
                              setEditingSectionId(section.id);
                              setEditingTitle(section.title);
                            }}
                          >
                            {section.title}
                          </span>
                        )}
                          </button>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                          onClick={() => {
                            setEditingSectionId(section.id);
                            setEditingTitle(section.title);
                          }}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Edit3 className="h-3 w-3" />
                            </button>
                            <button
                          onClick={() => setSectionToDelete(section.id)}
                          className="p-1 hover:bg-red-200 rounded text-red-600"
                            >
                          <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                    </div>
              ))}
            </div>
          </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
            <Button
                    onClick={() => discoverCitations()}
                    disabled={isDiscoveringCitations}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
                  >
                    <BookOpen className="h-4 w-4" />
                    {isDiscoveringCitations ? 'Finding...' : 'Find Citations'}
            </Button>
                  <Button
                    onClick={() => setShowManualCitationModal(true)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Manual Citation
                  </Button>
                    <Button
                    onClick={detectCitations}
                      disabled={isDetectingCitations || !hasContentToScan}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white flex items-center gap-2"
                  >
                    <BookMarked className="h-4 w-4" />
                    {isDetectingCitations ? 'Scanning...' : hasContentToScan ? 'Scan for Citations' : 'No Content to Scan'}
                    </Button>
            <Button
                    onClick={checkPlagiarism}
              disabled={isCheckingPlagiarism}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    {isCheckingPlagiarism ? 'Checking...' : 'Check Plagiarism'}
            </Button>
                </div>
          </div>
        </div>

            {/* Right Column - Editor */}
            <div className="col-span-9">
              {activeS && (
                <div className="bg-white rounded-lg border border-gray-200 mb-8">
                  <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">{activeS.title}</h2>
                      <button
                        onClick={() => setIsAIDrawerOpen(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                      >
                        <Bot className="h-4 w-4" />
                        Ask Akowe
                      </button>
                </div>
                    <div className="border border-gray-200 rounded-lg">
                      {/* Simple Toolbar */}
                      <div className="border-b border-gray-200 p-2 flex items-center gap-2 bg-gray-50">
                        <button
                          onClick={() => document.execCommand('bold')}
                          className="p-1 hover:bg-gray-200 rounded"
                          title="Bold"
                        >
                          <Bold className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => document.execCommand('italic')}
                          className="p-1 hover:bg-gray-200 rounded"
                          title="Italic"
                        >
                          <Italic className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => document.execCommand('insertUnorderedList')}
                          className="p-1 hover:bg-gray-200 rounded"
                          title="Bullet List"
                        >
                          <List className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            const selection = window.getSelection();
                            if (selection && selection.rangeCount > 0) {
                              const range = selection.getRangeAt(0);
                              const heading = document.createElement('h3');
                              heading.textContent = selection.toString() || 'Heading';
                              range.deleteContents();
                              range.insertNode(heading);
                            }
                          }}
                          className="p-1 hover:bg-gray-200 rounded"
                          title="Heading"
                        >
                          <Hash className="h-4 w-4" />
                        </button>
                        <div className="flex-1"></div>
                        <span className="text-xs text-gray-500">
                          {countWords(cleanupSectionContent(localSectionContent || ''))} words
                        </span>
            </div>

                      {/* Editor */}
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onInput={(e) => {
                          const content = e.currentTarget.innerHTML;
                          handleSectionChange(activeS.id, content);
                        }}
                        className="w-full min-h-[400px] p-4 focus:outline-none text-gray-900 leading-relaxed"
                        style={{ fontFamily: 'inherit' }}
                        key={activeS.id}
                        ref={(el) => {
                          if (el) {
                            const newContent = cleanupSectionContent(activeS.content || '') || '<p><br></p>';
                            const currentContent = el.innerHTML;
                            
                            // Only update if this is initialization OR if content has significantly changed
                            // (e.g., from citation detection, not from user typing)
                            if (!el.dataset.initialized || 
                                (currentContent && newContent && 
                                 Math.abs(currentContent.length - newContent.length) > 50)) {
                              el.innerHTML = newContent;
                              el.dataset.initialized = 'true';
                            }
                          }
                        }}
              />
                    </div>
                  </div>
                  </div>
            )}

              {/* Writing Progress */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Writing Progress</h3>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                  <div
                    className="bg-purple-500 h-2.5 rounded-full"
                    style={{ width: `${Math.min(100, (localWordCount / (project.targetWordCount || 1)) * 100)}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">{localWordCount} words written</p>
              </div>

              {/* Summary Statistics */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                  <h4 className="text-xl font-bold text-gray-900">{project.sections?.length || 0}</h4>
                  <p className="text-sm text-gray-600">Sections</p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                  <h4 className="text-xl font-bold text-gray-900">{project.citations?.length || 0}</h4>
                  <p className="text-sm text-gray-600">Total Citations</p>
                  <p className="text-xs text-gray-500">
                    {lastDetectionResult ? `${lastDetectionResult.detectedCount} auto-detected` : '0 auto-detected'}
                  </p>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                  <h4 className="text-xl font-bold text-gray-900">{Math.round((localWordCount / (project.targetWordCount || 1)) * 100)}%</h4>
                  <p className="text-sm text-gray-600">Progress</p>
                  <p className="text-xs text-gray-500">Word count target</p>
                </div>
              </div>

              {/* Progress Banner */}
              <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white p-6 rounded-xl text-center">
                <p className="font-semibold">Excellent progress! You're on a roll</p>
                  </div>
                  </div>
                </div>
                  </div>
                </div>

      {/* AI Assistant Side Panel */}
      {isAIDrawerOpen && (
        <div className="fixed top-0 right-0 w-96 h-full bg-white border-l border-gray-200 z-40 flex flex-col shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Akowe Assistant</h3>
                  <p className="text-purple-100 text-sm">Your AI writing companion</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setAiMessages([])}
                  className="text-purple-200 hover:text-white text-sm px-3 py-1 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"
                >
                  Clear
                </button>
                <button 
                  onClick={() => setIsAIDrawerOpen(false)}
                  className="text-purple-200 hover:text-white p-1 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {/* Welcome Message */}
            {aiMessages.length === 0 && (
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        Hi! I'm Akowe, your AI writing assistant. I can help you with:
                      </p>
                      <ul className="text-xs text-gray-600 mt-2 space-y-1">
                        <li>• Improving structure and flow</li>
                        <li>• Enhancing wording and clarity</li>
                        <li>• Generating content for sections</li>
                        <li>• Research and citation suggestions</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 px-1">Quick suggestions:</p>
                  <div className="grid gap-2">
                    <button 
                      onClick={() => setAiInput('Help me improve the structure of this section')}
                      className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors text-sm"
                    >
                      <span className="font-medium text-gray-900">📝</span> Improve section structure
                    </button>
                    <button 
                      onClick={() => setAiInput('Suggest better wording for this paragraph')}
                      className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors text-sm"
                    >
                      <span className="font-medium text-gray-900">✨</span> Enhance wording
                    </button>
                    <button 
                      onClick={() => setAiInput('Generate a conclusion for this section')}
                      className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors text-sm"
                    >
                      <span className="font-medium text-gray-900">🎯</span> Generate conclusion
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Chat Messages */}
            {aiMessages.length > 0 && (
              <div className="space-y-4">
                {aiMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                      {message.type === 'assistant' && (
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                            <Bot className="h-3 w-3 text-purple-600" />
                          </div>
                          <span className="text-xs text-gray-500 font-medium">Akowe</span>
                        </div>
                      )}
                      <div
                        className={`p-3 rounded-2xl ${
                          message.type === 'user'
                            ? 'bg-purple-600 text-white rounded-br-md'
                            : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md shadow-sm'
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                        {message.type === 'assistant' && (
                          <button 
                            onClick={() => {
                              if (activeS) {
                                const currentContent = cleanupSectionContent(activeS.content || '');
                                const newContent = currentContent + (currentContent ? '\n\n' : '') + message.content;
                                handleSectionChange(activeS.id, newContent);
                                setShowSuccessMessage('✅ AI response inserted into section!');
                                setTimeout(() => setShowSuccessMessage(''), 3000);
                              }
                            }}
                            className="mt-2 text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                          >
                            <Plus className="h-3 w-3" />
                            Insert into section
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1 px-1">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                
                {aiIsLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%]">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                          <Bot className="h-3 w-3 text-purple-600" />
                        </div>
                        <span className="text-xs text-gray-500 font-medium">Akowe</span>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md p-3 shadow-sm">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-sm text-gray-600">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-200">
            {/* Usage Info */}
            <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-between text-xs">
                <span className="text-yellow-800">
                  Free Plan: 1,500 words/day
                </span>
                <button className="text-yellow-700 hover:text-yellow-800 font-medium">
                  Upgrade
                </button>
              </div>
            </div>
            
            {/* Input Field */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleAIWrite(activeS?.id || '')}
                  placeholder={`Ask about "${activeS?.title || 'Introduction'}"...`}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
                <button
                  onClick={() => handleAIWrite(activeS?.id || '')}
                  disabled={aiIsLoading || !aiInput.trim()}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 px-1">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      )}


      {/* Citation Discovery Modal */}
      {showCitationDiscovery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">Research Citations</h3>
                  <p className="text-purple-100 mt-1">Found {discoveredCitations.length} relevant citations for your research</p>
                </div>
                <button
                  onClick={() => setShowCitationDiscovery(false)}
                  className="text-white hover:text-purple-200 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search Input */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={citationSearchQuery}
                      onChange={(e) => setCitationSearchQuery(e.target.value)}
                      placeholder="Search citations by title, author, journal, or keywords..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Filter Dropdown */}
                <div className="flex gap-3">
                  <select
                    value={citationFilter}
                    onChange={(e) => setCitationFilter(e.target.value as any)}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                  >
                    <option value="all">All Citations</option>
                    <option value="recent">Recent (Last 5 years)</option>
                    <option value="highly_cited">Highly Cited</option>
                  </select>

                  <select
                    value={citationSortBy}
                    onChange={(e) => setCitationSortBy(e.target.value as any)}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                  >
                    <option value="relevance">Sort by Relevance</option>
                    <option value="year">Sort by Year</option>
                    <option value="title">Sort by Title</option>
                  </select>
                </div>
              </div>

              {/* Results Summary */}
              <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                <span>
                  Showing {getFilteredAndSortedCitations().length} citations
                  {!citationSearchQuery && citationFilter === 'all' && citationSortBy === 'relevance' && (
                    <span className="text-gray-500"> • Loaded {discoveredCitations.length} total</span>
                  )}
                </span>
                {citationSearchQuery && (
                  <button
                    onClick={() => setCitationSearchQuery('')}
                    className="text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Clear search
                  </button>
                )}
              </div>
            </div>

            {/* Citations List */}
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              {getFilteredAndSortedCitations().length > 0 ? (
                <div className="grid gap-6">
                  {getFilteredAndSortedCitations().map((citation, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2 leading-tight">
                            {citation.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Authors:</span>
                              <span>
                                {Array.isArray(citation.authors) 
                                  ? citation.authors.slice(0, 3).join(', ') + (citation.authors.length > 3 ? ' et al.' : '')
                                  : citation.authors || 'Unknown Author'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Year:</span>
                              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                                {citation.year || 'N/A'}
                              </span>
                            </div>
                            {citation.citationCount && (
                              <div className="flex items-center gap-1">
                                <span className="font-medium">Citations:</span>
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                  {citation.citationCount}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          {citation.url && (
                            <a
                              href={citation.url}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="View Source"
                            >
                              <Link className="h-4 w-4" />
                            </a>
                          )}
                          <button
                            onClick={() => addCitationToEditor(citation)}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Add Citation
                          </button>
                        </div>
                      </div>

                      {citation.journal && (
                        <p className="text-sm text-gray-500 mb-3">
                          <span className="font-medium">Journal:</span> {citation.journal}
                        </p>
                      )}

                      {citation.abstract && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                            {citation.abstract}
                          </p>
                        </div>
                      )}

                      {citation.doi && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="font-medium">DOI:</span>
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {citation.doi}
                          </code>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Find More Button */}
                  {!citationSearchQuery && citationFilter === 'all' && citationSortBy === 'relevance' && (
                    <div className="flex justify-center pt-6">
                      <button
                        onClick={loadMoreCitations}
                        disabled={isLoadingMoreCitations}
                        className="bg-white border-2 border-purple-600 text-purple-600 hover:bg-purple-50 disabled:bg-gray-100 disabled:border-gray-300 disabled:text-gray-400 px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2"
                      >
                        {isLoadingMoreCitations ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                            Loading 8 more...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4" />
                            Find More Citations
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No citations found</h3>
                  <p className="text-gray-500 mb-4">
                    {citationSearchQuery 
                      ? `No citations match your search "${citationSearchQuery}"`
                      : 'No citations available for the current filters'
                    }
                  </p>
                  {citationSearchQuery && (
                    <button
                      onClick={() => setCitationSearchQuery('')}
                      className="text-purple-600 hover:text-purple-700 font-medium"
                    >
                      Clear search to see all citations
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Export Project</h3>
              <div className="space-y-3">
              <button
                  onClick={() => handleExport('pdf')}
                  disabled={isExporting}
                  className="w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-3"
                >
                  <FileText className="h-5 w-5 text-red-500" />
                  <div className="text-left">
                    <div className="font-medium">PDF Document</div>
                    <div className="text-sm text-gray-500">Portable Document Format</div>
                </div>
                </button>

                <button
                  onClick={() => handleExport('docx')}
                  disabled={isExporting}
                  className="w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-3"
                >
                  <FileText className="h-5 w-5 text-blue-500" />
                  <div className="text-left">
                    <div className="font-medium">Word Document</div>
                    <div className="text-sm text-gray-500">Microsoft Word Format</div>
                </div>
                </button>

                <button
                  onClick={() => handleExport('txt')}
                  disabled={isExporting}
                  className="w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-3"
                >
                  <FileText className="h-5 w-5 text-gray-500" />
                  <div className="text-left">
                    <div className="font-medium">Plain Text</div>
                    <div className="text-sm text-gray-500">Simple text format</div>
                  </div>
                </button>
            </div>

              <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setShowExportModal(false)}
                className="flex-1"
                disabled={isExporting}
              >
                Cancel
              </Button>
              </div>
          </div>
        </div>
      </div>
      )}

      {/* Success Message */}
      {/* Manual Citation Modal */}
      {showManualCitationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Add Manual Citation</h3>
              <button
                onClick={() => setShowManualCitationModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={manualCitation.title}
                    onChange={(e) => setManualCitation(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Research paper title"
                  />
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Authors *</label>
                  <input
                    type="text"
                    value={manualCitation.authors}
                    onChange={(e) => setManualCitation(prev => ({ ...prev, authors: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Smith, J., Johnson, A."
                  />
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <input
                    type="number"
                    value={manualCitation.year}
                    onChange={(e) => setManualCitation(prev => ({ ...prev, year: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="2023"
                  />
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Journal</label>
                  <input
                    type="text"
                    value={manualCitation.journal}
                    onChange={(e) => setManualCitation(prev => ({ ...prev, journal: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Journal Name"
                  />
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DOI</label>
                  <input
                    type="text"
                    value={manualCitation.doi}
                    onChange={(e) => setManualCitation(prev => ({ ...prev, doi: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="10.1000/182"
                  />
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                  <input
                    type="url"
                    value={manualCitation.url}
                    onChange={(e) => setManualCitation(prev => ({ ...prev, url: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://example.com"
                  />
                </div>
              <div className="flex space-x-3">
              <Button
                  onClick={addManualCitation}
                  disabled={!manualCitation.title.trim() || !manualCitation.authors.trim()}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Add Citation
              </Button>
              <Button
                  onClick={() => setShowManualCitationModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700"
              >
                Cancel
              </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plagiarism Results Modal */}
      {showPlagiarismModal && plagiarismResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Plagiarism Check Results</h3>
              <button
                onClick={() => setShowPlagiarismModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="mb-4">
                <div className="flex items-center gap-4">
                  <div className={`px-4 py-2 rounded-lg text-white font-semibold ${
                    plagiarismResult.matchPercentage < 10 ? 'bg-green-500' :
                    plagiarismResult.matchPercentage < 25 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}>
                    {plagiarismResult.matchPercentage}% Match
              </div>
                  <div className="text-sm text-gray-600">
                    {plagiarismResult.remaining} checks remaining
              </div>
                </div>
                
                {/* External Sources Summary */}
                {plagiarismResult.sources && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">External Sources Checked:</h5>
                    <div className="flex gap-4 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        CrossRef: {plagiarismResult.sources.crossref} matches
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        arXiv: {plagiarismResult.sources.arxiv} matches
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Scholar: {plagiarismResult.sources.scholar} matches
                      </span>
                    </div>
                  </div>
                )}
            </div>

              {plagiarismResult.matches.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Detected Issues:</h4>
                  {plagiarismResult.matches.map((match, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm text-gray-700 flex-1">{match.text}</p>
                        {match.similarity && (
                          <span className="ml-2 px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded">
                            {match.similarity}% similar
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">Source: {match.source}</p>
                        {match.url && (
                          <a href={match.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                            View Source →
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
                <div className="text-center py-8">
                  <div className="text-green-500 text-4xl mb-2">✓</div>
                  <p className="text-gray-600">No plagiarism detected! Your content is original.</p>
              </div>
            )}
                </div>
              </div>
            </div>
      )}

      {/* Section Delete Confirmation Modal */}
      {sectionToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-red-600">Delete Section</h3>
            </div>
            <div className="p-4">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete this section? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
              <Button
                  onClick={() => deleteSection(sectionToDelete)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                  Delete
              </Button>
              <Button
                  onClick={() => setSectionToDelete(null)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700"
                >
                  Cancel
              </Button>
            </div>
          </div>
        </div>
                </div>
              )}

      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`px-6 py-4 rounded-xl shadow-lg max-w-md ${
            showSuccessMessage.includes('❌') 
              ? 'bg-red-500 text-white' 
              : showSuccessMessage.includes('✅')
              ? 'bg-green-500 text-white'
              : 'bg-blue-500 text-white'
          }`}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {showSuccessMessage.includes('❌') ? (
                  <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center">
                    <span className="text-white text-xs">!</span>
                  </div>
                ) : showSuccessMessage.includes('✅') ? (
                  <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white text-xs">i</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium leading-relaxed">{showSuccessMessage}</p>
              </div>
              <button
                onClick={() => setShowSuccessMessage('')}
                className="flex-shrink-0 text-white hover:text-gray-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}