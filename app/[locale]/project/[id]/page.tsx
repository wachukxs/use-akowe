"use client";

import { useEffect, useState, use, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import Sidebar, {
  MobileMenuButton,
  MobileProjectToolsButton,
  MobileToolsDrawer,
  useSidebar,
} from "@/components/Sidebar";
import { Project } from "@/types";
import {
  BookOpen,
  Plus,
  Download,
  CheckCircle2,
  FileText,
  X,
  Send,
  Bot,
  Edit3,
  Trash2,
  BookMarked,
  Search,
  Shield,
  Bold,
  Italic,
  Underline,
  List,
  Hash,
  Link,
  Undo,
  Redo,
  Calculator,
  BarChart3,
  GripVertical,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Loader2,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { formatYearForDisplay } from "@/lib/citation-year";
import {
  getCitationsWithAdded,
  normalizeCitationForProject,
} from "@/lib/citation-helpers";
import {
  CONTEXT_MENU_FIND_CITATION_LABEL,
  SEARCH_TOPIC_REQUIRED_TOOLTIP,
} from "@/lib/find-citation-constants";
import {
  getRangeAtPoint,
  viewportSafePillPosition,
  viewportSafeRewritePanelPosition,
} from "@/lib/editor-context-menu-helpers";
import {
  CITATION_HIGHLIGHT_ATTR,
  CITATION_HIGHLIGHT_CLASS,
  escapeHtmlForCitation,
  scheduleCitationHighlightRemoval,
  wrapCitationInHighlight,
} from "@/lib/citation-highlight";
import { insertCitationAtRange } from "@/lib/insert-citation-at-range";
import { scheduleScrollEditorIntoView } from "@/lib/scroll-editor-into-view";
import { cn } from "@/lib/utils";
import { trackFunnel } from "@/lib/gtag";
import FirstProjectCompletion from "@/components/FirstProjectCompletion";
import { Link as NavLink } from "@/i18n/navigation";

export default function ProjectEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = useTranslations("project");
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { isMobile } = useSidebar();
  const [project, setProject] = useState<Project | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Desktop experience note dismissal states
  const [showDesktopNoteTop, setShowDesktopNoteTop] = useState(false);
  const [showDesktopNoteTools, setShowDesktopNoteTools] = useState(false);
  const [showDesktopNoteAI, setShowDesktopNoteAI] = useState(false);

  useEffect(() => {
    if (isMobile) {
      const topDismissed = localStorage.getItem(
        "akowe-desktop-note-top-dismissed"
      );
      const toolsDismissed = localStorage.getItem(
        "akowe-desktop-note-tools-dismissed"
      );
      const aiDismissed = localStorage.getItem(
        "akowe-desktop-note-ai-dismissed"
      );
      setShowDesktopNoteTop(!topDismissed);
      setShowDesktopNoteTools(!toolsDismissed);
      setShowDesktopNoteAI(!aiDismissed);
    }
  }, [isMobile]);

  // Update ref whenever activeSection changes
  useEffect(() => {
    activeSectionRef.current = activeSection;
  }, [activeSection]);

  // Clear stored insert range when section changes so we never insert into the wrong section
  useEffect(() => {
    storedInsertRangeRef.current = null;
  }, [activeSection]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiIsLoading, setAiIsLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState<
    Array<{
      id: number;
      type: "user" | "assistant";
      content: string;
      timestamp: Date;
    }>
  >([]);
  const [isDiscoveringCitations, setIsDiscoveringCitations] = useState(false);
  const [discoveredCitations, setDiscoveredCitations] = useState<any[]>([]);
  const [showCitationDiscovery, setShowCitationDiscovery] = useState(false);
  const [citationSearchQuery, setCitationSearchQuery] = useState("");
  const [lastDiscoverySearchTerm, setLastDiscoverySearchTerm] = useState<
    string | null
  >(null);
  const [citationFilter, setCitationFilter] = useState<
    "all" | "recent" | "highly_cited"
  >("all");
  const [citationSortBy, setCitationSortBy] = useState<
    "relevance" | "year" | "title"
  >("relevance");
  const [isLoadingMoreCitations, setIsLoadingMoreCitations] = useState(false);
  const [currentCitationOffset, setCurrentCitationOffset] = useState(0);
  const [citationHasMore, setCitationHasMore] = useState(true);
  const [citationTotalResults, setCitationTotalResults] = useState<
    number | null
  >(null);
  const [citationDiscoveryError, setCitationDiscoveryError] = useState<
    string | null
  >(null);
  const searchNewCitationTooltipRef = useRef<HTMLDivElement | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null);
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
  const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(
    null
  );
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(
    null
  );
  const [, setTotalWordCount] = useState(0);
  const [localWordCount, setLocalWordCount] = useState(0);
  const [, setLocalSectionContent] = useState<string>("");
  const [realTimeWordCount, setRealTimeWordCount] = useState<number>(0);
  const [showManualCitationModal, setShowManualCitationModal] = useState(false);
  const [formattingState, setFormattingState] = useState({
    bold: false,
    italic: false,
    underline: false,
    unorderedList: false,
    orderedList: false,
    h1: false,
    h2: false,
    h3: false,
    normal: false,
  });

  const [manualCitation, setManualCitation] = useState({
    title: "",
    authors: "",
    year: "",
    journal: "",
    doi: "",
    url: "",
    abstract: "",
  });
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);
  type ExportFormat = "pdf" | "docx" | "txt" | "latex";

  const [selectedCitationStyle, setSelectedCitationStyle] = useState<
    "apa" | "mla" | "chicago" | "harvard" | "ieee"
  >("apa");
  const [selectedTemplate, setSelectedTemplate] = useState<
    "research-paper" | "thesis" | "report" | "conference-paper"
  >("research-paper");
  const [selectedExportFormat, setSelectedExportFormat] =
    useState<ExportFormat>("pdf");
  const [isAutoDetected, setIsAutoDetected] = useState({
    citationStyle: false,
    template: false,
  });
  const [isDetectingCitations, setIsDetectingCitations] = useState(false);
  const [lastDetectionResult, setLastDetectionResult] = useState<{
    detectedCount: number;
    totalCount: number;
  } | null>(null);
  const [hasContentToScan, setHasContentToScan] = useState(false);
  const [showPlagiarismModal, setShowPlagiarismModal] = useState(false);
  const [isCheckingPlagiarism, setIsCheckingPlagiarism] = useState(false);
  const [plagiarismResult, setPlagiarismResult] = useState<{
    matchPercentage: number;
    matches: Array<{
      text: string;
      source: string;
      url?: string;
      similarity?: number;
      section?: string;
      suggestion?: string;
    }>;
    sectionAnalysis?: Array<{
      sectionId: string;
      sectionTitle: string;
      matchPercentage: number;
      matches: Array<{
        text: string;
        source: string;
        url?: string;
        similarity?: number;
        section?: string;
        suggestion?: string;
      }>;
      wordCount: number;
    }>;
    analysis?: {
      overusedPhrases: number;
      repetitionIssues: number;
      citationProblems: number;
      aiPatterns: number;
      wordDiversity: number;
      externalMatches: number;
      paraphrasingDetected?: number;
    };
    remaining: number;
    sources?: {
      crossref: number;
      arxiv: number;
    };
  } | null>(null);
  // Math and Chart modal states
  const [showMathModal, setShowMathModal] = useState(false);
  const [showChartModal, setShowChartModal] = useState(false);
  const [mathPreview, setMathPreview] = useState("");
  const [mathExplanation, setMathExplanation] = useState("");
  const [isGeneratingExplanation, setIsGeneratingExplanation] = useState(false);
  const [isAddingCitation, setIsAddingCitation] = useState(false);

  // Helper functions for contentEditable content
  const extractTextFromContent = (content: string): string => {
    if (!content) return "";

    // For contentEditable, content is already HTML, so we can extract text directly
    // Remove HTML tags and get plain text
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = content;
    return tempDiv.textContent || tempDiv.innerText || "";
  };

  const countWords = (text: string): number => {
    if (!text) return 0;

    // If it's HTML, strip tags for word count
    let cleanText = text;
    if (text.includes("<") && text.includes(">")) {
      cleanText = text.replace(/<[^>]*>/g, " ");
    }

    return cleanText
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  };

  // Simple markdown to HTML converter
  const parseMarkdown = (text: string): string => {
    if (!text) return "";

    let html = text;

    // Headers
    html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
    html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
    html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");

    // Bold and italic
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

    // Lists
    html = html.replace(/^\- (.*$)/gim, "<li>$1</li>");
    html = html.replace(/^\* (.*$)/gim, "<li>$1</li>");
    html = html.replace(/^\d+\. (.*$)/gim, "<li>$1</li>");

    // Wrap consecutive list items in ul/ol
    html = html.replace(/(<li>.*<\/li>)/g, (match) => {
      // Check if it's a numbered list (contains digits)
      const isNumbered = /^\d+\./.test(match);
      const listTag = isNumbered ? "ol" : "ul";
      return `<${listTag}>${match}</${listTag}>`;
    });

    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

    // Line breaks
    html = html.replace(/\n/g, "<br>");

    // Wrap in paragraphs if not already wrapped
    if (
      !html.includes("<h1>") &&
      !html.includes("<h2>") &&
      !html.includes("<h3>") &&
      !html.includes("<ul>") &&
      !html.includes("<ol>")
    ) {
      html = html
        .split("<br>")
        .map((line) => (line.trim() ? `<p>${line}</p>` : ""))
        .join("");
    }

    return html;
  };

  // Smart AI response processor for insertion
  const processAIResponse = (content: string, sectionTitle: string): string => {
    if (!content) return "";

    let processed = content.trim();

    // Remove redundant section titles that match the current section
    const sectionTitleLower = sectionTitle.toLowerCase();
    const titlePatterns = [
      new RegExp(`^#\\s*${sectionTitleLower}[\\s:]*`, "gim"),
      new RegExp(`^<h1>\\s*${sectionTitleLower}[\\s:]*</h1>`, "gim"),
      new RegExp(`^${sectionTitleLower}[\\s:]+`, "gim"),
    ];

    for (const pattern of titlePatterns) {
      processed = processed.replace(pattern, "").trim();
    }

    // Apply markdown parsing
    processed = parseMarkdown(processed);

    return processed;
  };

  const cleanupSectionContent = (content: string): string => {
    if (!content) return "";

    try {
      const parsed = JSON.parse(content);
      if (parsed.root && parsed.root.children) {
        const extracted = extractTextFromContent(content);
        // If content is empty, return empty string
        if (!extracted.trim()) {
          return "";
        }
        return extracted;
      }
    } catch {
      // Not JSON, could be HTML, markdown, or plain text
      if (content.includes("<") && content.includes(">")) {
        // It's HTML, return as is
        return content;
      }

      // Check if it looks like markdown (has markdown syntax)
      if (
        content.includes("#") ||
        content.includes("*") ||
        content.includes("-") ||
        content.includes("`")
      ) {
        return parseMarkdown(content);
      }

      // Plain text, return as is
      return content;
    }

    return content;
  };

  const calculateTotalWordCount = (project: Project): number => {
    if (!project?.sections) return 0;

    let totalWords = 0;
    project.sections.forEach((section) => {
      const readableText = cleanupSectionContent(section.content || "");
      totalWords += countWords(readableText);
    });

    return totalWords;
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchProject();
    }
  }, [session, resolvedParams.id]);

  // Handle auto-trigger for plagiarism check from lead magnet flow
  const [autoTriggerPlagiarism, setAutoTriggerPlagiarism] = useState(false);

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "plagiarism" && project && !isLoading) {
      setAutoTriggerPlagiarism(true);
      // Clear the URL param to prevent re-triggering on refresh
      const url = new URL(window.location.href);
      url.searchParams.delete("action");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams, project, isLoading]);

  useEffect(() => {
    if (project) {
      const wordCount = calculateTotalWordCount(project);
      setTotalWordCount(wordCount);
      setLocalWordCount(wordCount);

      // Check if there's content to scan for citations
      const hasContent =
        project.sections?.some(
          (section) =>
            cleanupSectionContent(section.content || "").trim().length > 0
        ) || false;
      setHasContentToScan(hasContent);
    }
  }, [project]);

  // Render math equations with KaTeX
  useEffect(() => {
    const renderMath = async () => {
      if (typeof window !== "undefined" && (window as any).katex) {
        const mathElements = document.querySelectorAll(".math-equation");
        mathElements.forEach((element) => {
          const mathText = element.textContent?.trim();
          if (mathText && mathText.startsWith("$") && mathText.endsWith("$")) {
            try {
              const latex = mathText.slice(1, -1); // Remove $ symbols
              const rendered = (window as any).katex.renderToString(latex, {
                throwOnError: false,
                displayMode: true,
              });
              element.innerHTML = rendered;
            } catch (error) {
              console.warn("KaTeX rendering failed:", error);
            }
          }
        });
      }
    };

    // Render math after a short delay to ensure DOM is ready
    const timer = setTimeout(renderMath, 100);
    return () => clearTimeout(timer);
  }, [project]);

  // Render live preview math
  useEffect(() => {
    const renderPreview = () => {
      if (
        typeof window !== "undefined" &&
        (window as any).katex &&
        mathPreview
      ) {
        const previewElement = document.getElementById("math-preview");
        if (previewElement) {
          try {
            const rendered = (window as any).katex.renderToString(mathPreview, {
              throwOnError: false,
              displayMode: true,
            });
            previewElement.innerHTML = rendered;
          } catch (error) {
            console.warn("KaTeX preview rendering failed:", error);
            previewElement.innerHTML = `$${mathPreview}$`;
          }
        }
      }
    };

    const timer = setTimeout(renderPreview, 100);
    return () => clearTimeout(timer);
  }, [mathPreview]);

  // Debug mathExplanation state changes
  useEffect(() => {
    console.log("🧠 DEBUG: mathExplanation state changed:", mathExplanation);
  }, [mathExplanation]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${resolvedParams.id}`);
      if (response.ok) {
        const data = await response.json();
        const proj = data.project || data;
        setProject(proj);
        // Only set active section if none is currently selected
        if (proj?.sections?.length > 0 && !activeSectionRef.current) {
          setActiveSection(proj.sections[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching project:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced section change handler
  const debounceTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isTypingRef = useRef<boolean>(false);
  const activeSectionRef = useRef<string | null>(null);
  const editorSectionRef = useRef<HTMLDivElement | null>(null);
  const editorContentEditableRef = useRef<HTMLDivElement | null>(null);
  const storedInsertRangeRef = useRef<Range | null>(null);
  const contextMenuPillRef = useRef<HTMLDivElement | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTouchRef = useRef<{ clientX: number; clientY: number } | null>(
    null
  );

  const [contextMenuPillPosition, setContextMenuPillPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [contextMenuPillVisible, setContextMenuPillVisible] = useState(false);
  const [contextMenuHasSelection, setContextMenuHasSelection] = useState(false);

  // Rewrite tool state
  const [hasTextSelection, setHasTextSelection] = useState(false);
  const [selectionBarPosition, setSelectionBarPosition] = useState<{x: number; y: number} | null>(null);
  const [selectionBarVisible, setSelectionBarVisible] = useState(false);
  const selectionBarRef = useRef<HTMLDivElement | null>(null);
  const [rewriteTooltipVisible, setRewriteTooltipVisible] = useState(false);
  const rewriteTooltipShownRef = useRef(false);
  const rewriteOriginalRangeRef = useRef<Range | null>(null);
  const [rewriteOriginalText, setRewriteOriginalText] = useState('');
  const [rewritePanelVisible, setRewritePanelVisible] = useState(false);
  const [rewritePanelPosition, setRewritePanelPosition] = useState<{x: number; y: number} | null>(null);
  const [rewriteStatus, setRewriteStatus] = useState<'mode_select' | 'loading' | 'preview' | 'error'>('mode_select');
  const [rewriteResult, setRewriteResult] = useState('');
  const [rewriteError, setRewriteError] = useState('');
  const [rewriteMode, setRewriteMode] = useState<string>('');
  const [rewriteOriginalWordCount, setRewriteOriginalWordCount] = useState(0);
  const [rewriteNewWordCount, setRewriteNewWordCount] = useState(0);
  const rewritePanelRef = useRef<HTMLDivElement | null>(null);
  const [rewriteLimitReached, setRewriteLimitReached] = useState(false);
  const [rewriteRemaining, setRewriteRemaining] = useState<number | null>(null);
  const [rewriteLimit, setRewriteLimit] = useState<number | null>(null);
  const [rewriteHighlightRects, setRewriteHighlightRects] = useState<Array<{top: number; left: number; width: number; height: number}>>([]);
  const [rewriteHighlightType, setRewriteHighlightType] = useState<'loading' | 'success' | null>(null);

  const handleSectionChange = useCallback(
    async (sectionId: string, content: string) => {
      if (!project) return;

      // Mark that user is currently typing
      isTypingRef.current = true;

      // Find the current section to check if content actually changed
      const currentSection = project.sections?.find((s) => s.id === sectionId);
      if (!currentSection) return;

      // Check if content actually changed
      const currentContent = cleanupSectionContent(
        currentSection.content || ""
      );
      if (currentContent === content) {
        return; // No change, don't save
      }

      // Update local word count immediately for responsive UI (without updating project state)
      const updatedSections = (project.sections || []).map((section) =>
        section.id === sectionId
          ? { ...section, content, updatedAt: new Date() }
          : section
      );
      const newWordCount = calculateTotalWordCount({
        ...project,
        sections: updatedSections,
      });
      setLocalWordCount(newWordCount);

      // Update local section content for immediate word count display
      if (sectionId === activeSection) {
        setLocalSectionContent(content);
        setRealTimeWordCount(countWords(cleanupSectionContent(content)));
      }

      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        // Reset typing flag since we're starting a new debounce cycle
        isTypingRef.current = true;
      }

      // Only save after user stops typing for 3 seconds - don't update state to prevent cursor reset
      debounceTimeoutRef.current = setTimeout(async () => {
        try {
          // Recalculate sections with current project state to ensure we have the latest data
          const currentProject = project;
          if (!currentProject) return;

          const currentUpdatedSections = (currentProject.sections || []).map(
            (section) =>
              section.id === sectionId
                ? { ...section, content, updatedAt: new Date() }
                : section
          );
          const currentWordCount = calculateTotalWordCount({
            ...currentProject,
            sections: currentUpdatedSections,
          });

          await fetch(`/api/projects/${resolvedParams.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sections: currentUpdatedSections,
              wordCount: currentWordCount,
            }),
          });

          // Update project state after successful save
          // This ensures content is available when switching sections
          setProject((prevProject) => {
            if (!prevProject) return null;
            return {
              ...prevProject,
              sections: currentUpdatedSections,
              wordCount: currentWordCount,
            };
          });

          // Ensure active section doesn't change during save
          // Use the ref to get the current active section value
          const currentActiveSection = activeSectionRef.current;
          if (currentActiveSection && currentActiveSection !== sectionId) {
            setActiveSection(currentActiveSection);
          }

          // Mark that user is no longer typing
          isTypingRef.current = false;
        } catch (error) {
          console.error("Error saving section:", error);
        }
      }, 3000); // 3 seconds after user stops typing
    },
    [project, resolvedParams.id]
  );

  const refreshCitationsAfterAdd = useCallback(
    async (
      currentProject: Project,
      sectionId: string,
      sectionContent: string,
      citationsToSave: NonNullable<Project["citations"]>
    ) => {
      const updatedSections = (currentProject.sections || []).map((section) =>
        section.id === sectionId
          ? { ...section, content: sectionContent, updatedAt: new Date() }
          : section
      );
      const wordCount = calculateTotalWordCount({
        ...currentProject,
        sections: updatedSections,
      });
      await fetch(`/api/projects/${resolvedParams.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sections: updatedSections,
          citations: citationsToSave,
          wordCount,
        }),
      });
    },
    [resolvedParams.id]
  );

  const closeCitationDiscoveryModal = useCallback(() => {
    setShowCitationDiscovery(false);
    storedInsertRangeRef.current = null;
  }, []);

  useEffect(() => {
    if (!contextMenuPillVisible) return;
    const isInsidePill = (target: EventTarget | null) => {
      const node = target as Node;
      const pill = contextMenuPillRef.current;
      return pill?.contains(node) ?? false;
    };
    const handleMouseDown = (e: MouseEvent) => {
      if (isInsidePill(e.target as Node)) return;
      setContextMenuPillVisible(false);
    };
    const handleTouchStart = (e: TouchEvent) => {
      const t = e.changedTouches?.[0];
      if (!t) return;
      const el = document.elementFromPoint(t.clientX, t.clientY);
      if (el && isInsidePill(el)) return;
      setContextMenuPillVisible(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setContextMenuPillVisible(false);
    };
    document.addEventListener("mousedown", handleMouseDown, true);
    document.addEventListener("touchstart", handleTouchStart, true);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown, true);
      document.removeEventListener("touchstart", handleTouchStart, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [contextMenuPillVisible]);

  // Outside-click dismiss for rewrite panel
  useEffect(() => {
    if (!rewritePanelVisible) return;
    const isInsidePanel = (target: EventTarget | null) => {
      const node = target as Node;
      const panel = rewritePanelRef.current;
      return panel?.contains(node) ?? false;
    };
    const handleMouseDown = (e: MouseEvent) => {
      if (isInsidePanel(e.target as Node)) return;
      closeRewritePanel();
    };
    const handleTouchStart = (e: TouchEvent) => {
      const t = e.changedTouches?.[0];
      if (!t) return;
      const el = document.elementFromPoint(t.clientX, t.clientY);
      if (el && isInsidePanel(el)) return;
      closeRewritePanel();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRewritePanel();
    };
    document.addEventListener("mousedown", handleMouseDown, true);
    document.addEventListener("touchstart", handleTouchStart, true);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown, true);
      document.removeEventListener("touchstart", handleTouchStart, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [rewritePanelVisible]);

  // Clear overlay highlights on scroll (fixed-position rects drift when editor scrolls)
  useEffect(() => {
    if (rewriteHighlightRects.length === 0) return;
    const handleScroll = () => {
      setRewriteHighlightRects([]);
      setRewriteHighlightType(null);
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [rewriteHighlightRects]);

  // AI Assistant functions
  const handleAIWrite = async (sectionId: string) => {
    if (!project || !aiInput.trim()) return;

    const section = project.sections.find((s) => s.id === sectionId);
    if (!section) return;

    setAiIsLoading(true);

    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      type: "user" as const,
      content: aiInput,
      timestamp: new Date(),
    };
    setAiMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: aiInput,
          projectId: resolvedParams.id,
          currentSectionContent: cleanupSectionContent(section.content || ""),
          sectionTitle: section.title,
          insertionMode: "integrate",
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Track first output generated if server indicates it
        if (data.tracking?.trackEvent) {
          const { eventName, params } = data.tracking.trackEvent;
          if (eventName === "first_output_generated") {
            trackFunnel.firstOutputGenerated(
              params.user_id,
              params.output_type
            );
          }
        }

        // Handle preview-only mode (Variant B)
        if (data.previewOnly) {
          trackFunnel.paywallView("word_limit", "preview_output");
          setShowSuccessMessage(
            "Preview mode: You can see the output, but export requires Pro. Upgrade to export!"
          );
          setTimeout(() => setShowSuccessMessage(""), 6000);
        }

        // Debug logging
        console.log("AI Assistant Response:", {
          isIntegrated: data.isIntegrated,
          insertionMode: "integrate",
          hasCurrentContent: !!cleanupSectionContent(section.content || ""),
          responseLength: data.response?.length,
          previewOnly: data.previewOnly,
          paywallVariant: data.paywallVariant,
        });

        // Add assistant response to chat
        const assistantMessage = {
          id: Date.now() + 1,
          type: "assistant" as const,
          content: data.response,
          timestamp: new Date(),
          isIntegrated: data.isIntegrated || false,
          previewOnly: data.previewOnly || false,
        };
        setAiMessages((prev) => [...prev, assistantMessage]);

        setAiInput("");
      } else if (response.status === 429) {
        // Track paywall view for word limit
        const errorData = await response.json();
        trackFunnel.paywallView("word_limit", "ai_assistant");

        // Check if this is variant B (preview allowed)
        if (errorData.paywallVariant === "variant_b") {
          // Variant B: Allow preview, show message about export paywall
          // The response should still contain the preview content
          console.warn("Variant B: Preview mode - export will require upgrade");
        } else {
          // Variant A: Block completely
          console.error("AI Assistant error:", errorData);
          setShowSuccessMessage(
            errorData.error ||
              "Daily word limit reached. Upgrade to Pro for unlimited AI assistance!"
          );
          setTimeout(() => setShowSuccessMessage(""), 6000);
        }
      } else {
        const errorData = await response.json();
        console.error("AI Assistant error:", errorData);
        setShowSuccessMessage(errorData.error || "AI Assistant error");
        setTimeout(() => setShowSuccessMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error getting AI response:", error);
      setShowSuccessMessage(t("errors.aiAssistant"));
      setTimeout(() => setShowSuccessMessage(""), 3000);
    } finally {
      setAiIsLoading(false);
    }
  };

  // Citation functions
  const discoverCitations = async (
    offset: number = 0,
    append: boolean = false,
    customQuery?: string
  ) => {
    if (!project) return;

    if (offset === 0) {
      setIsDiscoveringCitations(true);
      setCurrentCitationOffset(0);
      setCitationHasMore(true);
      setCitationTotalResults(null);
      setCitationDiscoveryError(null);
    } else {
      setIsLoadingMoreCitations(true);
    }

    try {
      const response = await fetch("/api/citations/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: project.topic,
          projectType: project.type,
          citationStyle: project.citationStyle,
          methodology: project.methodology || "qualitative",
          limit: 8,
          offset: offset,
          searchQuery: customQuery?.trim() || undefined,
        }),
      });

      const data = await response.json().catch(() => ({}));
      const newCitations = data.citations ?? [];

      if (response.ok) {
        if (append) {
          setDiscoveredCitations((prev) => [...prev, ...newCitations]);
        } else {
          setDiscoveredCitations(newCitations);
        }

        if (offset === 0 && data.searchTerm) {
          setLastDiscoverySearchTerm(data.searchTerm);
        }

        setCitationHasMore(data.hasMore !== false);
        if (typeof data.totalResults === "number" && data.totalResults >= 0) {
          setCitationTotalResults(data.totalResults);
        }
        setCurrentCitationOffset(offset + 8);

        if (offset === 0) {
          setShowCitationDiscovery(true);
          setCitationSearchQuery("");
        }
        setCitationDiscoveryError(null);
      } else {
        if (!append) {
          setDiscoveredCitations([]);
          setCitationTotalResults(null);
          setCitationHasMore(true);
          setLastDiscoverySearchTerm(null);
          const message =
            data.error ||
            (response.status === 503
              ? "Citation search is temporarily unavailable. Please try again in a moment."
              : t("errors.discoverFailed"));
          setCitationDiscoveryError(message);
          setShowCitationDiscovery(true);
        }
        setShowSuccessMessage(
          data.error ||
            (response.status === 503
              ? "Citation search is temporarily unavailable. Please try again in a moment."
              : t("errors.discoverFailed"))
        );
        setTimeout(() => setShowSuccessMessage(""), 5000);
      }
    } catch (error) {
      console.error("Error discovering citations:", error);
      if (!append) {
        setDiscoveredCitations([]);
        setCitationTotalResults(null);
        setCitationHasMore(true);
        setLastDiscoverySearchTerm(null);
        setCitationDiscoveryError(t("errors.citationSearchFailed"));
        setShowCitationDiscovery(true);
      }
      setShowSuccessMessage(t("errors.citationSearchFailed"));
      setTimeout(() => setShowSuccessMessage(""), 5000);
    } finally {
      setIsDiscoveringCitations(false);
      setIsLoadingMoreCitations(false);
    }
  };

  const searchForNewCitations = () => {
    discoverCitations(0, false, citationSearchQuery);
  };

  const loadMoreCitations = () => {
    discoverCitations(currentCitationOffset, true);
  };

  const retryCitationDiscovery = () => {
    discoverCitations(0, false, citationSearchQuery);
  };

  // ── Rewrite tool functions ──

  const getOverlayRectsFromRange = (range: Range): Array<{top: number; left: number; width: number; height: number}> => {
    const clientRects = range.getClientRects();
    const rects: Array<{top: number; left: number; width: number; height: number}> = [];
    for (let i = 0; i < clientRects.length; i++) {
      const r = clientRects[i];
      if (r.width === 0 && r.height === 0) continue;
      rects.push({
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height,
      });
    }
    return rects;
  };

  const openRewritePanel = (fromContextMenu: boolean) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const selText = selection.toString().trim();
    if (!selText) return;

    const wordCount = selText.split(/\s+/).filter((w) => w.length > 0).length;

    const range = selection.getRangeAt(0).cloneRange();
    const rect = range.getBoundingClientRect();

    // Validation: too short or too long — open panel showing the error
    if (wordCount < 3 || selText.length > 4000) {
      setRewritePanelPosition(
        viewportSafeRewritePanelPosition(rect.left, rect.bottom)
      );
      setRewriteError(wordCount < 3 ? t("rewriteSelectMore") : t("rewriteTooLong"));
      setRewriteStatus('error');
      setRewriteResult('');
      setRewriteMode('');
      setRewriteLimitReached(false);
      setRewritePanelVisible(true);
      setSelectionBarVisible(false);
      setRewriteTooltipVisible(false);
      if (fromContextMenu) setContextMenuPillVisible(false);
      return;
    }

    rewriteOriginalRangeRef.current = range;
    setRewriteOriginalText(selText);
    setRewriteOriginalWordCount(wordCount);

    setRewritePanelPosition(
      viewportSafeRewritePanelPosition(rect.left, rect.bottom)
    );
    setRewriteStatus('mode_select');
    setRewriteResult('');
    setRewriteError('');
    setRewriteMode('');
    setRewritePanelVisible(true);
    setSelectionBarVisible(false);
    setRewriteTooltipVisible(false);

    if (fromContextMenu) {
      setContextMenuPillVisible(false);
    }
  };

  const handleRewriteModeSelect = async (mode: string) => {
    setRewriteStatus('loading');
    setRewriteMode(mode);
    setRewriteError('');

    // Show loading overlay highlight (outside editor DOM - never persisted)
    const range = rewriteOriginalRangeRef.current;
    if (range) {
      setRewriteHighlightRects(getOverlayRectsFromRange(range));
      setRewriteHighlightType('loading');
    }

    try {
      const res = await fetch('/api/ai/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: rewriteOriginalText,
          mode,
          projectId: project?._id,
        }),
      });

      // Clear loading highlight
      setRewriteHighlightRects([]);
      setRewriteHighlightType(null);

      if (res.status === 429) {
        const data = await res.json();
        if (data.limitType === 'paraphrase') {
          setRewriteLimitReached(true);
          setRewriteStatus('error');
        } else {
          setRewriteError(data.error || t("rewriteLimitReached"));
          setRewriteStatus('error');
        }
        return;
      }

      if (!res.ok) {
        setRewriteError(t("rewriteError"));
        setRewriteStatus('error');
        return;
      }

      const data = await res.json();
      setRewriteResult(data.rewrittenText);
      setRewriteNewWordCount(data.wordCount);
      setRewriteOriginalWordCount(data.originalWordCount);
      if (data.remainingRewrites !== undefined && data.remainingRewrites !== Infinity) {
        setRewriteRemaining(data.remainingRewrites);
        setRewriteLimit(data.rewriteLimit);
      }
      setRewriteStatus('preview');
    } catch {
      setRewriteHighlightRects([]);
      setRewriteHighlightType(null);
      setRewriteError(t("rewriteError"));
      setRewriteStatus('error');
    }
  };

  const acceptRewrite = () => {
    if (!rewritePanelVisible) return;
    setRewritePanelVisible(false);

    const range = rewriteOriginalRangeRef.current;
    const editor = document.querySelector('[contenteditable="true"]');
    if (!range || !editor || !editor.contains(range.startContainer)) {
      closeRewritePanel();
      return;
    }

    try {
      // Insert plain text only - no wrapper spans in editor DOM
      range.deleteContents();
      const textNode = document.createTextNode(rewriteResult);
      range.insertNode(textNode);

      // Dispatch input to save clean content
      editor.dispatchEvent(new Event('input', { bubbles: true }));

      // Show success overlay highlight (outside editor DOM - never persisted)
      // Create a temporary range around the inserted text to get its rects
      const tempRange = document.createRange();
      tempRange.selectNode(textNode);
      const rects = getOverlayRectsFromRange(tempRange);
      setRewriteHighlightRects(rects);
      setRewriteHighlightType('success');

      // Fade out and clear after 3s
      setTimeout(() => {
        setRewriteHighlightType(null);
        setRewriteHighlightRects([]);
      }, 3000);
    } catch (err) {
      console.warn('Rewrite accept failed:', err);
    }

    // Reset state
    rewriteOriginalRangeRef.current = null;
    setRewriteOriginalText('');
    setRewriteResult('');
    setRewriteError('');
    setRewriteMode('');
    setRewriteStatus('mode_select');
  };

  const closeRewritePanel = () => {
    setRewriteHighlightRects([]);
    setRewriteHighlightType(null);
    setRewritePanelVisible(false);
    rewriteOriginalRangeRef.current = null;
    setRewriteOriginalText('');
    setRewriteResult('');
    setRewriteError('');
    setRewriteMode('');
    setRewriteStatus('mode_select');
    setRewriteLimitReached(false);
  };

  // Function to check current formatting state using document.queryCommandState
  const checkFormattingState = () => {
    try {
      const selection = window.getSelection();

      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const editor = document.querySelector('[contenteditable="true"]');

        // Only check formatting if selection is within our editor
        if (editor && editor.contains(range.commonAncestorContainer)) {
          // Track whether user has text selected (for rewrite button + floating bar)
          const selText = selection.toString();
          const hasSelection = selText.trim().length > 0;
          setHasTextSelection(hasSelection);

          // Position the floating selection bar when text is selected
          if (hasSelection && !rewritePanelVisible) {
            const rect = range.getBoundingClientRect();
            if (rect.width > 0) {
              const barX = rect.left + rect.width / 2 - 60;
              const barY = rect.top - 48;
              const safeX = Math.max(8, Math.min(barX, window.innerWidth - 130));
              const safeY = barY < 8 ? rect.bottom + 8 : barY;
              setSelectionBarPosition({ x: safeX, y: safeY });
              setSelectionBarVisible(true);

              // First-use tooltip: show once ever
              if (!rewriteTooltipShownRef.current) {
                try {
                  const dismissed = localStorage.getItem('akowe-rewrite-tooltip-dismissed');
                  if (!dismissed) {
                    setRewriteTooltipVisible(true);
                    rewriteTooltipShownRef.current = true;
                    localStorage.setItem('akowe-rewrite-tooltip-dismissed', '1');
                    setTimeout(() => setRewriteTooltipVisible(false), 5000);
                  } else {
                    rewriteTooltipShownRef.current = true;
                  }
                } catch {
                  rewriteTooltipShownRef.current = true;
                }
              }
            }
          } else {
            setSelectionBarVisible(false);
          }

          // Use document.queryCommandState for more accurate state detection
          const isBold = document.queryCommandState("bold");
          const isItalic = document.queryCommandState("italic");
          const isUnderline = document.queryCommandState("underline");

          // For lists, headers, and normal text, we need to check the DOM structure
          let isUnorderedList = false;
          let isOrderedList = false;
          let isH1 = false;
          let isH2 = false;
          let isH3 = false;
          let isNormal = false;
          let element = range.commonAncestorContainer;

          // Walk up to find the element
          while (element && element.nodeType !== Node.ELEMENT_NODE) {
            element = element.parentNode as Node;
          }

          if (element) {
            let currentElement = element as Element;
            // Check formatting by walking up the DOM tree
            while (currentElement && currentElement !== document.body) {
              if (currentElement.tagName === "UL") {
                isUnorderedList = true;
                break;
              }
              if (currentElement.tagName === "OL") {
                isOrderedList = true;
                break;
              }
              if (currentElement.tagName === "H1") {
                isH1 = true;
                break;
              }
              if (currentElement.tagName === "H2") {
                isH2 = true;
                break;
              }
              if (currentElement.tagName === "H3") {
                isH3 = true;
                break;
              }
              if (
                currentElement.tagName === "DIV" &&
                !isUnorderedList &&
                !isOrderedList &&
                !isH1 &&
                !isH2 &&
                !isH3
              ) {
                isNormal = true;
                break;
              }
              currentElement = currentElement.parentElement as Element;
            }
          }

          setFormattingState({
            bold: isBold,
            italic: isItalic,
            underline: isUnderline,
            unorderedList: isUnorderedList,
            orderedList: isOrderedList,
            h1: isH1,
            h2: isH2,
            h3: isH3,
            normal: isNormal,
          });
        }
      } else {
        // No selection, reset formatting state
        setHasTextSelection(false);
        setSelectionBarVisible(false);
        setFormattingState({
          bold: false,
          italic: false,
          underline: false,
          unorderedList: false,
          orderedList: false,
          h1: false,
          h2: false,
          h3: false,
          normal: false,
        });
      }
    } catch (error) {
      console.warn("Formatting state check failed:", error);
      // Reset to safe state on error
      setFormattingState({
        bold: false,
        italic: false,
        underline: false,
        unorderedList: false,
        orderedList: false,
        h1: false,
        h2: false,
        h3: false,
        normal: false,
      });
    }
  };

  // Enhanced formatting functions that work with contentEditable
  const applyBold = () => {
    try {
      // Use document.execCommand for better reliability and browser compatibility
      const success = document.execCommand("bold", false, undefined);
      if (success) {
        checkFormattingState();
      }
    } catch (error) {
      console.warn("Bold formatting failed:", error);
    }
  };

  const applyItalic = () => {
    try {
      // Use document.execCommand for better reliability and browser compatibility
      const success = document.execCommand("italic", false, undefined);
      if (success) {
        checkFormattingState();
      }
    } catch (error) {
      console.warn("Italic formatting failed:", error);
    }
  };

  const applyUnorderedList = () => {
    try {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        selection.getRangeAt(0);
        const selectedText = selection.toString();

        let htmlToInsert = "";
        if (selectedText) {
          // Text is selected, convert to list
          htmlToInsert = `<ul><li>${selectedText}</li></ul>`;
        } else {
          // No selection, create new list
          htmlToInsert = "<ul><li>&nbsp;</li></ul>";
        }

        // Try insertHTML first
        const success = document.execCommand("insertHTML", false, htmlToInsert);
        if (success) {
          checkFormattingState();
          return;
        }
      }
    } catch (error) {
      console.warn("insertHTML failed, trying manual approach:", error);
    }

    // Fallback to manual DOM manipulation
    try {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const selectedText = selection.toString();

        if (selectedText) {
          // Text is selected, convert to list
          const ul = document.createElement("ul");
          const li = document.createElement("li");
          li.textContent = selectedText;
          ul.appendChild(li);
          range.deleteContents();
          range.insertNode(ul);
        } else {
          // No selection, create new list
          const ul = document.createElement("ul");
          const li = document.createElement("li");
          li.innerHTML = "&nbsp;";
          ul.appendChild(li);
          range.insertNode(ul);
          range.setStart(li, 0);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }
        checkFormattingState();
      }
    } catch (error) {
      console.warn("Manual unordered list creation failed:", error);
    }
  };

  const applyOrderedList = () => {
    try {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        selection.getRangeAt(0);
        const selectedText = selection.toString();

        let htmlToInsert = "";
        if (selectedText) {
          // Text is selected, convert to numbered list
          htmlToInsert = `<ol><li>${selectedText}</li></ol>`;
        } else {
          // No selection, create new numbered list
          htmlToInsert = "<ol><li>&nbsp;</li></ol>";
        }

        // Try insertHTML first
        const success = document.execCommand("insertHTML", false, htmlToInsert);
        if (success) {
          checkFormattingState();
          return;
        }
      }
    } catch (error) {
      console.warn("insertHTML failed, trying manual approach:", error);
    }

    // Fallback to manual DOM manipulation
    try {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const selectedText = selection.toString();

        if (selectedText) {
          // Text is selected, convert to numbered list
          const ol = document.createElement("ol");
          const li = document.createElement("li");
          li.textContent = selectedText;
          ol.appendChild(li);
          range.deleteContents();
          range.insertNode(ol);
        } else {
          // No selection, create new numbered list
          const ol = document.createElement("ol");
          const li = document.createElement("li");
          li.innerHTML = "&nbsp;";
          ol.appendChild(li);
          range.insertNode(ol);
          range.setStart(li, 0);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }
        checkFormattingState();
      }
    } catch (error) {
      console.warn("Manual ordered list creation failed:", error);
    }
  };

  // Add underline support
  const applyUnderline = () => {
    try {
      // Use document.execCommand for better reliability
      const success = document.execCommand("underline", false, undefined);
      if (success) {
        checkFormattingState();
      }
    } catch (error) {
      console.warn("Underline formatting failed:", error);
    }
  };

  const applyHeader = (level: number) => {
    try {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        selection.getRangeAt(0);
        const selectedText = selection.toString();

        let htmlToInsert = "";
        if (selectedText) {
          // Text is selected, wrap it in header
          htmlToInsert = `<h${level}>${selectedText}</h${level}>`;
        } else {
          // No selection, create new header
          htmlToInsert = `<h${level}>&nbsp;</h${level}>`;
        }

        // Try insertHTML first
        const success = document.execCommand("insertHTML", false, htmlToInsert);
        if (success) {
          checkFormattingState();
          return;
        }
      }
    } catch (error) {
      console.warn("insertHTML failed, trying manual approach:", error);
    }

    // Fallback to manual DOM manipulation
    try {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const selectedText = selection.toString();

        if (selectedText) {
          // Text is selected, wrap it in header
          const header = document.createElement(`h${level}`);
          header.textContent = selectedText;
          range.deleteContents();
          range.insertNode(header);
        } else {
          // No selection, create new header
          const header = document.createElement(`h${level}`);
          header.innerHTML = "&nbsp;";
          range.insertNode(header);
          range.setStart(header, 0);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }
        checkFormattingState();
      }
    } catch (error) {
      console.warn("Manual header creation failed:", error);
    }
  };

  // Convert to normal paragraph
  const applyNormal = () => {
    try {
      // Use formatBlock to convert to div (normal paragraph)
      const success = document.execCommand("formatBlock", false, "div");
      if (success) {
        checkFormattingState();
      }
    } catch (error) {
      console.warn("Normal formatting failed:", error);
    }
  };

  // Add undo/redo functionality
  const undo = () => {
    try {
      const success = document.execCommand("undo", false, undefined);
      if (success) {
        checkFormattingState();
      }
    } catch (error) {
      console.warn("Undo failed:", error);
    }
  };

  const redo = () => {
    try {
      const success = document.execCommand("redo", false, undefined);
      if (success) {
        checkFormattingState();
      }
    } catch (error) {
      console.warn("Redo failed:", error);
    }
  };

  // Generate AI explanation for math equation
  const generateMathExplanation = async (latexCode: string, retryCount = 0) => {
    console.log("🧠 DEBUG: generateMathExplanation called");
    console.log("🧠 DEBUG: latexCode:", latexCode);
    console.log("🧠 DEBUG: latexCode.trim():", latexCode.trim());
    console.log("🧠 DEBUG: retryCount:", retryCount);

    if (!latexCode.trim()) {
      console.log("🧠 DEBUG: Empty latexCode, returning early");
      return;
    }

    console.log("🧠 DEBUG: Setting isGeneratingExplanation to true");
    setIsGeneratingExplanation(true);

    try {
      const requestBody = {
        prompt: `Provide a brief, 1-2 sentence explanation of this mathematical equation: ${latexCode}. Context: This is for a research project titled "${
          project?.name || "academic research"
        }" in the ${
          activeSection
            ? project?.sections.find((s) => s.id === activeSection)?.title ||
              "current section"
            : "current section"
        }. Explain what the equation represents in simple terms relevant to this research context. Keep it concise and professional.`,
        context: "math_explanation",
        projectId: project?._id,
      };

      console.log("🧠 DEBUG: Making API request to /api/ai/write");
      console.log("🧠 DEBUG: Request body:", requestBody);

      const response = await fetch("/api/ai/write", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("🧠 DEBUG: Response received");
      console.log("🧠 DEBUG: Response status:", response.status);
      console.log("🧠 DEBUG: Response ok:", response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log("🧠 DEBUG: Response data:", data);
        console.log("🧠 DEBUG: data.text:", data.text);
        console.log("🧠 DEBUG: data.content:", data.content);
        console.log("🧠 DEBUG: data keys:", Object.keys(data));

        const explanationText = data.text || data.content || "";
        console.log("🧠 DEBUG: Setting explanation text:", explanationText);
        setMathExplanation(explanationText);
        console.log(
          "🧠 DEBUG: setMathExplanation called with:",
          explanationText
        );
      } else if (response.status === 429) {
        console.warn("⚠️ Rate limit hit, retryCount:", retryCount);
        if (retryCount < 2) {
          console.log("🧠 DEBUG: Retrying in 2 seconds...");
          setTimeout(() => {
            generateMathExplanation(latexCode, retryCount + 1);
          }, 2000);
          return;
        } else {
          // Track paywall view for word limit (already tracked above)
          setMathExplanation(
            "Daily AI word limit reached. Upgrade to Pro for unlimited AI assistance! 🚀"
          );
        }
      } else {
        console.error("❌ Failed to generate math explanation");
        console.error("❌ Response status:", response.status);
        console.error("❌ Response statusText:", response.statusText);
        setMathExplanation(
          "Unable to generate explanation at this time. Please try again later."
        );
      }
    } catch (error) {
      console.error("❌ Error generating math explanation:", error);
      console.error("❌ Error stack:", (error as Error).stack);
      setMathExplanation(t("errors.mathExplanation"));
    } finally {
      console.log("🧠 DEBUG: Setting isGeneratingExplanation to false");
      setIsGeneratingExplanation(false);
    }
  };

  // Math insertion function that saves to database immediately
  const insertMathIntoEditor = async (
    mathElement: string,
    latexCode: string
  ) => {
    console.log("🔧 DEBUG: insertMathIntoEditor called");
    console.log("🔧 DEBUG: mathElement:", mathElement);
    console.log("🔧 DEBUG: latexCode:", latexCode);

    try {
      const editorElement = document.querySelector(
        "[contentEditable]"
      ) as HTMLElement;
      console.log("🔧 DEBUG: editorElement found:", !!editorElement);

      if (!editorElement) {
        console.error("❌ ContentEditable element not found");
        return;
      }

      // Focus the editor first to ensure we have a selection
      console.log("🔧 DEBUG: Focusing editor element");
      editorElement.focus();

      const selection = window.getSelection();
      console.log("🔧 DEBUG: selection object:", selection);
      console.log("🔧 DEBUG: selection.rangeCount:", selection?.rangeCount);

      let range: Range;

      if (selection && selection.rangeCount > 0) {
        range = selection.getRangeAt(0);
        console.log("🔧 DEBUG: Using existing selection range");
        console.log(
          "🔧 DEBUG: Selection position:",
          range.startOffset,
          "in",
          range.startContainer.nodeName
        );
      } else {
        console.log("🔧 DEBUG: Creating new selection at end of editor");
        // If no selection, create one at the end of the editor
        range = document.createRange();

        // Find the last text node or element in the editor
        const walker = document.createTreeWalker(
          editorElement,
          NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
          null
        );

        let lastNode: Node = editorElement;
        let node: Node | null;
        while ((node = walker.nextNode())) {
          lastNode = node;
        }

        if (lastNode.nodeType === Node.TEXT_NODE) {
          range.setStart(lastNode, lastNode.textContent?.length || 0);
          range.setEnd(lastNode, lastNode.textContent?.length || 0);
        } else {
          range.setStartAfter(lastNode);
          range.setEndAfter(lastNode);
        }

        selection?.removeAllRanges();
        selection?.addRange(range);
        console.log(
          "🔧 DEBUG: New selection created at end, offset:",
          range.startOffset
        );
      }

      console.log("🔧 DEBUG: Range created:", range);
      console.log("🔧 DEBUG: Range start container:", range.startContainer);
      console.log("🔧 DEBUG: Range start offset:", range.startOffset);

      // Clear any existing content in the range
      console.log("🔧 DEBUG: Clearing existing content in range");
      range.deleteContents();

      // Create and insert the math element
      console.log("🔧 DEBUG: Creating math element from HTML");
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = mathElement;
      const mathNode = tempDiv.firstElementChild; // Use firstElementChild instead of firstChild

      console.log("🔧 DEBUG: mathNode created:", !!mathNode);
      console.log("🔧 DEBUG: mathNode type:", mathNode?.nodeType);
      console.log("🔧 DEBUG: mathNode content:", mathNode?.textContent);
      console.log("🔧 DEBUG: mathNode outerHTML:", mathNode?.outerHTML);

      if (mathNode) {
        console.log("🔧 DEBUG: Inserting math node into range");
        range.insertNode(mathNode);

        // Move cursor after the inserted math
        console.log("🔧 DEBUG: Moving cursor after inserted math");
        range.setStartAfter(mathNode);
        range.setEndAfter(mathNode);
        selection?.removeAllRanges();
        selection?.addRange(range);

        // Trigger input event to update the editor state
        console.log("🔧 DEBUG: Dispatching input event");
        const inputEvent = new Event("input", { bubbles: true });
        editorElement.dispatchEvent(inputEvent);

        // Get the updated content and save to database after a short delay
        if (activeSection) {
          console.log("🔧 DEBUG: Waiting for DOM update before database save");
          // Small delay to ensure DOM is updated
          setTimeout(async () => {
            console.log(
              "🔧 DEBUG: Saving to database, activeSection:",
              activeSection
            );
            const updatedContent = editorElement.innerHTML;
            console.log(
              "🔧 DEBUG: Updated content length:",
              updatedContent.length
            );
            console.log(
              "🔧 DEBUG: Updated content preview:",
              updatedContent.substring(0, 200) + "..."
            );

            await handleSectionChange(activeSection, updatedContent);
            console.log("🔧 DEBUG: Database save completed");
          }, 100);
        }

        checkFormattingState();
        console.log("✅ Math equation inserted successfully");
      } else {
        console.error("❌ Failed to create math node");
      }
    } catch (error) {
      console.error("❌ Math insertion failed:", error);
      console.error("❌ Error stack:", (error as Error).stack);
    }
  };

  // Math Block helper functions

  // Simple text input handler
  const handleTextInput = (e: React.FormEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const content = target.innerHTML;

    // Update word count
    setRealTimeWordCount(countWords(cleanupSectionContent(content)));
    if (activeSection) {
      handleSectionChange(activeSection, content);
    }
  };

  // Function to update editor content from external sources (AI/citations)
  const updateEditorContent = (newContent: string) => {
    const editorElement = document.querySelector(
      '[contenteditable="true"]'
    ) as HTMLElement;
    if (editorElement) {
      // Save cursor position before update
      const selection = window.getSelection();
      const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
      const cursorOffset = range ? range.startOffset : 0;

      editorElement.innerHTML = newContent;

      // Restore cursor position after update
      if (range && selection) {
        try {
          const newRange = document.createRange();
          const textNode = editorElement.firstChild;
          if (textNode && textNode.nodeType === Node.TEXT_NODE) {
            newRange.setStart(
              textNode,
              Math.min(cursorOffset, textNode.textContent?.length || 0)
            );
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
          }
        } catch {
          // If cursor restoration fails, just place at end
          const newRange = document.createRange();
          newRange.selectNodeContents(editorElement);
          newRange.collapse(false);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      }
    }
  };

  const addCitationToEditor = async (citation: any) => {
    if (!project || !activeSection) return;

    const section = project.sections.find((s) => s.id === activeSection);
    if (!section) return;

    setIsAddingCitation(true);

    const currentContent = cleanupSectionContent(section.content || "");
    const editor = editorContentEditableRef.current;
    const storedRange = storedInsertRangeRef.current;

    // Insert-at-position path: only when stored range is in the current editor (avoids wrong section after switch)
    if (
      editor &&
      storedRange &&
      document.contains(storedRange.startContainer) &&
      editor.contains(storedRange.startContainer)
    ) {
      const authorsText = Array.isArray(citation.authors)
        ? citation.authors.join(", ")
        : citation.authors || "Unknown Author";
      const citationText = `(${authorsText}, ${formatYearForDisplay(
        citation.year
      )})`;
      insertCitationAtRange(editor, storedRange, citationText, true);
      const newContent = editor.innerHTML;
      const normalized = normalizeCitationForProject(citation);
      const citationsToSave = getCitationsWithAdded(
        project.citations ?? [],
        normalized
      );

      handleSectionChange(activeSection, newContent);
      setProject((prev) =>
        prev ? { ...prev, citations: citationsToSave } : null
      );
      setLocalSectionContent(newContent);
      setRealTimeWordCount(countWords(cleanupSectionContent(newContent)));
      setShowCitationDiscovery(false);
      storedInsertRangeRef.current = null;
      await refreshCitationsAfterAdd(
        project,
        activeSection,
        newContent,
        citationsToSave
      );
      scheduleCitationHighlightRemoval(editor);
      scheduleScrollEditorIntoView(editorSectionRef);
      setShowSuccessMessage("✅ Citation added to section!");
      setTimeout(() => setShowSuccessMessage(""), 6000);
      setIsAddingCitation(false);
      return;
    }

    // Use intelligent integration for all content lengths
    try {
      const response = await fetch("/api/citations/integrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionContent: currentContent,
          citation: citation,
          citationStyle: project.citationStyle || "APA",
          sectionTitle: section.title,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Track first output generated if server indicates it
        if (data.tracking?.trackEvent) {
          const { eventName, params } = data.tracking.trackEvent;
          if (eventName === "first_output_generated") {
            trackFunnel.firstOutputGenerated(
              params.user_id,
              params.output_type
            );
          }
        }

        const integratedContent = data.integratedContent;
        const normalized = normalizeCitationForProject(citation);
        const citationsToSave = getCitationsWithAdded(
          project.citations ?? [],
          normalized
        );

        // Update both the project state and local section content for real-time editor update
        handleSectionChange(activeSection, integratedContent);
        setProject((prev) =>
          prev ? { ...prev, citations: citationsToSave } : null
        );
        setLocalSectionContent(integratedContent);
        setRealTimeWordCount(
          countWords(cleanupSectionContent(integratedContent))
        );

        // Update editor content directly with cursor preservation
        updateEditorContent(integratedContent);

        const citationTextForHighlight = `(${
          Array.isArray(citation.authors)
            ? citation.authors.join(", ")
            : citation.authors ?? "Unknown Author"
        }, ${formatYearForDisplay(citation.year)})`;
        if (editor) {
          wrapCitationInHighlight(editor, citationTextForHighlight);
          scheduleCitationHighlightRemoval(editor);
        }
        setShowCitationDiscovery(false);
        storedInsertRangeRef.current = null;
        await refreshCitationsAfterAdd(
          project,
          activeSection,
          integratedContent,
          citationsToSave
        );
        scheduleScrollEditorIntoView(editorSectionRef);

        // Provide context-aware success message based on integration type
        let successMessage = "✅ Citation added to section!";
        if (data.integrationType === "TEMPLATE_REPLACEMENT") {
          successMessage = "✅ Citation integrated with new content!";
        } else if (data.integrationType === "CONTENT_EXPANSION") {
          successMessage = "✅ Citation added with enhanced content!";
        } else if (data.integrationType === "NATURAL_INTEGRATION") {
          successMessage = "✅ Citation intelligently placed in section!";
        } else if (data.integrationType === "CONTENT_CONDENSATION") {
          successMessage = "✅ Citation integrated with improved content!";
        }

        setShowSuccessMessage(successMessage);
        setTimeout(() => setShowSuccessMessage(""), 6000);
      } else if (response.status === 429) {
        // AI word limit – do not add citation; show clear error for 6 seconds
        let errorMessage = t("errors.wordLimitReached");
        try {
          const data = await response.json();
          if (typeof data?.error === "string" && data.error.trim()) {
            errorMessage = data.error.trim();
          }
        } catch {
          // ignore JSON parse failure
        }
        setShowSuccessMessage(
          `Citation not added. ${errorMessage} Upgrade to add more citations.`
        );
        setTimeout(() => setShowSuccessMessage(""), 6000);
        storedInsertRangeRef.current = null;
      } else {
        // Fallback to simple append if integration fails (with highlight span)
        const authorsText = Array.isArray(citation.authors)
          ? citation.authors.join(", ")
          : citation.authors || "Unknown Author";
        const citationText = `(${authorsText}, ${formatYearForDisplay(
          citation.year
        )})`;
        const highlightedCitation = `<span class="${CITATION_HIGHLIGHT_CLASS}" ${CITATION_HIGHLIGHT_ATTR}="true">${escapeHtmlForCitation(
          citationText
        )}</span>`;
        const newContent =
          currentContent + (currentContent ? " " : "") + highlightedCitation;
        const normalized = normalizeCitationForProject(citation);
        const citationsToSave = getCitationsWithAdded(
          project.citations ?? [],
          normalized
        );

        handleSectionChange(activeSection, newContent);
        setProject((prev) =>
          prev ? { ...prev, citations: citationsToSave } : null
        );
        setLocalSectionContent(newContent);
        setRealTimeWordCount(countWords(cleanupSectionContent(newContent)));
        updateEditorContent(newContent);

        if (editor) scheduleCitationHighlightRemoval(editor);
        setShowCitationDiscovery(false);
        storedInsertRangeRef.current = null;
        await refreshCitationsAfterAdd(
          project,
          activeSection,
          newContent,
          citationsToSave
        );
        scheduleScrollEditorIntoView(editorSectionRef);
        setShowSuccessMessage("Citation added to editor!");
        setTimeout(() => setShowSuccessMessage(""), 6000);
      }
    } catch (error) {
      console.error("Error integrating citation:", error);
      // Fallback to simple append (with highlight span)
      const authorsText = Array.isArray(citation.authors)
        ? citation.authors.join(", ")
        : citation.authors || "Unknown Author";
      const citationText = `(${authorsText}, ${formatYearForDisplay(
        citation.year
      )})`;
      const highlightedCitation = `<span class="${CITATION_HIGHLIGHT_CLASS}" ${CITATION_HIGHLIGHT_ATTR}="true">${escapeHtmlForCitation(
        citationText
      )}</span>`;
      const newContent =
        currentContent + (currentContent ? " " : "") + highlightedCitation;
      const normalized = normalizeCitationForProject(citation);
      const citationsToSave = getCitationsWithAdded(
        project.citations ?? [],
        normalized
      );

      handleSectionChange(activeSection, newContent);
      setProject((prev) =>
        prev ? { ...prev, citations: citationsToSave } : null
      );
      setLocalSectionContent(newContent);
      setRealTimeWordCount(countWords(cleanupSectionContent(newContent)));
      updateEditorContent(newContent);

      if (editor) scheduleCitationHighlightRemoval(editor);
      setShowCitationDiscovery(false);
      storedInsertRangeRef.current = null;
      await refreshCitationsAfterAdd(
        project,
        activeSection,
        newContent,
        citationsToSave
      );
      scheduleScrollEditorIntoView(editorSectionRef);
      setShowSuccessMessage("Citation added to editor!");
      setTimeout(() => setShowSuccessMessage(""), 6000);
    } finally {
      // Always reset loading state
      setIsAddingCitation(false);
    }
  };

  // Citation filtering and sorting functions
  const getFilteredAndSortedCitations = () => {
    let filtered = [...discoveredCitations];

    // Apply search filter
    if (citationSearchQuery.trim()) {
      const query = citationSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (citation) =>
          citation.title?.toLowerCase().includes(query) ||
          citation.authors?.toString().toLowerCase().includes(query) ||
          citation.journal?.toLowerCase().includes(query) ||
          citation.abstract?.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (citationFilter === "recent") {
      const currentYear = new Date().getFullYear();
      filtered = filtered.filter(
        (citation) => citation.year && citation.year >= currentYear - 5
      );
    } else if (citationFilter === "highly_cited") {
      // Assuming citations with more than 100 citations are "highly cited"
      filtered = filtered.filter(
        (citation) => citation.citationCount && citation.citationCount > 100
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (citationSortBy) {
        case "year":
          return (b.year || 0) - (a.year || 0);
        case "title":
          return (a.title || "").localeCompare(b.title || "");
        case "relevance":
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
      type: "custom" as const,
      title: "New Section",
      content: "",
      order: (project.sections?.length || 0) + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedSections = [...(project.sections || []), newSection];
    const updatedProject = { ...project, sections: updatedSections };

    setProject(updatedProject);
    setActiveSection(newSection.id);
    setEditingSectionId(newSection.id);
    setEditingTitle("New Section");

    // Save to backend
    try {
      await fetch(`/api/projects/${resolvedParams.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: updatedSections }),
      });
    } catch (error) {
      console.error("Error adding section:", error);
    }
  };

  const updateSectionTitle = async (sectionId: string, newTitle: string) => {
    if (!project || !newTitle.trim()) return;

    const updatedSections = (project.sections || []).map((section) =>
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
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: updatedSections }),
      });
    } catch (error) {
      console.error("Error updating section title:", error);
    }
  };

  const reorderSections = async (draggedId: string, targetId: string) => {
    if (!project || draggedId === targetId) return;

    const sections = [...(project.sections || [])];
    const draggedIndex = sections.findIndex((s) => s.id === draggedId);
    const targetIndex = sections.findIndex((s) => s.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Remove dragged section
    const [draggedSection] = sections.splice(draggedIndex, 1);

    // Insert at target position
    sections.splice(targetIndex, 0, draggedSection);

    // Update order numbers
    const updatedSections = sections.map((section, index) => ({
      ...section,
      order: index + 1,
      updatedAt: new Date(),
    }));

    const updatedProject = { ...project, sections: updatedSections };
    setProject(updatedProject);

    // Save to backend
    try {
      await fetch(`/api/projects/${resolvedParams.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: updatedSections }),
      });
    } catch (error) {
      console.error("Error reordering sections:", error);
      // Revert on error
      setProject(project);
    }
  };

  const deleteSection = async (sectionId: string) => {
    if (!project) return;

    const updatedSections = (project.sections || []).filter(
      (s) => s.id !== sectionId
    );
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
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: updatedSections }),
      });
    } catch (error) {
      console.error("Error deleting section:", error);
    }
  };

  // Plagiarism check function
  const checkPlagiarism = async () => {
    if (!project) return;

    setIsCheckingPlagiarism(true);
    try {
      const allContent = (project.sections || [])
        .map((section) => cleanupSectionContent(section.content || ""))
        .join("\n\n");

      // Check if there's content to analyze
      if (!allContent.trim()) {
        setShowSuccessMessage(
          "No content available to check for plagiarism. Please add some content to your sections first."
        );
        setTimeout(() => setShowSuccessMessage(""), 5000);
        setIsCheckingPlagiarism(false);
        return;
      }

      const response = await fetch("/api/plagiarism/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: resolvedParams.id,
          text: allContent,
          sections: project.sections || [], // Pass sections for section-level analysis
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPlagiarismResult(data);
        setShowPlagiarismModal(true);
      } else {
        const errorData = await response.json();
        setShowSuccessMessage(errorData.error || "Plagiarism check failed");
        setTimeout(() => setShowSuccessMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error checking plagiarism:", error);
      setShowSuccessMessage("Plagiarism check failed. Please try again.");
      setTimeout(() => setShowSuccessMessage(""), 3000);
    } finally {
      setIsCheckingPlagiarism(false);
    }
  };

  // Auto-trigger plagiarism check from lead magnet continuation
  useEffect(() => {
    if (
      autoTriggerPlagiarism &&
      !isCheckingPlagiarism &&
      !showPlagiarismModal
    ) {
      setAutoTriggerPlagiarism(false);
      checkPlagiarism();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoTriggerPlagiarism, isCheckingPlagiarism, showPlagiarismModal]);

  // Manual citation function
  const addManualCitation = async () => {
    if (!project || !manualCitation.title.trim()) return;

    const newCitation = {
      id: `manual_${Date.now()}`,
      title: manualCitation.title,
      authors: manualCitation.authors.split(",").map((a) => a.trim()),
      year: parseInt(manualCitation.year) || new Date().getFullYear(),
      journal: manualCitation.journal || "Unknown Journal",
      doi: manualCitation.doi,
      url: manualCitation.url,
      citationKey: `cite_${Date.now()}`,
      citationText: `(${manualCitation.authors}, ${manualCitation.year})`,
      addedAt: new Date(),
    };

    const updatedCitations = [...(project.citations || []), newCitation];
    const updatedProject = { ...project, citations: updatedCitations };
    setProject(updatedProject);
    setShowManualCitationModal(false);
    setManualCitation({
      title: "",
      authors: "",
      year: "",
      journal: "",
      doi: "",
      url: "",
      abstract: "",
    });

    // Save to backend
    try {
      await fetch(`/api/projects/${resolvedParams.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ citations: updatedCitations }),
      });
    } catch (error) {
      console.error("Error adding manual citation:", error);
    }
  };

  // Citation detection function
  const detectCitations = async () => {
    if (!project) return;

    // Check if there's content to scan
    if (!hasContentToScan) {
      setShowSuccessMessage(
        "No content available to scan for citations. Please add some content to your sections first."
      );
      setTimeout(() => setShowSuccessMessage(""), 5000);
      return;
    }

    setIsDetectingCitations(true);
    try {
      const response = await fetch(
        `/api/projects/${resolvedParams.id}/detect-citations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

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
          setShowSuccessMessage(
            `✅ Successfully detected ${data.detectedCount} citations from your content`
          );
        } else {
          setShowSuccessMessage(
            `No citations detected in your content. Try adding more specific academic content.`
          );
        }
        setTimeout(() => setShowSuccessMessage(""), 5000);
      } else {
        let errorMessage = "Citation detection failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
        }
        setShowSuccessMessage(`❌ ${errorMessage}`);
        setTimeout(() => setShowSuccessMessage(""), 5000);
      }
    } catch (error) {
      console.error("Error detecting citations:", error);
      setShowSuccessMessage(
        "❌ Citation detection failed. Please check your connection and try again."
      );
      setTimeout(() => setShowSuccessMessage(""), 5000);
    } finally {
      setIsDetectingCitations(false);
    }
  };

  // Smart encouragement logic based on progress
  const getEncouragementMessage = (progress: number) => {
    if (progress === 0) return t("encouragement.readyToStart");
    if (progress < 10) return t("encouragement.greatStart");
    if (progress < 25) return t("encouragement.buildingMomentum");
    if (progress < 50) return t("encouragement.solidProgress");
    if (progress < 75) return t("encouragement.overHalfway");
    if (progress < 90) return t("encouragement.almostThere");
    if (progress < 100) return t("encouragement.nearlyDone");
    return t("encouragement.congratulations");
  };

  // Auto-detect export settings from project data
  const detectExportSettings = (project: any) => {
    if (!project) return { citationStyle: "apa", template: "research-paper" };

    // Detect template based on project type
    const detectTemplate = (type: string) => {
      switch (type) {
        case "thesis":
          return "thesis";
        case "journal":
          return "conference-paper";
        case "research":
          return "research-paper";
        case "essay":
          return "research-paper";
        default:
          return "research-paper";
      }
    };

    // Normalize citation style
    const normalizeCitationStyle = (style: string) => {
      const styleMap: Record<
        string,
        "apa" | "mla" | "chicago" | "harvard" | "ieee"
      > = {
        APA: "apa",
        MLA: "mla",
        Chicago: "chicago",
        IEEE: "ieee",
        Harvard: "harvard",
      };
      return styleMap[style] || "apa";
    };

    return {
      citationStyle: normalizeCitationStyle(project.citationStyle),
      template: detectTemplate(project.type),
    };
  };

  // Export functions
  const handleExport = async (format?: ExportFormat) => {
    if (!project) return;

    const exportFormat = format ?? selectedExportFormat ?? "pdf";
    setSelectedExportFormat(exportFormat);
    setIsExporting(true);
    setExportingFormat(exportFormat);

    try {
      const response = await fetch(
        `/api/projects/${resolvedParams.id}/export?format=${exportFormat}&citationStyle=${selectedCitationStyle}&template=${selectedTemplate}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!response.ok) {
        // Handle paywall variant B (preview-only export block)
        if (response.status === 403) {
          try {
            const errorData = await response.json();
            if (
              errorData.requiresUpgrade &&
              errorData.paywallVariant === "variant_b"
            ) {
              // Track paywall view for export
              trackFunnel.paywallView("word_limit", "export", "variant_b");
              setShowSuccessMessage(
                "Upgrade to Pro to export your project! You can preview it here, but export requires a Pro plan."
              );
              setTimeout(() => setShowSuccessMessage(""), 6000);
              // Optionally redirect to settings/upgrade page
              setTimeout(() => {
                router.push("/settings");
              }, 2000);
              return;
            }
          } catch {
            // Fall through to generic error handling
          }
        }

        const errorText = await response.text();
        throw new Error(`Export failed: ${response.status} ${errorText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = `${project.name}`
        .trim()
        .replace(/[^a-z0-9\-_.]+/gi, "_");
      a.download = `${safeName || "akowe_project"}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setShowSuccessMessage(
        `Project exported as ${exportFormat.toUpperCase()} successfully!`
      );
      setTimeout(() => setShowSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Export error:", error);
      setShowSuccessMessage(t("errors.exportFailed"));
      setTimeout(() => setShowSuccessMessage(""), 3000);
    } finally {
      setIsExporting(false);
      setExportingFormat(null);
      setShowExportModal(false);
    }
  };

  // Update local section content when active section changes
  useEffect(() => {
    if (project && activeSection) {
      const activeS = project.sections?.find((s) => s.id === activeSection);
      if (activeS) {
        const content = activeS.content || "";
        setLocalSectionContent(content);
        setRealTimeWordCount(countWords(cleanupSectionContent(content)));
      }
    }
  }, [project, activeSection]);

  // Auto-detect export settings when project loads
  useEffect(() => {
    if (project) {
      const detectedSettings = detectExportSettings(project);
      setSelectedCitationStyle(
        detectedSettings.citationStyle as
          | "apa"
          | "mla"
          | "chicago"
          | "harvard"
          | "ieee"
      );
      setSelectedTemplate(
        detectedSettings.template as
          | "research-paper"
          | "thesis"
          | "report"
          | "conference-paper"
      );
      setIsAutoDetected({ citationStyle: true, template: true });
    }
  }, [project]);

  useEffect(() => {
    if (showExportModal) {
      setSelectedExportFormat("pdf");
    }
  }, [showExportModal]);

  // Add selection change listener for better formatting detection
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const editor = document.querySelector('[contenteditable="true"]');
        if (editor && editor.contains(range.commonAncestorContainer)) {
          checkFormattingState();
        }
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
        <Sidebar />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[hsl(var(--secondary))] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xs uppercase tracking-[0.28em] text-[hsl(var(--muted-foreground))]">
              {t("loadingWorkspace")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const activeS = project?.sections?.find((s) => s.id === activeSection);

  if (!project) {
    return (
      <div className="flex h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
        <Sidebar />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold uppercase tracking-[0.16em] mb-4">
              Project not found
            </h1>
            <Button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 uppercase tracking-[0.18em]"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <FirstProjectCompletion />
      <style jsx>{`
        .prose ul {
          list-style-type: disc;
          margin-left: 1.5rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .prose ol {
          list-style-type: decimal;
          margin-left: 1.5rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .prose li {
          margin-bottom: 0.25rem;
        }
        .prose strong,
        .prose b {
          font-weight: 600;
        }
        .prose em,
        .prose i {
          font-style: italic;
        }
        .prose h1,
        .prose h2,
        .prose h3,
        .prose h4,
        .prose h5,
        .prose h6 {
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }
        .prose h1 {
          font-size: 1.875rem;
          line-height: 1.2;
        }
        .prose h2 {
          font-size: 1.5rem;
          line-height: 1.3;
        }
        .prose h3 {
          font-size: 1.25rem;
          line-height: 1.4;
        }
        .prose h4 {
          font-size: 1.125rem;
          line-height: 1.4;
        }
        .prose h5 {
          font-size: 1rem;
          line-height: 1.5;
        }
        .prose h6 {
          font-size: 0.875rem;
          line-height: 1.5;
        }
        /* Ensure contentEditable formatting works properly */
        [contenteditable="true"] {
          outline: none;
        }
        [contenteditable="true"]:focus {
          outline: none;
        }
        [contenteditable="true"] strong,
        [contenteditable="true"] b {
          font-weight: 600;
        }
        [contenteditable="true"] em,
        [contenteditable="true"] i {
          font-style: italic;
        }
        [contenteditable="true"] ul {
          list-style-type: disc;
          margin-left: 1.5rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        [contenteditable="true"] ol {
          list-style-type: decimal;
          margin-left: 1.5rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        [contenteditable="true"] li {
          margin-bottom: 0.25rem;
        }
        [contenteditable="true"] h1 {
          font-size: 1.875rem;
          font-weight: 600;
          line-height: 1.2;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }
        [contenteditable="true"] h2 {
          font-size: 1.5rem;
          font-weight: 600;
          line-height: 1.3;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }
        [contenteditable="true"] h3 {
          font-size: 1.25rem;
          font-weight: 600;
          line-height: 1.4;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }

        /* Tablet and iPad optimizations */
        @media (max-width: 1024px) {
          .toolbar-container {
            flex-wrap: nowrap;
            overflow-x: auto;
            scrollbar-width: thin;
            scrollbar-color: #cbd5e0 transparent;
          }
          .toolbar-container::-webkit-scrollbar {
            height: 4px;
          }
          .toolbar-container::-webkit-scrollbar-track {
            background: transparent;
          }
          .toolbar-container::-webkit-scrollbar-thumb {
            background-color: #cbd5e0;
            border-radius: 2px;
          }
          .toolbar-button {
            flex-shrink: 0;
          }
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .toolbar-container {
            gap: 0.25rem;
            padding: 0.5rem;
          }
          .toolbar-button {
            min-width: 40px;
            min-height: 40px;
          }
        }
      `}</style>
      <div className="flex h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
        <Sidebar />
        <MobileMenuButton />

        <div
          className={cn(
            "flex-1 overflow-y-auto transition-all duration-300",
            isAIDrawerOpen ? "md:mr-80 md:ml-56" : "md:ml-64"
          )}
        >
          <div className="max-w-7xl mx-auto p-4 pt-16 md:pt-6 md:p-8 lg:p-10 space-y-6 md:space-y-10">
            {/* Project Header */}
            <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] p-4 md:p-6 lg:p-8 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold uppercase tracking-[0.12em]">
                  {project.name}
                </h1>
                <button
                  onClick={() => setIsAIDrawerOpen(true)}
                  className="hidden md:inline-flex items-center gap-2 border-2 border-[hsl(var(--border-strong))] px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform duration-150"
                >
                  <Bot className="h-4 w-4" />
                  Open Assistant
                </button>
              </div>
              <p className="text-[10px] md:text-[11px] uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
                {project.type} • {localWordCount} / {project.targetWordCount}{" "}
                {t("words")} • {project.citationStyle}
              </p>
            </div>

            {/* Desktop Experience Note - Top of Page (Mobile Only) */}
            {isMobile && showDesktopNoteTop && (
              <div className="md:hidden mb-4 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] rounded-(--radius) p-3 shadow-[4px_4px_0_rgba(29,41,57,0.12)]">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] leading-relaxed flex-1">
                    💡 For the best experience, use Akọ̀wé on desktop
                  </p>
                  <button
                    onClick={() => {
                      setShowDesktopNoteTop(false);
                      localStorage.setItem(
                        "akowe-desktop-note-top-dismissed",
                        "true"
                      );
                    }}
                    className="flex-shrink-0 p-1 hover:bg-[hsl(var(--accent-foreground))]/10 rounded-(--radius) transition-colors"
                    aria-label={t("dismiss")}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}

            <div className="grid gap-4 md:gap-6 lg:gap-8 grid-cols-12">
              {/* Left Column - Sections and Actions (Hidden on mobile, shown in drawer) */}
              <div
                className={cn(
                  "hidden md:block space-y-6 lg:space-y-8 col-span-12 md:col-span-4 lg:col-span-3 md:sticky md:top-4 self-start"
                )}
              >
                {/* Sections Panel */}
                <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-(--radius) shadow-[6px_6px_0_rgba(29,41,57,0.12)]">
                  <div className="p-4 border-b-[3px] border-[hsl(var(--border-strong))] flex items-center justify-between">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.24em]">
                        {t("paperSections")}
                      </h3>
                    </div>
                    <button
                      onClick={addNewSection}
                      className="border-2 border-[hsl(var(--border-strong))] px-2 py-1 text-xs font-semibold uppercase tracking-[0.2em] hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform duration-150"
                      title={t("addNewSection")}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="space-y-1">
                      {project.sections?.map((section) => (
                        <div
                          key={section.id}
                          draggable
                          onDragStart={(e) => {
                            setDraggedSectionId(section.id);
                            e.dataTransfer.effectAllowed = "move";
                            e.dataTransfer.setData("text/plain", section.id);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                            if (section.id !== draggedSectionId) {
                              setDragOverSectionId(section.id);
                            }
                          }}
                          onDragLeave={() => {
                            setDragOverSectionId(null);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (
                              draggedSectionId &&
                              draggedSectionId !== section.id
                            ) {
                              reorderSections(draggedSectionId, section.id);
                            }
                            setDraggedSectionId(null);
                            setDragOverSectionId(null);
                          }}
                          onDragEnd={() => {
                            setDraggedSectionId(null);
                            setDragOverSectionId(null);
                          }}
                          className={cn(
                            "w-full px-3 py-2 rounded-(--radius) text-xs uppercase tracking-[0.18em] transition-all duration-150 group border-2 border-[hsl(var(--border))]",
                            activeSection === section.id
                              ? "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] border-[hsl(var(--border-strong))] -translate-x-[0.125rem] -translate-y-[0.125rem] shadow-[4px_4px_0_rgba(29,41,57,0.12)]"
                              : "bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] hover:border-[hsl(var(--border-strong))] hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem]",
                            draggedSectionId === section.id &&
                              "opacity-50 cursor-grabbing",
                            dragOverSectionId === section.id &&
                              "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="cursor-grab active:cursor-grabbing touch-manipulation flex-shrink-0"
                              draggable={false}
                              onTouchStart={(e) => {
                                // Prevent drag when touching grip icon
                                e.stopPropagation();
                              }}
                              title={t("dragToReorder")}
                            >
                              <GripVertical className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                            </div>
                            <div
                              className={cn(
                                "w-2 h-2 rounded-full flex-shrink-0",
                                activeSection === section.id
                                  ? "bg-[hsl(var(--secondary-foreground))]"
                                  : "bg-[hsl(var(--border-strong))]"
                              )}
                            />
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <button
                                onClick={() => setActiveSection(section.id)}
                                className={`flex-1 text-left min-w-0 ${
                                  activeSection === section.id
                                    ? "active-section-button"
                                    : ""
                                }`}
                              >
                                {editingSectionId === section.id ? (
                                  <input
                                    type="text"
                                    value={editingTitle}
                                    onChange={(e) =>
                                      setEditingTitle(e.target.value)
                                    }
                                    onBlur={() => {
                                      if (editingTitle.trim()) {
                                        updateSectionTitle(
                                          section.id,
                                          editingTitle
                                        );
                                      } else {
                                        setEditingSectionId(null);
                                      }
                                    }}
                                    onKeyPress={(e) => {
                                      if (
                                        e.key === "Enter" &&
                                        editingTitle.trim()
                                      ) {
                                        updateSectionTitle(
                                          section.id,
                                          editingTitle
                                        );
                                      } else if (e.key === "Escape") {
                                        setEditingSectionId(null);
                                        setEditingTitle(section.title);
                                      }
                                    }}
                                    className="bg-transparent border-none outline-none w-full text-sm font-medium"
                                    autoFocus
                                    style={{ minWidth: "100px" }}
                                  />
                                ) : (
                                  <span
                                    className="cursor-pointer px-2 py-1 rounded font-semibold block truncate touch-manipulation"
                                    onDoubleClick={() => {
                                      setEditingSectionId(section.id);
                                      setEditingTitle(section.title);
                                    }}
                                    onTouchEnd={(e) => {
                                      // Handle double tap on mobile
                                      const now = Date.now();
                                      const lastTap =
                                        (e.currentTarget as any).lastTap || 0;
                                      const timeSinceLastTap = now - lastTap;

                                      if (
                                        timeSinceLastTap < 300 &&
                                        timeSinceLastTap > 0
                                      ) {
                                        // Double tap detected
                                        e.preventDefault();
                                        setEditingSectionId(section.id);
                                        setEditingTitle(section.title);
                                      }
                                      (e.currentTarget as any).lastTap = now;
                                    }}
                                    title={t("sectionDoubleTapEdit", { title: section.title })}
                                  >
                                    {section.title}
                                  </span>
                                )}
                              </button>
                              <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 md:group-hover:opacity-100 opacity-100 md:opacity-0 transition-opacity md:w-0 md:overflow-hidden md:group-hover:w-auto md:group-hover:overflow-visible md:transition-[width,opacity]">
                                <button
                                  onTouchStart={(e) => {
                                    // Prevent triggering onClick when tapping edit button
                                    e.stopPropagation();
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingSectionId(section.id);
                                    setEditingTitle(section.title);
                                  }}
                                  className="p-1.5 border border-transparent hover:bg-[hsl(var(--accent))] active:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))] rounded transition-colors touch-manipulation"
                                  title={t("editSectionName")}
                                >
                                  <Edit3 className="h-3 w-3" />
                                </button>
                                <button
                                  onTouchStart={(e) => {
                                    e.stopPropagation();
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSectionToDelete(section.id);
                                  }}
                                  className="p-1.5 border border-transparent hover:bg-[hsl(var(--accent))] active:bg-[hsl(var(--accent))] hover:text-[hsl(var(--destructive))] rounded text-[hsl(var(--destructive))] transition-colors touch-manipulation"
                                  title={t("deleteSection")}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Research & Quality Tools */}
                <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-(--radius) shadow-[6px_6px_0_rgba(29,41,57,0.12)]">
                  <div className="p-4 border-b-[3px] border-[hsl(var(--border-strong))]">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.24em]">
                      {t("tools")}
                    </h3>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] mt-1">
                      {t("researchAndQuality")}
                    </p>
                  </div>
                  <div className="p-4 space-y-2">
                    <div
                      onClick={() => discoverCitations()}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 border-2 border-[hsl(var(--border))] rounded-(--radius) cursor-pointer transition-transform duration-150 text-xs uppercase tracking-[0.18em]",
                        isDiscoveringCitations
                          ? "opacity-60 cursor-not-allowed"
                          : "hover:border-[hsl(var(--border-strong))] hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem]"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        <span className="font-semibold">{t("findCitations")}</span>
                      </div>
                      {isDiscoveringCitations && (
                        <div className="w-2 h-2 bg-[hsl(var(--secondary))] rounded-full animate-pulse"></div>
                      )}
                    </div>

                    <div
                      onClick={() => setShowManualCitationModal(true)}
                      className="flex items-center justify-between px-3 py-2 border-2 border-[hsl(var(--border))] rounded-(--radius) cursor-pointer text-xs uppercase tracking-[0.18em] hover:border-[hsl(var(--border-strong))] hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform duration-150"
                    >
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        <span className="font-semibold">{t("addCitation")}</span>
                      </div>
                    </div>

                    <div
                      onClick={detectCitations}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 border-2 border-[hsl(var(--border))] rounded-(--radius) cursor-pointer text-xs uppercase tracking-[0.18em] transition-transform duration-150",
                        isDetectingCitations || !hasContentToScan
                          ? "opacity-60 cursor-not-allowed"
                          : "hover:border-[hsl(var(--border-strong))] hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem]"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <BookMarked className="h-4 w-4" />
                        <span className="font-semibold">{t("scanContent")}</span>
                      </div>
                      {isDetectingCitations && (
                        <div className="w-2 h-2 bg-[hsl(var(--secondary))] rounded-full animate-pulse"></div>
                      )}
                    </div>

                    <div className="border-t-2 border-[hsl(var(--border-strong))] my-4"></div>

                    <div
                      onClick={checkPlagiarism}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 border-2 border-[hsl(var(--border))] rounded-(--radius) cursor-pointer text-xs uppercase tracking-[0.18em] transition-transform duration-150",
                        isCheckingPlagiarism
                          ? "opacity-60 cursor-not-allowed"
                          : "hover:border-[hsl(var(--border-strong))] hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem]"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span className="font-semibold">Check Plagiarism</span>
                      </div>
                      {isCheckingPlagiarism && (
                        <div className="w-2 h-2 bg-[hsl(var(--secondary))] rounded-full animate-pulse"></div>
                      )}
                    </div>

                    <div className="border-t-2 border-[hsl(var(--border-strong))] my-4"></div>

                    <div
                      onClick={() => setShowExportModal(true)}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 border-2 border-[hsl(var(--border))] rounded-(--radius) cursor-pointer text-xs uppercase tracking-[0.18em] transition-transform duration-150",
                        isExporting
                          ? "opacity-60 cursor-not-allowed"
                          : "hover:border-[hsl(var(--border-strong))] hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem]"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        <span className="font-semibold">{t("exportProject")}</span>
                      </div>
                      {isExporting && (
                        <div className="w-2 h-2 bg-[hsl(var(--secondary))] rounded-full animate-pulse"></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Tools Drawer */}
              <MobileToolsDrawer>
                <div className="space-y-6">
                  {/* Desktop Experience Note - Tools Drawer */}
                  {showDesktopNoteTools && (
                    <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] rounded-(--radius) p-3 shadow-[4px_4px_0_rgba(29,41,57,0.12)]">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[10px] uppercase tracking-[0.18em] leading-relaxed flex-1">
                          💡 For the best experience, use Akọ̀wé on desktop
                        </p>
                        <button
                          onClick={() => {
                            setShowDesktopNoteTools(false);
                            localStorage.setItem(
                              "akowe-desktop-note-tools-dismissed",
                              "true"
                            );
                          }}
                          className="flex-shrink-0 p-1 hover:bg-[hsl(var(--accent-foreground))]/10 rounded-(--radius) transition-colors"
                          aria-label={t("dismiss")}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Mobile Sections Panel */}
                  <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-(--radius)">
                    <div className="p-4 border-b-2 border-[hsl(var(--border-strong))] flex items-center justify-between">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.24em]">
                        {t("paperSections")}
                      </h3>
                      <button
                        onClick={addNewSection}
                        className="border-2 border-[hsl(var(--border-strong))] px-2 py-1 text-xs font-semibold uppercase tracking-[0.2em] hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform duration-150"
                        title={t("addNewSection")}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="p-4">
                      <div className="space-y-1">
                        {project.sections?.map((section) => (
                          <div
                            key={section.id}
                            draggable
                            onDragStart={(e) => {
                              setDraggedSectionId(section.id);
                              e.dataTransfer.effectAllowed = "move";
                              e.dataTransfer.setData("text/plain", section.id);
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = "move";
                              if (section.id !== draggedSectionId) {
                                setDragOverSectionId(section.id);
                              }
                            }}
                            onDragLeave={() => {
                              setDragOverSectionId(null);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (
                                draggedSectionId &&
                                draggedSectionId !== section.id
                              ) {
                                reorderSections(draggedSectionId, section.id);
                              }
                              setDraggedSectionId(null);
                              setDragOverSectionId(null);
                            }}
                            onDragEnd={() => {
                              setDraggedSectionId(null);
                              setDragOverSectionId(null);
                            }}
                            className={cn(
                              "w-full px-3 py-2 rounded-(--radius) text-xs uppercase tracking-[0.18em] transition-all duration-150 border-2 border-[hsl(var(--border))]",
                              activeSection === section.id
                                ? "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] border-[hsl(var(--border-strong))]"
                                : "bg-[hsl(var(--surface))] text-[hsl(var(--foreground))]",
                              draggedSectionId === section.id && "opacity-50",
                              dragOverSectionId === section.id &&
                                "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="cursor-grab active:cursor-grabbing touch-manipulation flex-shrink-0"
                                draggable={false}
                                title={t("dragToReorder")}
                              >
                                <GripVertical className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                              </div>
                              <div
                                className={cn(
                                  "w-2 h-2 rounded-full flex-shrink-0",
                                  activeSection === section.id
                                    ? "bg-[hsl(var(--secondary-foreground))]"
                                    : "bg-[hsl(var(--border-strong))]"
                                )}
                              />
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {editingSectionId === section.id ? (
                                  <input
                                    type="text"
                                    value={editingTitle}
                                    onChange={(e) =>
                                      setEditingTitle(e.target.value)
                                    }
                                    onBlur={() => {
                                      if (editingTitle.trim()) {
                                        updateSectionTitle(
                                          section.id,
                                          editingTitle
                                        );
                                      } else {
                                        setEditingSectionId(null);
                                      }
                                    }}
                                    onKeyPress={(e) => {
                                      if (
                                        e.key === "Enter" &&
                                        editingTitle.trim()
                                      ) {
                                        updateSectionTitle(
                                          section.id,
                                          editingTitle
                                        );
                                      } else if (e.key === "Escape") {
                                        setEditingSectionId(null);
                                        setEditingTitle(section.title);
                                      }
                                    }}
                                    className="bg-transparent border-none outline-none w-full text-sm font-medium"
                                    autoFocus
                                    style={{ minWidth: "100px" }}
                                  />
                                ) : (
                                  <button
                                    onClick={() => setActiveSection(section.id)}
                                    onTouchEnd={(e) => {
                                      // Handle double tap on mobile
                                      const now = Date.now();
                                      const lastTap =
                                        (e.currentTarget as any).lastTap || 0;
                                      const timeSinceLastTap = now - lastTap;

                                      if (
                                        timeSinceLastTap < 300 &&
                                        timeSinceLastTap > 0
                                      ) {
                                        // Double tap detected
                                        e.preventDefault();
                                        setEditingSectionId(section.id);
                                        setEditingTitle(section.title);
                                        return;
                                      }
                                      (e.currentTarget as any).lastTap = now;
                                    }}
                                    className="flex-1 text-left min-w-0 touch-manipulation"
                                  >
                                    <span className="font-semibold truncate block">
                                      {section.title}
                                    </span>
                                  </button>
                                )}
                              </div>
                              {editingSectionId !== section.id && (
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <button
                                    onTouchStart={(e) => {
                                      e.stopPropagation();
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingSectionId(section.id);
                                      setEditingTitle(section.title);
                                    }}
                                    className="p-1.5 border border-transparent active:bg-[hsl(var(--accent))] active:text-[hsl(var(--accent-foreground))] rounded transition-colors touch-manipulation"
                                    title={t("editSectionNameShort")}
                                  >
                                    <Edit3 className="h-3 w-3" />
                                  </button>
                                  <button
                                    onTouchStart={(e) => {
                                      e.stopPropagation();
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSectionToDelete(section.id);
                                    }}
                                    className="p-1.5 border border-transparent active:bg-[hsl(var(--accent))] active:text-[hsl(var(--destructive))] rounded text-[hsl(var(--destructive))] transition-colors touch-manipulation"
title={t("deleteSection")}
                                    >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Mobile Tools Panel */}
                  <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-(--radius)">
                    <div className="p-4 border-b-2 border-[hsl(var(--border-strong))]">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.24em]">
                        Tools
                      </h3>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] mt-1">
                        Research & quality
                      </p>
                    </div>
                    <div className="p-4 space-y-2">
                      <button
                        onClick={() => setIsAIDrawerOpen(true)}
                        className="w-full flex items-center justify-between px-3 py-2 border-2 border-[hsl(var(--secondary))] bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] rounded-(--radius) text-xs uppercase tracking-[0.18em]"
                      >
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4" />
                          <span className="font-semibold">AI Assistant</span>
                        </div>
                      </button>

                      <div className="border-t-2 border-[hsl(var(--border-strong))] my-4"></div>

                      <button
                        onClick={() => discoverCitations()}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 border-2 border-[hsl(var(--border))] rounded-(--radius) text-xs uppercase tracking-[0.18em]",
                          isDiscoveringCitations ? "opacity-60" : ""
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          <span className="font-semibold">{t("findCitations")}</span>
                        </div>
                      </button>

                      <button
                        onClick={() => setShowManualCitationModal(true)}
                        className="w-full flex items-center justify-between px-3 py-2 border-2 border-[hsl(var(--border))] rounded-(--radius) text-xs uppercase tracking-[0.18em]"
                      >
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          <span className="font-semibold">{t("addCitation")}</span>
                        </div>
                      </button>

                      <button
                        onClick={detectCitations}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 border-2 border-[hsl(var(--border))] rounded-(--radius) text-xs uppercase tracking-[0.18em]",
                          isDetectingCitations || !hasContentToScan
                            ? "opacity-60"
                            : ""
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <BookMarked className="h-4 w-4" />
                          <span className="font-semibold">{t("scanContent")}</span>
                        </div>
                      </button>

                      <div className="border-t-2 border-[hsl(var(--border-strong))] my-4"></div>

                      <button
                        onClick={checkPlagiarism}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 border-2 border-[hsl(var(--border))] rounded-(--radius) text-xs uppercase tracking-[0.18em]",
                          isCheckingPlagiarism ? "opacity-60" : ""
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          <span className="font-semibold">
                            Check Plagiarism
                          </span>
                        </div>
                      </button>

                      <div className="border-t-2 border-[hsl(var(--border-strong))] my-4"></div>

                      <button
                        onClick={() => setShowExportModal(true)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 border-2 border-[hsl(var(--border))] rounded-(--radius) text-xs uppercase tracking-[0.18em]",
                          isExporting ? "opacity-60" : ""
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Download className="h-4 w-4" />
                          <span className="font-semibold">{t("exportProject")}</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </MobileToolsDrawer>

              {/* Mobile Floating Tools Button */}
              <MobileProjectToolsButton
                sectionCount={project?.sections?.length || 0}
              />

              {/* Right Column - Editor */}
              <div className="col-span-12 md:col-span-8 lg:col-span-9 space-y-4 md:space-y-6">
                {activeS ? (
                  <div
                    ref={editorSectionRef}
                    className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-(--radius) shadow-[6px_6px_0_rgba(29,41,57,0.12)]"
                  >
                    <div className="p-4 md:p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <h2 className="text-lg md:text-xl font-semibold uppercase tracking-[0.18em]">
                          {activeS.title}
                        </h2>
                        <button
                          onClick={() => setIsAIDrawerOpen(true)}
                          className="hidden sm:inline-flex items-center gap-2 border-2 border-[hsl(var(--border-strong))] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform duration-150"
                        >
                          <Bot className="h-4 w-4" />
                          {t("askAkowe")}
                        </button>
                      </div>
                      <div className="border-[3px] border-[hsl(var(--border-strong))] rounded-(--radius) overflow-hidden bg-[hsl(var(--surface))]">
                        {/* Rich Text Toolbar */}
                        <div className="border-b-[3px] border-[hsl(var(--border-strong))] p-2 md:p-3 flex items-center gap-1 md:gap-2 bg-[hsl(var(--surface-muted))] overflow-x-auto toolbar-container">
                          {/* Undo/Redo */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={undo}
                              className="cursor-pointer p-2 md:p-2 border-2 border-transparent hover:border-[hsl(var(--border-strong))] rounded-(--radius) transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center toolbar-button"
                              title={t("undo")}
                            >
                              <Undo className="h-4 w-4" />
                            </button>
                            <button
                              onClick={redo}
                              className="cursor-pointer p-2 md:p-2 border-2 border-transparent hover:border-[hsl(var(--border-strong))] rounded-(--radius) transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center toolbar-button"
                              title={t("redo")}
                            >
                              <Redo className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="w-px h-6 bg-[hsl(var(--border-strong))] mx-1"></div>

                          {/* Text Formatting */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={applyBold}
                              className={cn(
                                "cursor-pointer p-2 rounded-(--radius) transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center toolbar-button border-2 border-transparent",
                                formattingState.bold
                                  ? "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] border-[hsl(var(--border-strong))]"
                                  : "hover:border-[hsl(var(--border-strong))]"
                              )}
                              title={t("bold")}
                            >
                              <Bold className="h-4 w-4" />
                            </button>
                            <button
                              onClick={applyItalic}
                              className={cn(
                                "cursor-pointer p-2 rounded-(--radius) transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center toolbar-button border-2 border-transparent",
                                formattingState.italic
                                  ? "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] border-[hsl(var(--border-strong))]"
                                  : "hover:border-[hsl(var(--border-strong))]"
                              )}
                              title="Italic (Ctrl+I)"
                            >
                              <Italic className="h-4 w-4" />
                            </button>
                            <button
                              onClick={applyUnderline}
                              className={cn(
                                "cursor-pointer p-2 rounded-(--radius) transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center toolbar-button border-2 border-transparent",
                                formattingState.underline
                                  ? "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] border-[hsl(var(--border-strong))]"
                                  : "hover:border-[hsl(var(--border-strong))]"
                              )}
                              title={t("underline")}
                            >
                              <Underline className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="w-px h-6 bg-[hsl(var(--border-strong))] mx-1"></div>

                          {/* Lists */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={applyUnorderedList}
                              className={cn(
                                "cursor-pointer p-2 rounded-(--radius) transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center toolbar-button border-2 border-transparent",
                                formattingState.unorderedList
                                  ? "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] border-[hsl(var(--border-strong))]"
                                  : "hover:border-[hsl(var(--border-strong))]"
                              )}
                              title={t("bulletList")}
                            >
                              <List className="h-4 w-4" />
                            </button>
                            <button
                              onClick={applyOrderedList}
                              className={cn(
                                "cursor-pointer p-2 rounded-(--radius) transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center toolbar-button border-2 border-transparent",
                                formattingState.orderedList
                                  ? "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] border-[hsl(var(--border-strong))]"
                                  : "hover:border-[hsl(var(--border-strong))]"
                              )}
                              title={t("numberedList")}
                            >
                              <Hash className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="w-px h-6 bg-[hsl(var(--border-strong))] mx-1"></div>

                          {/* Headers */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => applyHeader(1)}
                              className={cn(
                                "cursor-pointer p-2 rounded-(--radius) transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center toolbar-button border-2 border-transparent",
                                formattingState.h1
                                  ? "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] border-[hsl(var(--border-strong))]"
                                  : "hover:border-[hsl(var(--border-strong))]"
                              )}
                              title={t("header1")}
                            >
                              <span className="text-sm font-bold">H1</span>
                            </button>
                            <button
                              onClick={() => applyHeader(2)}
                              className={cn(
                                "cursor-pointer p-2 rounded-(--radius) transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center toolbar-button border-2 border-transparent",
                                formattingState.h2
                                  ? "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] border-[hsl(var(--border-strong))]"
                                  : "hover:border-[hsl(var(--border-strong))]"
                              )}
                              title={t("header2")}
                            >
                              <span className="text-sm font-bold">H2</span>
                            </button>
                            <button
                              onClick={() => applyHeader(3)}
                              className={cn(
                                "cursor-pointer p-2 rounded-(--radius) transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center toolbar-button border-2 border-transparent",
                                formattingState.h3
                                  ? "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] border-[hsl(var(--border-strong))]"
                                  : "hover:border-[hsl(var(--border-strong))]"
                              )}
                              title={t("header3")}
                            >
                              <span className="text-sm font-bold">H3</span>
                            </button>
                            <button
                              onClick={applyNormal}
                              className={cn(
                                "cursor-pointer p-2 rounded-(--radius) transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center toolbar-button border-2 border-transparent",
                                formattingState.normal
                                  ? "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] border-[hsl(var(--border-strong))]"
                                  : "hover:border-[hsl(var(--border-strong))]"
                              )}
                              title={t("normalText")}
                            >
                              <span className="text-sm font-medium">
                                {t("normal")}
                              </span>
                            </button>
                          </div>

                          <div className="w-px h-6 bg-gray-300 mx-1"></div>

                          {/* Math and Charts */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setShowMathModal(true)}
                              className="cursor-pointer p-2 rounded-(--radius) border-2 border-transparent hover:border-[hsl(var(--border-strong))] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center toolbar-button"
                              title={t("insertMathEquation")}
                            >
                              <Calculator className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setShowChartModal(true)}
                              className="cursor-pointer p-2 rounded-(--radius) border-2 border-transparent hover:border-[hsl(var(--border-strong))] transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center toolbar-button"
                              title={t("insertChart")}
                            >
                              <BarChart3 className="h-4 w-4" />
                            </button>
                            <div className="w-px h-6 bg-[hsl(var(--border-strong))] mx-1" />
                            <button
                              onClick={() => openRewritePanel(false)}
                              disabled={!hasTextSelection}
                              className={cn(
                                "cursor-pointer p-2 rounded-(--radius) transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center toolbar-button border-2 border-transparent",
                                hasTextSelection
                                  ? "hover:border-[hsl(var(--border-strong))] text-[hsl(var(--primary))]"
                                  : "opacity-40 cursor-not-allowed"
                              )}
                              title={t("rewriteWithAI")}
                            >
                              <Sparkles className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="flex-1"></div>
                          <span className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] font-semibold">
                            {realTimeWordCount} {t("words")}
                          </span>
                        </div>

                        {/* Editor */}
                        <div
                          ref={(el) => {
                            editorContentEditableRef.current = el;
                            if (el && !el.dataset.initialized) {
                              const sectionContent = activeS?.content || "";
                              const newContent =
                                cleanupSectionContent(sectionContent) ||
                                "<p><br></p>";
                              el.innerHTML = newContent;
                              el.dataset.initialized = "true";
                            }
                          }}
                          contentEditable
                          spellCheck="true"
                          suppressContentEditableWarning
                          onInput={handleTextInput}
                          onContextMenu={(e) => {
                            const selection = window.getSelection();
                            if (selection && selection.rangeCount > 0) {
                              const range = selection
                                .getRangeAt(0)
                                .cloneRange();
                              storedInsertRangeRef.current = range;
                              const hasSelection = selection.toString().trim().length > 0;
                              setContextMenuHasSelection(hasSelection);
                              setContextMenuPillPosition(
                                viewportSafePillPosition(e.clientX, e.clientY)
                              );
                              setContextMenuPillVisible(true);
                            }
                          }}
                          onTouchStart={(e) => {
                            if (e.changedTouches.length === 0) return;
                            const t = e.changedTouches[0];
                            longPressTouchRef.current = {
                              clientX: t.clientX,
                              clientY: t.clientY,
                            };
                            longPressTimerRef.current = setTimeout(() => {
                              longPressTimerRef.current = null;
                              const pos = longPressTouchRef.current;
                              if (!pos) return;
                              const range = getRangeAtPoint(
                                pos.clientX,
                                pos.clientY
                              );
                              if (range) storedInsertRangeRef.current = range;
                              setContextMenuPillPosition(
                                viewportSafePillPosition(
                                  pos.clientX,
                                  pos.clientY
                                )
                              );
                              setContextMenuPillVisible(true);
                            }, 500);
                          }}
                          onTouchMove={() => {
                            if (longPressTimerRef.current) {
                              clearTimeout(longPressTimerRef.current);
                              longPressTimerRef.current = null;
                            }
                          }}
                          onTouchEnd={() => {
                            if (longPressTimerRef.current) {
                              clearTimeout(longPressTimerRef.current);
                              longPressTimerRef.current = null;
                            }
                            longPressTouchRef.current = null;
                          }}
                          onMouseUp={checkFormattingState}
                          onMouseDown={checkFormattingState}
                          onKeyUp={(e) => {
                            checkFormattingState();
                            // Handle keyboard shortcuts
                            if (e.ctrlKey || e.metaKey) {
                              if (e.key === "b") {
                                e.preventDefault();
                                applyBold();
                              } else if (e.key === "i") {
                                e.preventDefault();
                                applyItalic();
                              } else if (e.key === "u") {
                                e.preventDefault();
                                applyUnderline();
                              } else if (e.key === "z" && !e.shiftKey) {
                                e.preventDefault();
                                undo();
                              } else if (e.key === "z" && e.shiftKey) {
                                e.preventDefault();
                                redo();
                              }
                            }
                          }}
                          onKeyDown={(e) => {
                            checkFormattingState();

                            // Handle Backspace and Delete keys for math equations
                            if (e.key === "Backspace" || e.key === "Delete") {
                              const selection = window.getSelection();
                              if (selection && selection.rangeCount > 0) {
                                const range = selection.getRangeAt(0);
                                let element = range.commonAncestorContainer;

                                // Walk up to find the element
                                while (
                                  element &&
                                  element.nodeType !== Node.ELEMENT_NODE
                                ) {
                                  element = element.parentNode as Node;
                                }

                                if (element) {
                                  let currentElement = element as Element;

                                  // Check if we're inside a math equation
                                  while (
                                    currentElement &&
                                    currentElement !== document.body
                                  ) {
                                    if (
                                      currentElement.classList &&
                                      currentElement.classList.contains(
                                        "math-equation"
                                      )
                                    ) {
                                      // We're inside a math equation - allow normal character deletion
                                      // Only delete the entire equation if it becomes empty after this deletion

                                      // Let the browser handle the normal deletion first
                                      // We'll check if the equation becomes empty after the deletion
                                      setTimeout(() => {
                                        const mathEquation =
                                          currentElement as Element;
                                        const textContent =
                                          mathEquation.textContent?.trim() ||
                                          "";

                                        // If the equation is now empty or only contains $ symbols, remove it
                                        if (
                                          textContent === "" ||
                                          textContent === "$" ||
                                          textContent === "$$"
                                        ) {
                                          mathEquation.remove();

                                          // Trigger input event to update editor state
                                          const inputEvent = new Event(
                                            "input",
                                            { bubbles: true }
                                          );
                                          (
                                            e.target as HTMLElement
                                          ).dispatchEvent(inputEvent);

                                          // Update word count and save
                                          if (activeSection) {
                                            const editorElement =
                                              document.querySelector(
                                                "[contentEditable]"
                                              ) as HTMLElement;
                                            if (editorElement) {
                                              const updatedContent =
                                                editorElement.innerHTML;
                                              handleSectionChange(
                                                activeSection,
                                                updatedContent
                                              );
                                            }
                                          }
                                        }
                                      }, 0);

                                      // Don't prevent default - let normal character deletion happen
                                      return;
                                    }
                                    currentElement =
                                      currentElement.parentElement as Element;
                                  }

                                  // Check if cursor is right before a math equation (for Backspace)
                                  if (e.key === "Backspace") {
                                    const nextSibling =
                                      range.startContainer.nextSibling;
                                    if (
                                      nextSibling &&
                                      nextSibling.nodeType === Node.ELEMENT_NODE
                                    ) {
                                      const nextElement =
                                        nextSibling as Element;
                                      if (
                                        nextElement.classList &&
                                        nextElement.classList.contains(
                                          "math-equation"
                                        )
                                      ) {
                                        e.preventDefault();
                                        nextElement.remove();

                                        // Trigger input event to update editor state
                                        const inputEvent = new Event("input", {
                                          bubbles: true,
                                        });
                                        (e.target as HTMLElement).dispatchEvent(
                                          inputEvent
                                        );

                                        // Update word count and save
                                        if (activeSection) {
                                          const editorElement =
                                            document.querySelector(
                                              "[contentEditable]"
                                            ) as HTMLElement;
                                          if (editorElement) {
                                            const updatedContent =
                                              editorElement.innerHTML;
                                            handleSectionChange(
                                              activeSection,
                                              updatedContent
                                            );
                                          }
                                        }
                                        return;
                                      }
                                    }
                                  }

                                  // Check if cursor is right after a math equation (for Delete)
                                  if (e.key === "Delete") {
                                    const prevSibling =
                                      range.startContainer.previousSibling;
                                    if (
                                      prevSibling &&
                                      prevSibling.nodeType === Node.ELEMENT_NODE
                                    ) {
                                      const prevElement =
                                        prevSibling as Element;
                                      if (
                                        prevElement.classList &&
                                        prevElement.classList.contains(
                                          "math-equation"
                                        )
                                      ) {
                                        e.preventDefault();
                                        prevElement.remove();

                                        // Trigger input event to update editor state
                                        const inputEvent = new Event("input", {
                                          bubbles: true,
                                        });
                                        (e.target as HTMLElement).dispatchEvent(
                                          inputEvent
                                        );

                                        // Update word count and save
                                        if (activeSection) {
                                          const editorElement =
                                            document.querySelector(
                                              "[contentEditable]"
                                            ) as HTMLElement;
                                          if (editorElement) {
                                            const updatedContent =
                                              editorElement.innerHTML;
                                            handleSectionChange(
                                              activeSection,
                                              updatedContent
                                            );
                                          }
                                        }
                                        return;
                                      }
                                    }
                                  }
                                }
                              }
                            }

                            // Handle Enter key for better UX
                            if (e.key === "Enter") {
                              const selection = window.getSelection();
                              if (selection && selection.rangeCount > 0) {
                                const range = selection.getRangeAt(0);
                                let element = range.commonAncestorContainer;

                                // Walk up to find the element
                                while (
                                  element &&
                                  element.nodeType !== Node.ELEMENT_NODE
                                ) {
                                  element = element.parentNode as Node;
                                }

                                if (element) {
                                  let currentElement = element as Element;

                                  // Check if we're in a header
                                  while (
                                    currentElement &&
                                    currentElement !== document.body
                                  ) {
                                    if (
                                      currentElement.tagName === "H1" ||
                                      currentElement.tagName === "H2" ||
                                      currentElement.tagName === "H3"
                                    ) {
                                      // In a header - create normal paragraph after
                                      e.preventDefault();
                                      const newDiv =
                                        document.createElement("div");
                                      newDiv.innerHTML = "&nbsp;";
                                      currentElement.parentNode?.insertBefore(
                                        newDiv,
                                        currentElement.nextSibling
                                      );

                                      // Position cursor in new paragraph
                                      const newRange = document.createRange();
                                      newRange.setStart(newDiv, 0);
                                      newRange.collapse(true);
                                      selection.removeAllRanges();
                                      selection.addRange(newRange);
                                      return;
                                    }
                                    currentElement =
                                      currentElement.parentElement as Element;
                                  }

                                  // Check if we're in a list item
                                  currentElement = element as Element;
                                  while (
                                    currentElement &&
                                    currentElement !== document.body
                                  ) {
                                    if (currentElement.tagName === "LI") {
                                      // Check if this is the last list item and it's empty
                                      const listElement =
                                        currentElement.parentElement;
                                      const isLastItem =
                                        listElement &&
                                        currentElement ===
                                          listElement.lastElementChild;
                                      const isEmpty =
                                        currentElement.textContent?.trim() ===
                                        "";

                                      // Only exit list if it's the last item AND it's empty
                                      // This allows normal Enter behavior for creating new list items
                                      if (isLastItem && isEmpty) {
                                        // Exit list by removing empty item and creating paragraph after the list
                                        e.preventDefault();

                                        // Remove the empty list item
                                        listElement.removeChild(currentElement);

                                        // Create normal paragraph after the list
                                        const div =
                                          document.createElement("div");
                                        div.innerHTML = "&nbsp;";
                                        listElement.parentNode?.insertBefore(
                                          div,
                                          listElement.nextSibling
                                        );

                                        // Position cursor in new paragraph
                                        const newRange = document.createRange();
                                        newRange.setStart(div, 0);
                                        newRange.collapse(true);
                                        selection.removeAllRanges();
                                        selection.addRange(newRange);
                                        return;
                                      }
                                      // For all other cases, let the default Enter behavior work
                                      // (creates new list item)
                                      break;
                                    }
                                    currentElement =
                                      currentElement.parentElement as Element;
                                  }
                                }
                              }
                            }
                          }}
                          onFocus={checkFormattingState}
                          onBlur={() => {
                            // Reset formatting state when editor loses focus
                            setFormattingState({
                              bold: false,
                              italic: false,
                              underline: false,
                              unorderedList: false,
                              orderedList: false,
                              h1: false,
                              h2: false,
                              h3: false,
                              normal: false,
                            });
                          }}
                          className="w-full min-h-[400px] p-4 focus:outline-none text-gray-900 leading-relaxed prose prose-sm max-w-none"
                          style={{
                            fontFamily: "inherit",
                            lineHeight: "1.6",
                          }}
                          key={activeS.id}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  // Empty state - no section selected or no sections exist
                  <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-(--radius) shadow-[6px_6px_0_rgba(29,41,57,0.12)] p-6 md:p-8 lg:p-10">
                    {project?.sections && project.sections.length > 0 ? (
                      // Has sections but none selected
                      <div className="text-center space-y-4">
                        <div className="w-16 h-16 mx-auto border-2 border-[hsl(var(--border-strong))] rounded-(--radius) flex items-center justify-center bg-[hsl(var(--surface-muted))]">
                          <FileText className="h-8 w-8 text-[hsl(var(--muted-foreground))]" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold uppercase tracking-[0.12em]">
                            Select a Section
                          </h3>
                          <p className="text-sm uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
                            Choose a section from the sidebar to start writing
                          </p>
                        </div>
                      </div>
                    ) : (
                      // No sections exist - show guidance
                      <div className="text-center space-y-6">
                        <div className="w-16 h-16 mx-auto border-2 border-[hsl(var(--border-strong))] rounded-(--radius) flex items-center justify-center bg-[hsl(var(--surface-muted))]">
                          <FileText className="h-8 w-8 text-[hsl(var(--muted-foreground))]" />
                        </div>
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold uppercase tracking-[0.12em]">
                            No Sections Yet
                          </h3>
                          <p className="text-sm uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))] max-w-md mx-auto">
                            Get started by adding sections to organize your
                            research
                          </p>
                        </div>
                        {/* Mobile-specific guidance */}
                        <div className="md:hidden border-[3px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-muted))] rounded-(--radius) p-4 space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) flex items-center justify-center flex-shrink-0 bg-[hsl(var(--secondary))]">
                              <Bot className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-semibold uppercase tracking-[0.12em] mb-1">
                                Access Sections & Tools
                              </h4>
                              <p className="text-[10px] uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))] leading-relaxed">
                                Tap the{" "}
                                <span className="font-semibold text-[hsl(var(--foreground))]">
                                  Tools
                                </span>{" "}
                                button in the bottom-right corner to add
                                sections, use AI assistant, and access research
                                tools.
                              </p>
                            </div>
                          </div>
                          {/* Visual arrow pointing to button */}
                          <div className="flex justify-end pr-4">
                            <div className="text-[hsl(var(--muted-foreground))] animate-bounce">
                              <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M7 17L17 7M17 7H7M17 7V17" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        {/* Desktop guidance */}
                        <div className="hidden md:block">
                          <p className="text-xs uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
                            Use the sections panel on the left to add and manage
                            sections
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Writing Progress */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Writing Progress
                  </h3>

                  {/* Progress Bar with Visual Enhancement */}
                  <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-slate-500 h-3 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            100,
                            (localWordCount / (project.targetWordCount || 1)) *
                              100
                          )}%`,
                        }}
                      ></div>
                    </div>

                    {/* Progress Stats */}
                    <div className="flex justify-between text-sm text-gray-600 mb-3">
                      <span className="font-medium">
                        {localWordCount.toLocaleString()} {t("words")}
                      </span>
                      <span className="text-gray-500">
                        {project.targetWordCount?.toLocaleString() || 0} {t("target")}
                      </span>
                    </div>

                    {/* Progress Percentage and Next Milestone */}
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-gray-900">
                        {Math.round(
                          (localWordCount / (project.targetWordCount || 1)) *
                            100
                        )}
                        %
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">
                          {t("nextMilestone")}
                        </div>
                        <div className="text-sm font-medium text-blue-600">
                          {Math.ceil(
                            ((localWordCount / (project.targetWordCount || 1)) *
                              100) /
                              25
                          ) * 25}
                          %
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Smart Encouragement Message */}
                  <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] rounded-(--radius) p-4 text-center">
                    <p className="text-xs uppercase tracking-[0.2em] font-semibold">
                      {getEncouragementMessage(
                        Math.round(
                          (localWordCount / (project.targetWordCount || 1)) *
                            100
                        )
                      )}
                    </p>
                  </div>
                </div>

                {/* Summary Statistics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
                  <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-(--radius) p-4 sm:p-6 text-center">
                    <h4 className="text-2xl font-bold uppercase tracking-[0.12em]">
                      {project.sections?.length || 0}
                    </h4>
                    <p className="text-[10px] uppercase tracking-[0.28em] text-[hsl(var(--muted-foreground))]">
                      {t("sections")}
                    </p>
                  </div>
                  <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-(--radius) p-4 sm:p-6 text-center">
                    <h4 className="text-2xl font-bold uppercase tracking-[0.12em]">
                      {project.citations?.length || 0}
                    </h4>
                    <p className="text-[10px] uppercase tracking-[0.28em] text-[hsl(var(--muted-foreground))]">
                      {t("totalCitations")}
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
                      {lastDetectionResult
                        ? `${lastDetectionResult.detectedCount} auto-detected`
                        : "0 auto-detected"}
                    </p>
                  </div>
                  <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-(--radius) p-4 sm:p-6 text-center">
                    <h4 className="text-2xl font-bold uppercase tracking-[0.12em]">
                      {Math.round(
                        (localWordCount / (project.targetWordCount || 1)) * 100
                      )}
                      %
                    </h4>
                    <p className="text-[10px] uppercase tracking-[0.28em] text-[hsl(var(--muted-foreground))]">
                      Complete
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
                      Word count target
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Assistant Side Panel */}
        {isAIDrawerOpen && (
          <div className="fixed top-0 right-0 w-80 h-full bg-[hsl(var(--surface))] border-l-[4px] border-[hsl(var(--border-strong))] z-40 flex flex-col shadow-[-6px_0_0_rgba(29,41,57,0.12)]">
            {/* Header */}
            <div className="border-b-[3px] border-[hsl(var(--border-strong))] bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 border-2 border-[hsl(var(--secondary-foreground))] rounded-(--radius) flex items-center justify-center">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.24em]">
                      Akọ̀wé Assistant
                    </h3>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--secondary-foreground))]">
                      Your AI writing companion
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAiMessages([])}
                    className="text-[10px] uppercase tracking-[0.24em] px-3 py-1 border-2 border-[hsl(var(--secondary-foreground))] rounded-(--radius) hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform duration-150"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setIsAIDrawerOpen(false)}
                    className="p-1 border-2 border-[hsl(var(--secondary-foreground))] rounded-(--radius) hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform duration-150"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Desktop Experience Note - AI Assistant Panel (Mobile Only) */}
            {isMobile && showDesktopNoteAI && (
              <div className="md:hidden border-b-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[10px] uppercase tracking-[0.18em] leading-relaxed flex-1">
                    💡 For the best experience, use Akọ̀wé on desktop
                  </p>
                  <button
                    onClick={() => {
                      setShowDesktopNoteAI(false);
                      localStorage.setItem(
                        "akowe-desktop-note-ai-dismissed",
                        "true"
                      );
                    }}
                    className="flex-shrink-0 p-1 hover:bg-[hsl(var(--accent-foreground))]/10 rounded-(--radius) transition-colors"
                    aria-label="Dismiss"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[hsl(var(--surface-muted))]">
              {/* Welcome Message */}
              {aiMessages.length === 0 && (
                <div className="space-y-4">
                  <div className="border-[3px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-(--radius) p-4 shadow-[4px_4px_0_rgba(29,41,57,0.12)]">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--foreground))] leading-relaxed">
                          Hi! I&apos;m Akowe, your AI writing assistant. I can
                          help you with:
                        </p>
                        <ul className="text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] mt-2 space-y-1">
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
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--foreground))] px-1">
                      Quick suggestions:
                    </p>
                    <div className="grid gap-2">
                      <button
                        onClick={() =>
                          setAiInput(
                            "Help me improve the structure of this section"
                          )
                        }
                        className="text-left px-3 py-2 border-2 border-[hsl(var(--border))] rounded-(--radius) hover:border-[hsl(var(--border-strong))] hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform duration-150 text-xs uppercase tracking-[0.18em]"
                      >
                        <span className="font-semibold text-[hsl(var(--foreground))]">
                          📝
                        </span>{" "}
                        Improve section structure
                      </button>
                      <button
                        onClick={() =>
                          setAiInput(
                            "Suggest better wording for this paragraph"
                          )
                        }
                        className="text-left px-3 py-2 border-2 border-[hsl(var(--border))] rounded-(--radius) hover:border-[hsl(var(--border-strong))] hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform duration-150 text-xs uppercase tracking-[0.18em]"
                      >
                        <span className="font-semibold text-[hsl(var(--foreground))]">
                          ✨
                        </span>{" "}
                        Enhance wording
                      </button>
                      <button
                        onClick={() =>
                          setAiInput("Generate a conclusion for this section")
                        }
                        className="text-left px-3 py-2 border-2 border-[hsl(var(--border))] rounded-(--radius) hover:border-[hsl(var(--border-strong))] hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform duration-150 text-xs uppercase tracking-[0.18em]"
                      >
                        <span className="font-semibold text-[hsl(var(--foreground))]">
                          🎯
                        </span>{" "}
                        Generate conclusion
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
                      className={cn(
                        "flex",
                        message.type === "user"
                          ? "justify-end"
                          : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%]",
                          message.type === "user" ? "order-2" : "order-1"
                        )}
                      >
                        {message.type === "assistant" && (
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-6 h-6 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) flex items-center justify-center">
                              <Bot className="h-3 w-3" />
                            </div>
                            <span className="text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))] font-semibold">
                              Akọ̀wé
                            </span>
                          </div>
                        )}
                        <div
                          className={cn(
                            "p-3 rounded-(--radius) border-2",
                            message.type === "user"
                              ? "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] border-[hsl(var(--border-strong))]"
                              : "bg-[hsl(var(--surface))] text-[hsl(var(--foreground))] border-[hsl(var(--border-strong))] shadow-[4px_4px_0_rgba(29,41,57,0.12)] rounded-bl-[1.75rem]"
                          )}
                        >
                          {message.type === "user" ? (
                            <p className="text-xs uppercase tracking-[0.2em] leading-relaxed whitespace-pre-wrap">
                              {message.content}
                            </p>
                          ) : (
                            <div
                              className="text-xs leading-relaxed prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{
                                __html: parseMarkdown(message.content),
                              }}
                            />
                          )}
                          {message.type === "assistant" && (
                            <button
                              onClick={() => {
                                if (activeS) {
                                  const isIntegratedResponse = (message as any)
                                    .isIntegrated;
                                  console.log("Insert into section:", {
                                    isIntegrated: isIntegratedResponse,
                                    currentContent: cleanupSectionContent(
                                      activeS.content || ""
                                    ),
                                    messageContent: message.content,
                                  });

                                  let newContent;
                                  if (isIntegratedResponse) {
                                    newContent = processAIResponse(
                                      message.content,
                                      activeS.title
                                    );
                                  } else {
                                    const currentContent =
                                      cleanupSectionContent(
                                        activeS.content || ""
                                      );
                                    const isTemplateContent =
                                      currentContent.includes("Begin your") ||
                                      currentContent.includes(
                                        "Comprehensive review"
                                      ) ||
                                      currentContent.includes(
                                        "Organization Strategies"
                                      ) ||
                                      currentContent.includes("Writing Tips") ||
                                      currentContent.includes(
                                        "This section demonstrates"
                                      ) ||
                                      currentContent.includes(
                                        "What to Include"
                                      ) ||
                                      currentContent.includes(
                                        "Getting Started"
                                      ) ||
                                      currentContent.includes(
                                        "Start writing below"
                                      ) ||
                                      currentContent.includes("Detail your") ||
                                      currentContent.includes(
                                        "This is where you'll wrap up"
                                      );

                                    if (isTemplateContent) {
                                      newContent = processAIResponse(
                                        message.content,
                                        activeS.title
                                      );
                                    } else {
                                      const separator = currentContent.trim()
                                        ? "\n\n"
                                        : "";
                                      const processedContent =
                                        processAIResponse(
                                          message.content,
                                          activeS.title
                                        );
                                      newContent =
                                        currentContent +
                                        separator +
                                        processedContent;
                                    }
                                  }

                                  handleSectionChange(activeS.id, newContent);
                                  setLocalSectionContent(newContent);
                                  setRealTimeWordCount(
                                    countWords(
                                      cleanupSectionContent(newContent)
                                    )
                                  );
                                  updateEditorContent(newContent);

                                  const successMessage = isIntegratedResponse
                                    ? "✅ AI response intelligently integrated into section!"
                                    : "✅ AI response added to section!";
                                  setShowSuccessMessage(successMessage);
                                  setTimeout(
                                    () => setShowSuccessMessage(""),
                                    3000
                                  );
                                }
                              }}
                              className="mt-2 text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))] font-semibold flex items-center gap-1"
                            >
                              <Plus className="h-3 w-3" />
                              Insert into section
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mt-1 px-1">
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {aiIsLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[85%]">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) flex items-center justify-center">
                        <Bot className="h-3 w-3" />
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))] font-semibold">
                        Akọ̀wé
                      </span>
                    </div>
                    <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-(--radius) rounded-bl-[1.75rem] p-3 shadow-[4px_4px_0_rgba(29,41,57,0.12)]">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-[hsl(var(--secondary))] rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-[hsl(var(--secondary))] rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-[hsl(var(--secondary))] rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                          Thinking...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t-[3px] border-[hsl(var(--border-strong))] p-4 space-y-3 bg-[hsl(var(--surface))]">
              {(session?.user as any)?.plan === "free" && (
                <div className="p-3 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] rounded-(--radius) text-[10px] uppercase tracking-[0.2em] flex items-center justify-between">
                  <span>{t("freePlanLimit")}</span>
                  <button
                    onClick={() => router.push("/settings")}
                    className="underline underline-offset-4"
                  >
                    {t("upgrade")}
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" &&
                      !e.shiftKey &&
                      handleAIWrite(activeS?.id || "")
                    }
                    placeholder={t("askAboutSection", { title: activeS?.title || "Introduction" })}
                    className="w-full px-4 py-3 pr-12 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) focus-visible:outline-2 focus-visible:outline-[hsl(var(--ring))] focus-visible:outline-offset-2 text-xs uppercase tracking-[0.2em]"
                  />
                  <button
                    onClick={() => handleAIWrite(activeS?.id || "")}
                    disabled={aiIsLoading || !aiInput.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] rounded-(--radius) hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform duration-150 disabled:opacity-60 disabled:translate-x-0 disabled:translate-y-0"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] px-1">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </div>
        )}

        {/* Floating "Find citation" pill shown on editor right-click (Option B: add to browser context menu) */}
        {contextMenuPillVisible && contextMenuPillPosition && (
          <div
            ref={contextMenuPillRef}
            className="fixed z-[60] rounded-(--radius) border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] shadow-lg p-1 min-h-[44px] flex items-center"
            style={{
              left: contextMenuPillPosition.x,
              top: contextMenuPillPosition.y,
            }}
          >
            <button
              type="button"
              onClick={() => {
                setContextMenuPillVisible(false);
                discoverCitations(0, false);
              }}
              className="min-h-[44px] min-w-[44px] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] hover:bg-[hsl(var(--surface-muted))] rounded-(--radius) transition-colors touch-manipulation"
            >
              {CONTEXT_MENU_FIND_CITATION_LABEL}
            </button>
            {contextMenuHasSelection && (
              <>
                <div className="w-px h-6 bg-[hsl(var(--border-strong))]" />
                <button
                  type="button"
                  onClick={() => openRewritePanel(true)}
                  className="min-h-[44px] min-w-[44px] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] hover:bg-[hsl(var(--surface-muted))] rounded-(--radius) transition-colors touch-manipulation flex items-center"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  {t("rewrite")}
                </button>
              </>
            )}
          </div>
        )}

        {/* Rewrite highlight overlay (outside editor DOM - never persisted in content) */}
        {rewriteHighlightRects.length > 0 && rewriteHighlightType && (
          <>
            {rewriteHighlightRects.map((rect, i) => (
              <div
                key={i}
                className={`fixed pointer-events-none z-[55] rounded-sm ${
                  rewriteHighlightType === 'loading'
                    ? 'rewrite-loading-highlight'
                    : 'rewrite-just-applied'
                }`}
                style={{
                  top: rect.top,
                  left: rect.left,
                  width: rect.width,
                  height: rect.height,
                }}
              />
            ))}
          </>
        )}

        {/* Floating selection bar - appears when text is selected */}
        {selectionBarVisible && selectionBarPosition && !rewritePanelVisible && !contextMenuPillVisible && (
          <div
            ref={selectionBarRef}
            className="fixed z-[60] rounded-(--radius) border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] shadow-lg p-1 min-h-[40px] flex items-center animate-in fade-in duration-150"
            style={{
              left: selectionBarPosition.x,
              top: selectionBarPosition.y,
            }}
          >
            <button
              type="button"
              onClick={() => openRewritePanel(false)}
              className="min-h-[36px] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] hover:bg-[hsl(var(--surface-muted))] rounded-(--radius) transition-colors touch-manipulation flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
              {t("rewrite")}
            </button>
            {rewriteTooltipVisible && (
              <div
                className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-2 rounded-(--radius) bg-[hsl(var(--foreground))] text-[hsl(var(--background))] text-xs font-medium whitespace-nowrap shadow-lg animate-in fade-in slide-in-from-top-1 duration-200"
                onClick={() => setRewriteTooltipVisible(false)}
              >
                {t("rewriteTooltipNew")}
                <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-[hsl(var(--foreground))] rotate-45" />
              </div>
            )}
          </div>
        )}

        {/* Rewrite Panel */}
        {rewritePanelVisible && rewritePanelPosition && (
          <div
            ref={rewritePanelRef}
            className="fixed z-[60] rounded-(--radius) border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] shadow-lg p-3 w-[320px]"
            style={{
              left: rewritePanelPosition.x,
              top: rewritePanelPosition.y,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-[hsl(var(--primary))]" />
                {t("rewriteWithAI")}
              </div>
              <button
                type="button"
                onClick={closeRewritePanel}
                className="p-1 rounded-(--radius) hover:bg-[hsl(var(--surface-muted))] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Mode Selection */}
            {rewriteStatus === 'mode_select' && (
              <div className="grid grid-cols-2 gap-2">
                {[
                  { mode: 'academic', label: t("rewriteModeAcademic"), desc: t("rewriteModeAcademicDesc") },
                  { mode: 'concise', label: t("rewriteModeConcise"), desc: t("rewriteModeConciseDesc") },
                  { mode: 'expanded', label: t("rewriteModeExpanded"), desc: t("rewriteModeExpandedDesc") },
                  { mode: 'simplified', label: t("rewriteModeSimplified"), desc: t("rewriteModeSimplifiedDesc") },
                ].map((item) => (
                  <button
                    key={item.mode}
                    type="button"
                    onClick={() => handleRewriteModeSelect(item.mode)}
                    className="p-3 rounded-(--radius) border-2 border-[hsl(var(--border-strong))] hover:border-[hsl(var(--primary))] hover:bg-[hsl(var(--surface-muted))] transition-colors text-left"
                  >
                    <div className="text-sm font-semibold">{item.label}</div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            )}

            {/* Loading */}
            {rewriteStatus === 'loading' && (
              <div className="flex items-center justify-center gap-2 py-6">
                <Loader2 className="h-5 w-5 animate-spin text-[hsl(var(--primary))]" />
                <span className="text-sm text-[hsl(var(--muted-foreground))]">{t("rewriteLoading")}</span>
              </div>
            )}

            {/* Preview */}
            {rewriteStatus === 'preview' && (
              <div>
                <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-1.5">{t("rewritePreviewTitle")}</p>
                <div className="max-h-[200px] overflow-y-auto rounded-(--radius) border-2 border-[hsl(var(--border-strong))] p-2 text-sm mb-3">
                  {rewriteResult}
                </div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {rewriteOriginalWordCount} &rarr; {rewriteNewWordCount} {t("words")}
                  </p>
                  {rewriteRemaining !== null && rewriteLimit !== null && (
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {rewriteRemaining}/{rewriteLimit} {t("rewriteRemaining")}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={acceptRewrite}
                    className="flex-1 px-3 py-2 rounded-(--radius) bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    {t("rewriteAccept")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRewriteStatus('mode_select')}
                    className="px-3 py-2 rounded-(--radius) border-2 border-[hsl(var(--border-strong))] text-sm font-semibold hover:bg-[hsl(var(--surface-muted))] transition-colors"
                  >
                    {t("rewriteTryAgain")}
                  </button>
                </div>
              </div>
            )}

            {/* Error / Upsell */}
            {rewriteStatus === 'error' && (
              <div>
                {rewriteLimitReached ? (
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-full bg-[hsl(var(--accent))] flex items-center justify-center mx-auto mb-3">
                      <Sparkles className="h-5 w-5 text-[hsl(var(--primary))]" />
                    </div>
                    <p className="text-sm font-semibold mb-1">{t("rewriteUpgradeTitle")}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mb-4">{t("rewriteUpgradeBody")}</p>
                    <NavLink
                      href="/settings"
                      className="block w-full px-3 py-2.5 rounded-(--radius) bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-semibold hover:opacity-90 transition-opacity text-center"
                    >
                      {t("rewriteUpgradeCta")}
                    </NavLink>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-red-600 mb-3">{rewriteError || t("rewriteError")}</p>
                    <button
                      type="button"
                      onClick={() => setRewriteStatus('mode_select')}
                      className="px-3 py-2 rounded-(--radius) border-2 border-[hsl(var(--border-strong))] text-sm font-semibold hover:bg-[hsl(var(--surface-muted))] transition-colors w-full"
                    >
                      {t("rewriteTryAgain")}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Citation Discovery Modal */}
        {showCitationDiscovery && (
          <div
            className="fixed inset-0 bg-[hsl(var(--foreground))]/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            aria-hidden="false"
            onClick={(e) => {
              if (e.target === e.currentTarget) closeCitationDiscoveryModal();
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="citation-dialog-title"
              aria-describedby="citation-dialog-description"
              className="w-full max-w-6xl h-[95dvh] sm:h-auto sm:max-h-[90vh] overflow-hidden border-0 sm:border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-t-2xl sm:rounded-(--radius) shadow-[0_-8px_30px_rgba(0,0,0,0.12)] sm:shadow-[12px_12px_0_rgba(29,41,57,0.2)] flex flex-col"
            >
              {/* Header */}
              <div className="border-b-[3px] border-[hsl(var(--border-strong))] p-4 sm:p-6 bg-[hsl(var(--surface))] shrink-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3
                      id="citation-dialog-title"
                      className="text-lg sm:text-xl font-semibold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[hsl(var(--foreground))]"
                    >
                      {t("researchCitations")}
                    </h3>
                    <p
                      id="citation-dialog-description"
                      className="text-xs sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[hsl(var(--muted-foreground))] mt-1.5 sm:mt-2 break-words"
                    >
                      {citationTotalResults != null
                        ? t("showingResults", {
                            count: discoveredCitations.length,
                            total: citationTotalResults.toLocaleString(),
                          })
                        : t("foundCitations", {
                            count: discoveredCitations.length,
                          })}
                      {lastDiscoverySearchTerm && (
                        <span className="block mt-1">
                          {t("forTerm", { term: lastDiscoverySearchTerm })}
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeCitationDiscoveryModal}
                    aria-label={t("closeCitationDiscovery")}
                    className="shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center p-2 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform duration-150 cursor-pointer touch-manipulation"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Search and Filter Bar */}
              <div className="p-4 sm:p-6 border-b-[3px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-muted))] shrink-0">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Search Input + Search for new citations */}
                  <div className="flex-1 flex flex-col gap-3 w-full">
                    <div className="relative flex-1 w-full">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                      <input
                        type="text"
                        value={citationSearchQuery}
                        onChange={(e) => setCitationSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && citationSearchQuery.trim()) {
                            e.preventDefault();
                            searchForNewCitations();
                          }
                        }}
                        placeholder={t("filterOrSearch")}
                        className="w-full min-h-[44px] pl-9 pr-4 py-3 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--surface))] text-sm sm:text-xs uppercase tracking-[0.12em] sm:tracking-[0.18em] focus-visible:outline-2 focus-visible:outline-[hsl(var(--ring))] focus-visible:outline-offset-2 touch-manipulation"
                        aria-label={t("filterAriaLabel")}
                      />
                    </div>
                    <div
                      className="relative w-full min-w-0"
                      onMouseEnter={() => {
                        const disabled =
                          isDiscoveringCitations || !citationSearchQuery.trim();
                        if (disabled && searchNewCitationTooltipRef.current) {
                          const el = searchNewCitationTooltipRef.current;
                          el.style.display = "block";
                          el.setAttribute("aria-hidden", "false");
                        }
                      }}
                      onMouseLeave={() => {
                        if (searchNewCitationTooltipRef.current) {
                          const el = searchNewCitationTooltipRef.current;
                          el.style.display = "none";
                          el.setAttribute("aria-hidden", "true");
                        }
                      }}
                    >
                      <button
                        type="button"
                        onClick={searchForNewCitations}
                        disabled={
                          isDiscoveringCitations || !citationSearchQuery.trim()
                        }
                        aria-describedby={
                          !citationSearchQuery.trim() && !isDiscoveringCitations
                            ? "search-new-citation-tooltip"
                            : undefined
                        }
                        className="w-full min-w-[44px] shrink-0 min-h-[44px] px-4 py-3 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--surface))] text-xs font-semibold uppercase tracking-[0.18em] hover:border-[hsl(var(--ring))] focus-visible:outline-2 focus-visible:outline-[hsl(var(--ring))] focus-visible:outline-offset-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer touch-manipulation"
                      >
                        {isDiscoveringCitations
                          ? "Searching…"
                          : "Search for new citations"}
                      </button>
                      <div
                        id="search-new-citation-tooltip"
                        ref={searchNewCitationTooltipRef}
                        role="tooltip"
                        className="absolute z-50 bottom-full left-0 sm:left-1/2 sm:-translate-x-1/2 mb-2 w-56 p-3 bg-[hsl(var(--popover))] border-2 border-[hsl(var(--border-strong))] rounded-(--radius) text-xs text-left shadow-lg pointer-events-none"
                        style={{ display: "none" }}
                        aria-hidden="true"
                      >
                        {SEARCH_TOPIC_REQUIRED_TOOLTIP}
                      </div>
                    </div>
                  </div>

                  {/* Filter Dropdown */}
                  <div className="flex gap-2 sm:gap-3 flex-wrap">
                    <select
                      value={citationFilter}
                      onChange={(e) => setCitationFilter(e.target.value as any)}
                      className="flex-1 min-w-0 min-h-[44px] px-3 sm:px-4 py-3 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--surface))] text-[10px] sm:text-xs uppercase tracking-[0.08em] sm:tracking-[0.18em] focus-visible:outline-2 focus-visible:outline-[hsl(var(--ring))] focus-visible:outline-offset-2 touch-manipulation"
                    >
                      <option value="all">{t("allCitations")}</option>
                      <option value="recent">{t("recent")}</option>
                      <option value="highly_cited">{t("highlyCited")}</option>
                    </select>

                    <select
                      value={citationSortBy}
                      onChange={(e) => setCitationSortBy(e.target.value as any)}
                      className="flex-1 min-w-0 min-h-[44px] px-3 sm:px-4 py-3 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--surface))] text-[10px] sm:text-xs uppercase tracking-[0.08em] sm:tracking-[0.18em] focus-visible:outline-2 focus-visible:outline-[hsl(var(--ring))] focus-visible:outline-offset-2 touch-manipulation"
                    >
                      <option value="relevance">{t("sortByRelevance")}</option>
                      <option value="year">{t("sortByYear")}</option>
                      <option value="title">{t("sortByTitle")}</option>
                    </select>
                  </div>
                </div>

                {/* Results Summary */}
                <div className="mt-3 sm:mt-4 flex items-center justify-between flex-wrap gap-2 text-xs sm:text-[10px] uppercase tracking-[0.12em] sm:tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                  <span>
                    Showing {getFilteredAndSortedCitations().length} citations
                    {lastDiscoverySearchTerm && (
                      <span className="text-[hsl(var(--muted-foreground))]/80">
                        {" "}
                        • Results for &quot;{lastDiscoverySearchTerm}&quot;
                      </span>
                    )}
                    {!citationSearchQuery &&
                      citationFilter === "all" &&
                      citationSortBy === "relevance" && (
                        <span className="text-[hsl(var(--muted-foreground))]/80">
                          {" "}
                          • Loaded {discoveredCitations.length}
                          {citationTotalResults != null
                            ? ` of ${citationTotalResults.toLocaleString()}`
                            : ""}{" "}
                          total
                        </span>
                      )}
                  </span>
                  {citationSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setCitationSearchQuery("")}
                      className="min-h-[44px] min-w-[44px] flex items-center text-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))] font-semibold cursor-pointer touch-manipulation"
                    >
                      Clear filter
                    </button>
                  )}
                </div>
              </div>

              {/* Citations List */}
              <div className="flex-1 min-h-0 p-4 sm:p-6 overflow-y-auto overflow-x-hidden space-y-4 sm:space-y-6 bg-[hsl(var(--surface))]">
                {discoveredCitations.length === 0 &&
                citationDiscoveryError &&
                !isDiscoveringCitations ? (
                  <div className="text-center py-8 sm:py-12">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 border-2 border-[hsl(var(--destructive))] rounded-(--radius) flex items-center justify-center mx-auto mb-4 bg-[hsl(var(--destructive))]/10">
                      <AlertCircle className="h-7 w-7 sm:h-8 sm:w-8 text-[hsl(var(--destructive))]" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold uppercase tracking-[0.15em] sm:tracking-[0.18em] text-[hsl(var(--foreground))] mb-2">
                      Search failed
                    </h3>
                    <p className="text-xs sm:text-[10px] uppercase tracking-[0.12em] sm:tracking-[0.18em] text-[hsl(var(--muted-foreground))] mb-6 max-w-md mx-auto px-2">
                      {citationDiscoveryError}
                    </p>
                    <button
                      type="button"
                      onClick={retryCitationDiscovery}
                      disabled={isDiscoveringCitations}
                      className="min-h-[44px] px-6 py-3 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) text-xs font-semibold uppercase tracking-[0.18em] bg-[hsl(var(--surface))] hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform duration-150 disabled:opacity-60 disabled:translate-x-0 disabled:translate-y-0 flex items-center justify-center gap-2 mx-auto cursor-pointer touch-manipulation"
                    >
                      {isDiscoveringCitations ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-[hsl(var(--border-strong))] border-t-transparent"></div>
                          Retrying...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4" />
                          Retry search
                        </>
                      )}
                    </button>
                  </div>
                ) : discoveredCitations.length === 0 &&
                  isDiscoveringCitations ? (
                  <div className="text-center py-8 sm:py-12">
                    <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-2 border-[hsl(var(--border-strong))] border-t-transparent mx-auto mb-4"></div>
                    <h3 className="text-base sm:text-lg font-semibold uppercase tracking-[0.15em] sm:tracking-[0.18em] text-[hsl(var(--foreground))] mb-2">
                      Searching for citations
                    </h3>
                    <p className="text-xs sm:text-[10px] uppercase tracking-[0.12em] sm:tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                      This may take a moment…
                    </p>
                  </div>
                ) : getFilteredAndSortedCitations().length > 0 ? (
                  <div className="grid gap-4 sm:gap-6">
                    {getFilteredAndSortedCitations().map((citation, index) => (
                      <div
                        key={index}
                        className="border-2 sm:border-[3px] border-[hsl(var(--border-strong))] rounded-(--radius) p-4 sm:p-6 bg-[hsl(var(--surface))] hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform duration-150 shadow-[4px_4px_0_rgba(29,41,57,0.1)] sm:shadow-[6px_6px_0_rgba(29,41,57,0.12)]"
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3 sm:mb-4">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-base sm:text-lg font-semibold uppercase tracking-[0.1em] sm:tracking-[0.12em] text-[hsl(var(--foreground))] mb-2 leading-tight line-clamp-3">
                              {citation.title}
                            </h4>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-[10px] uppercase tracking-[0.12em] sm:tracking-[0.18em] text-[hsl(var(--muted-foreground))] mb-3">
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-[hsl(var(--foreground))]">
                                  Authors:
                                </span>
                                <span>
                                  {Array.isArray(citation.authors)
                                    ? citation.authors.slice(0, 3).join(", ") +
                                      (citation.authors.length > 3
                                        ? " et al."
                                        : "")
                                    : citation.authors || "Unknown Author"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-[hsl(var(--foreground))]">
                                  Year:
                                </span>
                                <span
                                  className="px-2 py-1 border-2 border-[hsl(var(--border-strong))] rounded-(--radius)"
                                  title={
                                    citation.year == null
                                      ? "Publication date not in metadata"
                                      : undefined
                                  }
                                >
                                  {formatYearForDisplay(citation.year)}
                                </span>
                              </div>
                              {citation.citationCount && (
                                <div className="flex items-center gap-1">
                                  <span className="font-semibold text-[hsl(var(--foreground))]">
                                    Citations:
                                  </span>
                                  <span className="px-2 py-1 border-2 border-[hsl(var(--border-strong))] rounded-(--radius)">
                                    {citation.citationCount}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 sm:ml-4 shrink-0">
                            {citation.url && (
                              <a
                                href={citation.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 border-2 border-[hsl(var(--border))] rounded-(--radius) hover:border-[hsl(var(--border-strong))] transition-transform duration-150 hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] touch-manipulation"
                                title={t("viewSource")}
                              >
                                <Link className="h-4 w-4" />
                              </a>
                            )}
                            <button
                              onClick={() => addCitationToEditor(citation)}
                              disabled={isAddingCitation}
                              className={`min-h-[44px] px-4 py-2 rounded-(--radius) text-xs font-semibold uppercase tracking-[0.18em] transition-transform duration-150 flex items-center justify-center gap-2 touch-manipulation ${
                                isAddingCitation
                                  ? "bg-[hsl(var(--muted))] cursor-not-allowed text-[hsl(var(--muted-foreground))]"
                                  : "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] cursor-pointer"
                              }`}
                            >
                              {isAddingCitation ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                  Adding...
                                </>
                              ) : (
                                <>
                                  <Plus className="h-4 w-4" />
                                  Add Citation
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {citation.journal && (
                          <p className="text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] mb-3">
                            <span className="font-semibold text-[hsl(var(--foreground))]">
                              Journal:
                            </span>{" "}
                            {citation.journal}
                          </p>
                        )}

                        {citation.abstract && (
                          <div className="mb-3 sm:mb-4">
                            <p className="text-xs uppercase tracking-[0.1em] sm:tracking-[0.18em] text-[hsl(var(--foreground))] leading-relaxed line-clamp-3">
                              {citation.abstract}
                            </p>
                          </div>
                        )}

                        {citation.doi && (
                          <div className="flex items-center gap-2 text-xs sm:text-[10px] uppercase tracking-[0.1em] sm:tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                            <span className="font-semibold text-[hsl(var(--foreground))] shrink-0 whitespace-nowrap">
                              DOI:
                            </span>
                            <code className="border-2 border-[hsl(var(--border-strong))] rounded-(--radius) px-2 py-1 break-all min-w-0">
                              {citation.doi}
                            </code>
                          </div>
                        )}
                        {citation.source && (
                          <p className="mt-2 text-xs sm:text-[10px] uppercase tracking-[0.1em] sm:tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                            Source: {citation.source}
                          </p>
                        )}
                      </div>
                    ))}

                    {/* Find More / End of list */}
                    {!citationSearchQuery &&
                      citationFilter === "all" &&
                      citationSortBy === "relevance" && (
                        <div className="flex justify-center pt-6">
                          {citationHasMore ? (
                            <button
                              onClick={loadMoreCitations}
                              disabled={isLoadingMoreCitations}
                              className="px-6 py-3 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) text-xs uppercase tracking-[0.18em] bg-[hsl(var(--surface))] hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform duration-150 disabled:opacity-60 disabled:translate-x-0 disabled:translate-y-0 flex items-center gap-2 cursor-pointer"
                            >
                              {isLoadingMoreCitations ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-[hsl(var(--border-strong))] border-t-transparent"></div>
                                  Loading more...
                                </>
                              ) : (
                                <>
                                  <Plus className="h-4 w-4" />
                                  Find more citations
                                </>
                              )}
                            </button>
                          ) : (
                            <p className="text-xs sm:text-[10px] uppercase tracking-[0.12em] sm:tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                              No more results for this search
                            </p>
                          )}
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) flex items-center justify-center mx-auto mb-4">
                      <Search className="h-7 w-7 sm:h-8 sm:w-8 text-[hsl(var(--muted-foreground))]" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold uppercase tracking-[0.15em] sm:tracking-[0.18em] text-[hsl(var(--foreground))] mb-2">
                      No citations found
                    </h3>
                    <p className="text-xs sm:text-[10px] uppercase tracking-[0.12em] sm:tracking-[0.18em] text-[hsl(var(--muted-foreground))] mb-6 px-2">
                      {citationSearchQuery
                        ? `No citations match your search "${citationSearchQuery}"`
                        : "No citations available for the current filters"}
                    </p>
                    {citationSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setCitationSearchQuery("")}
                        className="min-h-[44px] px-4 py-2 text-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))] font-semibold text-xs uppercase tracking-[0.18em] cursor-pointer touch-manipulation"
                      >
                        {t("clearFilter")}
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
          <div className="fixed inset-0 bg-[hsl(var(--foreground))]/60 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
              <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-(--radius) shadow-[12px_12px_0_rgba(29,41,57,0.2)] flex flex-col">
                <div className="p-6 border-b-[3px] border-[hsl(var(--border-strong))] flex items-center justify-between">
                  <h3 className="text-xl font-semibold uppercase tracking-[0.2em]">
                    {t("exportProject")}
                  </h3>
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="p-2 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform duration-150"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] flex items-center gap-2">
                        {t("citationStyle")}
                        {isAutoDetected.citationStyle && (
                          <span className="px-2 py-1 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) text-[8px] uppercase tracking-[0.24em] text-[hsl(var(--foreground))] bg-[hsl(var(--surface-muted))]">
                            {t("auto")}
                          </span>
                        )}
                      </label>
                      <select
                        value={selectedCitationStyle}
                        onChange={(e) => {
                          setSelectedCitationStyle(e.target.value as any);
                          setIsAutoDetected((prev) => ({
                            ...prev,
                            citationStyle: false,
                          }));
                        }}
                        className="w-full px-4 py-3 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--surface))] text-xs uppercase tracking-[0.18em] focus-visible:outline-2 focus-visible:outline-[hsl(var(--ring))] focus-visible:outline-offset-2"
                        disabled={isExporting}
                      >
                        <option value="apa">APA</option>
                        <option value="mla">MLA</option>
                        <option value="chicago">Chicago</option>
                        <option value="harvard">Harvard</option>
                        <option value="ieee">IEEE</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] flex items-center gap-2">
                        {t("academicTemplate")}
                        {isAutoDetected.template && (
                          <span className="px-2 py-1 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) text-[8px] uppercase tracking-[0.24em] text-[hsl(var(--foreground))] bg-[hsl(var(--surface-muted))]">
                            {t("auto")}
                          </span>
                        )}
                      </label>
                      <select
                        value={selectedTemplate}
                        onChange={(e) => {
                          setSelectedTemplate(e.target.value as any);
                          setIsAutoDetected((prev) => ({
                            ...prev,
                            template: false,
                          }));
                        }}
                        className="w-full px-4 py-3 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--surface))] text-xs uppercase tracking-[0.18em] focus-visible:outline-2 focus-visible:outline-[hsl(var(--ring))] focus-visible:outline-offset-2"
                        disabled={isExporting}
                      >
                        <option value="research-paper">{t("researchPaper")}</option>
                        <option value="thesis">{t("thesis")}</option>
                        <option value="report">{t("researchReport")}</option>
                        <option value="conference-paper">
                          {t("conferencePaper")}
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {(
[
                      {
                          key: "pdf",
                          label: t("pdfDocument"),
                          description: t("pdfDescription"),
                          spinner: t("generatingPdf"),
                        },
                        {
                          key: "docx",
                          label: t("wordDocument"),
                          description: t("docxDescription"),
                          spinner: t("generatingDocx"),
                        },
                        {
                          key: "txt",
                          label: t("plainText"),
                          description: t("txtDescription"),
                          spinner: t("generatingTxt"),
                        },
                        {
                          key: "latex",
                          label: t("latexDocument"),
                          description: t("latexDescription"),
                          spinner: t("generatingLatex"),
                        },
                      ] as const
                    ).map((option) => {
                      const isProcessing =
                        isExporting && exportingFormat === option.key;
                      const isActive = selectedExportFormat === option.key;
                      return (
                        <button
                          key={option.key}
                          onClick={() => {
                            if (!isExporting) {
                              setSelectedExportFormat(option.key);
                            }
                          }}
                          disabled={isProcessing}
                          className={cn(
                            "w-full border-2 border-[hsl(var(--border-strong))] rounded-(--radius) px-4 py-4 text-left flex items-start gap-4 transition-transform duration-150 bg-[hsl(var(--surface))]",
                            isProcessing
                              ? "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] cursor-not-allowed"
                              : isActive
                              ? "ring-2 ring-[hsl(var(--secondary))] -translate-x-[0.125rem] -translate-y-[0.125rem] shadow-[6px_6px_0_rgba(29,41,57,0.12)]"
                              : "hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem]"
                          )}
                        >
                          <div className="w-10 h-10 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) flex items-center justify-center flex-shrink-0 bg-[hsl(var(--surface))]">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]">
                              {option.label}
                              {isProcessing && (
                                <div className="w-4 h-4 border-2 border-[hsl(var(--secondary-foreground))] border-t-transparent rounded-full animate-spin"></div>
                              )}
                            </div>
                            <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                              {isProcessing
                                ? option.spinner
                                : option.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-6 border-t-[3px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-muted))] flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowExportModal(false)}
                    disabled={isExporting}
                    className="px-6 py-3 text-xs uppercase tracking-[0.18em]"
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    onClick={() => handleExport(selectedExportFormat)}
                    disabled={isExporting}
                    className="px-6 py-3 text-xs uppercase tracking-[0.18em]"
                  >
                    {isExporting ? t("exporting") : t("export")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {/* Manual Citation Modal */}
        {showManualCitationModal && (
          <div className="fixed inset-0 bg-[hsl(var(--foreground))]/60 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
              <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-(--radius) shadow-[12px_12px_0_rgba(29,41,57,0.2)] flex flex-col">
                <div className="p-6 border-b-[3px] border-[hsl(var(--border-strong))] flex items-center justify-between">
                  <h3 className="text-xl font-semibold uppercase tracking-[0.2em]">
                    {t("addManualCitation")}
                  </h3>
                  <button
                    onClick={() => setShowManualCitationModal(false)}
                    className="p-2 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform duration-150"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      label={t("titleRequired")}
                      value={manualCitation.title}
                      onChange={(e) =>
                        setManualCitation((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder={t("placeholderTitle")}
                      required
                    />
                    <Input
                      label={t("authorsRequired")}
                      value={manualCitation.authors}
                      onChange={(e) =>
                        setManualCitation((prev) => ({
                          ...prev,
                          authors: e.target.value,
                        }))
                      }
                      placeholder={t("placeholderAuthors")}
                      required
                    />
                    <Input
                      label={t("year")}
                      type="number"
                      value={manualCitation.year}
                      onChange={(e) =>
                        setManualCitation((prev) => ({
                          ...prev,
                          year: e.target.value,
                        }))
                      }
                      placeholder={t("placeholderYear")}
                    />
                    <Input
                      label={t("journal")}
                      value={manualCitation.journal}
                      onChange={(e) =>
                        setManualCitation((prev) => ({
                          ...prev,
                          journal: e.target.value,
                        }))
                      }
                      placeholder={t("placeholderJournal")}
                    />
                    <Input
                      label={t("doi")}
                      value={manualCitation.doi}
                      onChange={(e) =>
                        setManualCitation((prev) => ({
                          ...prev,
                          doi: e.target.value,
                        }))
                      }
                      placeholder={t("placeholderDoi")}
                    />
                    <Input
                      label={t("url")}
                      type="url"
                      value={manualCitation.url}
                      onChange={(e) =>
                        setManualCitation((prev) => ({
                          ...prev,
                          url: e.target.value,
                        }))
                      }
                      placeholder={t("placeholderUrl")}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                      {t("abstract")}
                    </label>
                    <textarea
                      value={manualCitation.abstract}
                      onChange={(e) =>
                        setManualCitation((prev) => ({
                          ...prev,
                          abstract: e.target.value,
                        }))
                      }
                      placeholder={t("placeholderNotes")}
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--surface))] text-sm uppercase tracking-[0.12em] text-[hsl(var(--foreground))] focus-visible:outline-2 focus-visible:outline-[hsl(var(--ring))] focus-visible:outline-offset-2 resize-y"
                    />
                  </div>
                </div>
                <div className="p-6 border-t-[3px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-muted))] flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowManualCitationModal(false)}
                    className="px-6 py-3 text-xs uppercase tracking-[0.18em]"
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    onClick={addManualCitation}
                    disabled={
                      !manualCitation.title.trim() ||
                      !manualCitation.authors.trim()
                    }
                    className="px-6 py-3 text-xs uppercase tracking-[0.18em]"
                  >
                    {t("addCitation")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Plagiarism Results Modal */}
        {showPlagiarismModal && plagiarismResult && (
          <div className="fixed inset-0 bg-[hsl(var(--foreground))]/60 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl">
              <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-(--radius) shadow-[12px_12px_0_rgba(29,41,57,0.2)] flex flex-col max-h-[90vh]">
                <div className="p-6 border-b-[3px] border-[hsl(var(--border-strong))] flex items-center justify-between">
                  <h3 className="text-xl font-semibold uppercase tracking-[0.2em]">
                    {t("plagiarismCheckResults")}
                  </h3>
                  <button
                    onClick={() => setShowPlagiarismModal(false)}
                    className="p-2 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform duration-150"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div
                      className={cn(
                        "border-[3px] border-[hsl(var(--border-strong))] rounded-(--radius) p-6 text-center space-y-2",
                        plagiarismResult.matchPercentage < 10
                          ? "bg-[hsl(var(--surface))] text-[hsl(var(--foreground))]"
                          : plagiarismResult.matchPercentage < 25
                          ? "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]"
                          : "bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))]"
                      )}
                    >
                      <span className="text-xs uppercase tracking-[0.24em] font-semibold block">
                        {t("similarityMatch")}
                      </span>
                      <span className="text-4xl font-black uppercase tracking-[0.1em]">
                        {plagiarismResult.matchPercentage}%
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.2em] block">
                        {t("contentOverlapDetected")}
                      </span>
                    </div>

                    <div className="border-[3px] border-[hsl(var(--border-strong))] rounded-(--radius) p-6 text-center space-y-2 bg-[hsl(var(--surface-muted))]">
                      <span className="text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))] font-semibold block">
                        {t("checksRemaining")}
                      </span>
                      <span className="text-4xl font-black uppercase tracking-[0.1em]">
                        {plagiarismResult.remaining}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] block">
                        {t("planAllowance")}
                      </span>
                    </div>

                    <div className="border-[3px] border-[hsl(var(--border-strong))] rounded-(--radius) p-6 space-y-3">
                      <span className="text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))] font-semibold block">
                        Sources Checked
                      </span>
                      <div className="space-y-2 text-[10px] uppercase tracking-[0.18em]">
                        <div className="flex items-center justify-between">
                          <span>Crossref</span>
                          <span className="font-semibold">
                            {plagiarismResult.sources?.crossref ?? 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>arXiv</span>
                          <span className="font-semibold">
                            {plagiarismResult.sources?.arxiv ?? 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section-Level Analysis */}
                  {plagiarismResult.sectionAnalysis &&
                    plagiarismResult.sectionAnalysis.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="text-sm font-semibold uppercase tracking-[0.24em]">
                          Section-by-Section Analysis
                        </h4>
                        <div className="space-y-3">
                          {plagiarismResult.sectionAnalysis.map(
                            (section, index) => (
                              <div
                                key={index}
                                className="border-[3px] border-[hsl(var(--border-strong))] rounded-(--radius) p-4 bg-[hsl(var(--surface-muted))]"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <h5 className="text-xs font-semibold uppercase tracking-[0.18em]">
                                    {section.sectionTitle}
                                  </h5>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={cn(
                                        "px-2 py-1 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) text-[8px] uppercase tracking-[0.24em]",
                                        section.matchPercentage < 10
                                          ? "bg-green-500/20"
                                          : section.matchPercentage < 25
                                          ? "bg-yellow-500/20"
                                          : "bg-red-500/20"
                                      )}
                                    >
                                      {section.matchPercentage}% issues
                                    </span>
                                    <span className="text-[8px] uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
                                      {section.wordCount} words
                                    </span>
                                  </div>
                                </div>
                                {section.matches.length > 0 && (
                                  <div className="space-y-2 mt-3">
                                    {section.matches
                                      .slice(0, 3)
                                      .map((match, matchIndex) => (
                                        <div
                                          key={matchIndex}
                                          className="text-[10px] uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))] pl-2 border-l-2 border-[hsl(var(--border-strong))]"
                                        >
                                          <p className="text-[hsl(var(--foreground))]">
                                            {match.text}
                                          </p>
                                          {match.suggestion && (
                                            <p className="mt-1 text-[hsl(var(--secondary))] italic">
                                              💡 {match.suggestion}
                                            </p>
                                          )}
                                        </div>
                                      ))}
                                  </div>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {/* Overall Issues */}
                  {plagiarismResult.matches.length > 0 ? (
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold uppercase tracking-[0.24em]">
                        Detected Issues & Recommendations
                      </h4>
                      <div className="space-y-3">
                        {plagiarismResult.matches.map((match, index) => (
                          <div
                            key={index}
                            className="border-[3px] border-[hsl(var(--border-strong))] rounded-(--radius) p-4 bg-[hsl(var(--surface))] hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform duration-150"
                          >
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--foreground))] flex-1 leading-relaxed">
                                &quot;{match.text}&quot;
                              </p>
                              {typeof match.similarity === "number" && (
                                <span className="px-2 py-1 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) text-[8px] uppercase tracking-[0.24em] whitespace-nowrap">
                                  {match.similarity}% similar
                                </span>
                              )}
                            </div>
                            {match.suggestion && (
                              <div className="mt-2 p-2 bg-[hsl(var(--accent))]/10 border-l-2 border-[hsl(var(--accent))] rounded">
                                <p className="text-[10px] uppercase tracking-[0.16em] text-[hsl(var(--accent-foreground))]">
                                  💡 {match.suggestion}
                                </p>
                              </div>
                            )}
                            {match.section && (
                              <p className="text-[8px] uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] mt-2">
                                Location: {match.section}
                              </p>
                            )}
                            <div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                              <span>Source: {match.source}</span>
                              {match.url && (
                                <a
                                  href={match.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]"
                                >
                                  View Source →
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="border-[3px] border-[hsl(var(--border-strong))] rounded-(--radius) p-10 text-center bg-[hsl(var(--surface-muted))] space-y-3">
                      <CheckCircle2 className="h-10 w-10 mx-auto text-[hsl(var(--secondary))]" />
                      <p className="text-sm uppercase tracking-[0.24em] text-[hsl(var(--foreground))]">
                        No plagiarism detected. Your content is original.
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-6 border-t-[3px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-muted))] flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowPlagiarismModal(false)}
                    className="px-6 py-3 text-xs uppercase tracking-[0.18em]"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section Delete Confirmation Modal */}
        {sectionToDelete && (
          <div className="fixed inset-0 bg-[hsl(var(--foreground))]/60 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
              <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-(--radius) shadow-[12px_12px_0_rgba(29,41,57,0.2)]">
                <div className="p-6 border-b-[3px] border-[hsl(var(--border-strong))]">
                  <h3 className="text-xl font-semibold uppercase tracking-[0.2em] text-[hsl(var(--destructive))]">
                    {t("deleteSectionTitle")}
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                    {t("deleteSectionConfirm")}
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setSectionToDelete(null)}
                      className="flex-1 px-4 py-3 text-xs uppercase tracking-[0.18em]"
                    >
                      {t("cancel")}
                    </Button>
                    <Button
                      onClick={() => deleteSection(sectionToDelete)}
                      className="flex-1 px-4 py-3 text-xs uppercase tracking-[0.18em]"
                    >
                      {t("delete")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showSuccessMessage && (
          <div className="fixed top-4 right-4 left-4 sm:left-auto z-50 max-w-md">
            <div
              className={`flex items-start gap-3 px-4 py-3 sm:px-6 sm:py-4 border-2 rounded-(--radius) shadow-[6px_6px_0_rgba(29,41,57,0.12)] bg-[hsl(var(--surface))] ${
                showSuccessMessage.includes("❌")
                  ? "border-[hsl(var(--destructive))]"
                  : showSuccessMessage.includes("✅")
                  ? "border-[hsl(var(--secondary))]"
                  : "border-[hsl(var(--border-strong))]"
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {showSuccessMessage.includes("❌") ? (
                  <div className="w-8 h-8 rounded-(--radius) border-2 border-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10 flex items-center justify-center">
                    <span className="text-[hsl(var(--destructive))] text-xs font-bold">
                      !
                    </span>
                  </div>
                ) : showSuccessMessage.includes("✅") ? (
                  <div className="w-8 h-8 rounded-(--radius) border-2 border-[hsl(var(--secondary))] bg-[hsl(var(--secondary))]/10 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-[hsl(var(--secondary-foreground))]" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-(--radius) border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-muted))] flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium uppercase tracking-[0.1em] leading-relaxed text-[hsl(var(--foreground))]">
                  {showSuccessMessage}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSuccessMessage("")}
                aria-label={t("dismiss")}
                className="flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center p-2 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--foreground))]/30 transition-colors cursor-pointer touch-manipulation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Simple Math Modal */}
        {showMathModal && (
          <div className="fixed inset-0 bg-[hsl(var(--foreground))]/60 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-3xl border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-(--radius) shadow-[12px_12px_0_rgba(29,41,57,0.2)] p-8 space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold uppercase tracking-[0.2em]">
                  {t("insertMathEquation")}
                </h3>
                <button
                  onClick={() => {
                    setShowMathModal(false);
                    setMathPreview("");
                    setMathExplanation("");
                  }}
                  className="p-2 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform duration-150"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-6">
                {/* LaTeX Input */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] mb-2">
                    {t("latexEquation")}
                  </label>
                  <input
                    type="text"
                    value={mathPreview}
                    onChange={(e) => setMathPreview(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--surface))] text-sm font-mono text-[hsl(var(--foreground))] focus-visible:outline-2 focus-visible:outline-[hsl(var(--ring))] focus-visible:outline-offset-2"
                    placeholder={t("latexPlaceholder")}
                  />
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                      {t("latexHint")}
                    </p>
                    <a
                      href="/latex-guide"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))] underline"
                    >
                      {t("fullGuide")}
                    </a>
                  </div>
                </div>

                {/* Live Preview */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] mb-2">
                    {t("preview")}
                  </label>
                  <div className="p-6 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--surface-muted))] min-h-[80px] flex items-center justify-center">
                    {mathPreview ? (
                      <div
                        id="math-preview"
                        className="text-2xl text-[hsl(var(--foreground))]"
                      >
                        ${mathPreview}$
                      </div>
                    ) : (
                      <div className="text-sm uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                        {t("equationPreviewPlaceholder")}
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Explanation */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                      {t("aiExplanation")}
                    </label>
                    <button
                      type="button"
                      onClick={() => generateMathExplanation(mathPreview)}
                      disabled={!mathPreview.trim() || isGeneratingExplanation}
                      className="px-3 py-1 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) text-[10px] uppercase tracking-[0.2em] hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform duration-150 disabled:opacity-60 disabled:translate-x-0 disabled:translate-y-0"
                    >
                      {isGeneratingExplanation ? t("generating") : t("generate")}
                    </button>
                  </div>
                  <div className="p-4 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--surface-muted))] max-h-[140px] overflow-y-auto">
                    {mathExplanation ? (
                      <div className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--foreground))] leading-relaxed">
                        {mathExplanation
                          .replace(/\\\(|\\\)/g, "")
                          .replace(/\$+/g, "")}
                        {mathExplanation.includes("Upgrade to Pro") && (
                          <div className="mt-3 pt-3 border-t-[2px] border-[hsl(var(--border-strong))]">
                            <NavLink
                              href="/settings"
                              className="inline-flex items-center text-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))] text-[10px] uppercase tracking-[0.2em]"
                            >
                              {t("upgradeToPro")}
                            </NavLink>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-[10px] uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
                        {t("generateExplanationHint")}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Examples */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] mb-2">
                    {t("quickExamples")}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: t("fraction"), value: "\\frac{a}{b}" },
                      { label: t("power"), value: "x^2 + y^2" },
                      { label: t("squareRoot"), value: "\\sqrt{x^2 + y^2}" },
                      { label: t("sum"), value: "\\sum_{i=1}^n x_i" },
                      { label: t("integral"), value: "\\int_0^\\infty f(x) dx" },
                      { label: t("greek"), value: "\\alpha + \\beta = \\gamma" },
                    ].map((example) => (
                      <button
                        key={example.label}
                        onClick={() => setMathPreview(example.value)}
                        className="p-3 text-left border-2 border-[hsl(var(--border-strong))] rounded-(--radius) hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform duration-150 bg-[hsl(var(--surface))]"
                      >
                        <div className="font-semibold text-xs uppercase tracking-[0.18em]">
                          {example.label}
                        </div>
                        <div className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono mt-1">
                          {example.value}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t-[3px] border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-muted))]">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowMathModal(false);
                    setMathPreview("");
                    setMathExplanation("");
                  }}
                  className="flex-1 py-3 text-xs uppercase tracking-[0.18em]"
                >
                  {t("cancel")}
                </Button>
                <Button
                  onClick={async () => {
                    if (mathPreview.trim()) {
                      const mathBlock = `
                      <div class="math-equation" style="margin: 16px 0; padding: 16px; border: 1px solid #1f2933; border-radius: 6px; background: #f6f5f1; text-align: center;">
                        <div style="font-size: 1.2em; font-family: 'Times New Roman', serif; color: #1f2933;">
                          $${mathPreview}$
                        </div>
                      </div>
                    `;
                      await insertMathIntoEditor(mathBlock, mathPreview);
                    }
                    setShowMathModal(false);
                    setMathPreview("");
                    setMathExplanation("");
                  }}
                  disabled={!mathPreview.trim()}
                  className="flex-1 py-3 text-xs uppercase tracking-[0.18em]"
                >
                  {t("insertEquation")}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Chart Modal */}
        {showChartModal && (
          <div className="fixed inset-0 bg-[hsl(var(--foreground))]/60 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-2xl border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-(--radius) shadow-[12px_12px_0_rgba(29,41,57,0.2)] p-8 space-y-8 text-center">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold uppercase tracking-[0.2em]">
                  {t("insertChart")}
                </h3>
                <button
                  onClick={() => setShowChartModal(false)}
                  className="p-2 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform duration-150"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4 py-6">
                <div className="w-20 h-20 border-4 border-[hsl(var(--border-strong))] rounded-(--radius) flex items-center justify-center mx-auto text-[hsl(var(--muted-foreground))]">
                  <BarChart3 className="h-8 w-8" />
                </div>
                <h4 className="text-lg font-semibold uppercase tracking-[0.18em]">
                  {t("chartFeatureComingSoon")}
                </h4>
                <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] max-w-md mx-auto">
                  {t("chartComingSoonDescription")}
                </p>
              </div>

              <Button
                onClick={() => setShowChartModal(false)}
                className="w-full py-3 text-xs uppercase tracking-[0.18em]"
              >
                {t("gotIt")}
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
