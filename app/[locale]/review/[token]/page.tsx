'use client';

import { useState, useEffect, useLayoutEffect, useRef, use } from 'react';
import {
  MessageSquare,
  Send,
  ChevronRight,
  X,
  AlertCircle,
  MessageSquarePlus,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { TextAnchor, ReviewCommentData } from '@/types';

/**
 * Find which section a DOM node belongs to, given the contentRefs map.
 */
function findSectionForNode(
  node: Node,
  refs: Record<string, HTMLDivElement | null>
): string | null {
  for (const [sectionId, el] of Object.entries(refs)) {
    if (el && el.contains(node)) return sectionId;
  }
  return null;
}

/**
 * Normalize text for matching: collapse all whitespace (including newlines) to single spaces.
 */
function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Build a TextAnchor from a section element and selected text.
 * Uses normalized matching so multi-paragraph selections work.
 */
function buildTextAnchor(
  sectionEl: HTMLElement,
  rawSelectedText: string,
  sectionId: string
): TextAnchor | null {
  const selectedText = rawSelectedText.trim();
  if (selectedText.length < 2) return null;

  const plainText = sectionEl.textContent || '';
  const normalizedPlain = normalizeText(plainText);
  const normalizedSelected = normalizeText(selectedText);

  const normalizedIdx = normalizedPlain.indexOf(normalizedSelected);
  if (normalizedIdx === -1) return null;

  // Map normalized index back to original offsets (approximate)
  // Walk through original text, consuming normalized chars
  let origIdx = 0;
  let normIdx = 0;
  let startOffset = 0;

  // Skip leading whitespace in original to align with normalized
  while (origIdx < plainText.length && normIdx < normalizedIdx) {
    if (/\s/.test(plainText[origIdx])) {
      // In normalized form, consecutive whitespace = 1 space
      if (normIdx > 0 || !/\s/.test(plainText[origIdx - 1] || '')) {
        normIdx++;
      }
      origIdx++;
      // Skip consecutive whitespace in original
      while (origIdx < plainText.length && /\s/.test(plainText[origIdx])) {
        origIdx++;
      }
    } else {
      normIdx++;
      origIdx++;
    }
  }
  startOffset = origIdx;

  // Now find end offset
  let endOrigIdx = startOffset;
  let matchIdx = 0;
  while (endOrigIdx < plainText.length && matchIdx < normalizedSelected.length) {
    if (/\s/.test(plainText[endOrigIdx])) {
      if (normalizedSelected[matchIdx] === ' ') {
        matchIdx++;
      }
      endOrigIdx++;
      while (endOrigIdx < plainText.length && /\s/.test(plainText[endOrigIdx])) {
        endOrigIdx++;
      }
    } else {
      matchIdx++;
      endOrigIdx++;
    }
  }
  const endOffset = endOrigIdx;

  const prefix = plainText.slice(Math.max(0, startOffset - 30), startOffset);
  const suffix = plainText.slice(endOffset, endOffset + 30);

  return {
    selectedText,
    prefix,
    suffix,
    sectionId,
    startOffset,
    endOffset,
  };
}

/**
 * Highlight text in a container element. Returns the first highlighted element for scrolling.
 * Uses a safe approach that doesn't break on cross-element selections.
 */
function highlightTextInContainer(container: HTMLElement, searchText: string): HTMLElement | null {
  removeHighlightsFrom(container);

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    textNodes.push(node);
  }

  // Build concatenated text with node boundaries tracked
  let fullText = '';
  const nodeMap: Array<{ node: Text; start: number }> = [];
  for (const tn of textNodes) {
    nodeMap.push({ node: tn, start: fullText.length });
    fullText += tn.textContent || '';
  }

  // Normalize and find
  const normalizedFull = normalizeText(fullText);
  const normalizedSearch = normalizeText(searchText);
  let searchIdx = normalizedFull.indexOf(normalizedSearch);

  // Fallback: try first 50 chars
  if (searchIdx === -1 && normalizedSearch.length > 50) {
    const shorter = normalizedSearch.slice(0, 50);
    searchIdx = normalizedFull.indexOf(shorter);
  }
  if (searchIdx === -1) return null;

  // Map normalized index to original index
  let origStart = 0;
  let nIdx = 0;
  for (let i = 0; i < fullText.length && nIdx < searchIdx; i++) {
    if (/\s/.test(fullText[i])) {
      while (i + 1 < fullText.length && /\s/.test(fullText[i + 1])) i++;
      nIdx++; // one space in normalized
    } else {
      nIdx++;
    }
    origStart = i + 1;
  }

  let origEnd = origStart;
  let mIdx = 0;
  for (let i = origStart; i < fullText.length && mIdx < normalizedSearch.length; i++) {
    if (/\s/.test(fullText[i])) {
      while (i + 1 < fullText.length && /\s/.test(fullText[i + 1])) i++;
      mIdx++;
    } else {
      mIdx++;
    }
    origEnd = i + 1;
  }

  // Highlight each text node that overlaps [origStart, origEnd)
  let firstMark: HTMLElement | null = null;
  for (let i = 0; i < nodeMap.length; i++) {
    const { node: tn, start } = nodeMap[i];
    const len = tn.textContent!.length;
    const end = start + len;

    if (end <= origStart || start >= origEnd) continue;

    const hlStart = Math.max(0, origStart - start);
    const hlEnd = Math.min(len, origEnd - start);

    // Split the text node and wrap the highlighted portion
    const before = tn.textContent!.slice(0, hlStart);
    const highlighted = tn.textContent!.slice(hlStart, hlEnd);
    const after = tn.textContent!.slice(hlEnd);

    const mark = document.createElement('mark');
    mark.className = 'akowe-review-highlight';
    mark.style.cssText = 'background-color: hsl(48 96% 70%); border-radius: 2px; padding: 1px 0; transition: background-color 0.3s;';
    mark.textContent = highlighted;

    const parent = tn.parentNode!;
    const frag = document.createDocumentFragment();
    if (before) frag.appendChild(document.createTextNode(before));
    frag.appendChild(mark);
    if (after) frag.appendChild(document.createTextNode(after));
    parent.replaceChild(frag, tn);

    if (!firstMark) firstMark = mark;
  }

  return firstMark;
}

function removeHighlightsFrom(container: HTMLElement) {
  const marks = container.querySelectorAll('mark.akowe-review-highlight');
  marks.forEach((mark) => {
    const parent = mark.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
      parent.normalize();
    }
  });
}

interface ReviewData {
  project: {
    name: string;
    type: string;
    topic: string;
    citationStyle: string;
    wordCount: number;
  };
  sections: Array<{
    id: string;
    type: string;
    title: string;
    content: string;
    order: number;
  }>;
  advisorName: string;
  shareLinkId: string;
  expiresAt: string;
  rubric?: string[];
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`;
}

function generateSessionId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

export default function ReviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const t = useTranslations('review');
  const [data, setData] = useState<ReviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Advisor identity
  const [reviewerName, setReviewerName] = useState('');
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [sessionId, setSessionId] = useState('');

  // Comments
  const [comments, setComments] = useState<ReviewCommentData[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Inline comment UI
  const [selectionAnchor, setSelectionAnchor] = useState<TextAnchor | null>(null);
  const [commentPopupPos, setCommentPopupPos] = useState<{ x: number; y: number } | null>(null);
  const [inlineCommentText, setInlineCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // General comment
  const [generalCommentText, setGeneralCommentText] = useState('');
  const [generalCommentSection, setGeneralCommentSection] = useState<string | null>(null);

  // Comments panel
  const [showCommentsPanel, setShowCommentsPanel] = useState(false);

  // Rubric
  const [rubricAnswers, setRubricAnswers] = useState<Record<string, string>>({});
  const [rubricSubmitted, setRubricSubmitted] = useState(false);
  const [isSubmittingRubric, setIsSubmittingRubric] = useState(false);

  // Mobile selection: show a floating "Comment" button when text is selected
  const [mobileSelectionReady, setMobileSelectionReady] = useState(false);
  const [mobileSelectionSectionId, setMobileSelectionSectionId] = useState<string | null>(null);
  // Track whether the inline comment sheet is open on mobile
  const [showMobileInlineSheet, setShowMobileInlineSheet] = useState(false);

  // Cache the last valid selection so we can recover it even if the browser clears
  // the native selection before we can read it (common on mobile)
  const lastValidSelectionRef = useRef<{
    text: string;
    sectionId: string;
    anchor: TextAnchor;
    timestamp: number;
  } | null>(null);

  // Highlighted text from navigating to a comment
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);

  const contentRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Stores the text to highlight while the comment popup/sheet is open.
  // We apply this AFTER React renders via useLayoutEffect so that
  // dangerouslySetInnerHTML commits first, then we add our <mark> elements.
  const pendingHighlightRef = useRef<{ sectionId: string; text: string } | null>(null);

  // Stores navigation highlight info (temporary, when clicking a comment to see it in text).
  // Same pattern: survives re-renders by re-applying after each React commit.
  const navHighlightRef = useRef<{ sectionId: string; text: string } | null>(null);

  useEffect(() => {
    // Check cookies for existing identity
    const savedName = getCookie('akowe_reviewer_name');
    const savedSession = getCookie('akowe_reviewer_session');

    if (savedName) {
      setReviewerName(savedName);
    } else {
      setShowNamePrompt(true);
    }

    if (savedSession) {
      setSessionId(savedSession);
    } else {
      const newSession = generateSessionId();
      setSessionId(newSession);
      setCookie('akowe_reviewer_session', newSession, 30);
    }

    fetchReviewData();
  }, [token]);

  useEffect(() => {
    if (data && !activeSection && data.sections.length > 0) {
      setActiveSection(data.sections[0].id);
    }
  }, [data]);

  // Listen for selectionchange — works for both mobile and desktop.
  // On mobile: shows a floating "Comment on selection" button.
  // Caches the selection so we can recover it if the browser clears it before the user taps.
  const selectionDismissTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout>;

    function handleSelectionChange() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        // Don't interfere while inline sheet or desktop popup is already showing
        if (showMobileInlineSheet || commentPopupPos) return;

        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || !selection.toString().trim()) {
          // On mobile, keep the floating button visible for a grace period (3s)
          // so the user can tap it even after the native selection handles disappear.
          // The cached selection in lastValidSelectionRef will still be usable.
          if (lastValidSelectionRef.current && Date.now() - lastValidSelectionRef.current.timestamp < 10000) {
            // Button is still showing and cache is fresh — start a dismiss timer
            clearTimeout(selectionDismissTimer.current);
            selectionDismissTimer.current = setTimeout(() => {
              setMobileSelectionReady(false);
              setMobileSelectionSectionId(null);
            }, 3000);
          } else {
            // No valid cache, dismiss immediately
            setMobileSelectionReady(false);
            setMobileSelectionSectionId(null);
          }
          return;
        }

        const selectedText = selection.toString().trim();
        if (selectedText.length < 2) {
          setMobileSelectionReady(false);
          setMobileSelectionSectionId(null);
          return;
        }

        // Valid selection — cancel any pending dismiss
        clearTimeout(selectionDismissTimer.current);

        // Figure out which section the selection is in
        const checkNode = selection.anchorNode || selection.focusNode;
        if (!checkNode) {
          setMobileSelectionReady(false);
          setMobileSelectionSectionId(null);
          return;
        }

        const sectionId = findSectionForNode(checkNode, contentRefs.current);
        if (sectionId) {
          // Cache this valid selection so we can use it even if the browser clears it later
          const sectionEl = contentRefs.current[sectionId];
          if (sectionEl) {
            const anchor = buildTextAnchor(sectionEl, selectedText, sectionId);
            if (anchor) {
              lastValidSelectionRef.current = {
                text: selectedText,
                sectionId,
                anchor,
                timestamp: Date.now(),
              };
            }
          }
          setMobileSelectionSectionId(sectionId);
          setMobileSelectionReady(true);
        } else {
          setMobileSelectionReady(false);
          setMobileSelectionSectionId(null);
        }
      }, 150);
    }

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      clearTimeout(debounceTimer);
      clearTimeout(selectionDismissTimer.current);
    };
  }, [showMobileInlineSheet, commentPopupPos]);

  // Close the desktop popup when clicking outside of it
  useEffect(() => {
    if (!commentPopupPos) return;

    function handleClickOutside(e: MouseEvent) {
      const popup = document.querySelector('[data-comment-popup]');
      if (popup && !popup.contains(e.target as Node)) {
        setCommentPopupPos(null);
        setSelectionAnchor(null);
        setInlineCommentText('');
        clearInlineHighlight();
      }
    }

    // Delay adding the listener so the click that opened the popup doesn't close it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [commentPopupPos]);

  // Re-apply highlights after every React DOM commit.
  // This ensures dangerouslySetInnerHTML can't blow away our <mark> elements.
  useLayoutEffect(() => {
    // 1. Inline comment highlight (while popup/sheet is open)
    const inlineInfo = pendingHighlightRef.current;
    if (inlineInfo && (commentPopupPos || showMobileInlineSheet)) {
      const sectionEl = contentRefs.current[inlineInfo.sectionId];
      if (sectionEl) {
        const existing = sectionEl.querySelector('mark.akowe-review-highlight');
        if (!existing) {
          highlightTextInContainer(sectionEl, inlineInfo.text);
        }
      }
      return; // inline highlight takes priority, don't double-highlight
    }

    // 2. Navigation highlight (temporary, when clicking a comment to find it in text)
    const navInfo = navHighlightRef.current;
    if (navInfo) {
      const sectionEl = contentRefs.current[navInfo.sectionId];
      if (sectionEl) {
        const existing = sectionEl.querySelector('mark.akowe-review-highlight');
        if (!existing) {
          highlightTextInContainer(sectionEl, navInfo.text);
        }
      }
    }
  });

  /**
   * Capture the current selection and open the comment input.
   * Used by both the mobile floating button and as a shared helper.
   *
   * On mobile, the native selection may have already been cleared by the time
   * the user taps the floating button. In that case, we fall back to the
   * cached selection from the selectionchange listener.
   */
  function captureSelectionAndOpenComment(sectionId: string, mode: 'mobile' | 'desktop') {
    const selection = window.getSelection();
    const hasLiveSelection = selection && !selection.isCollapsed && selection.toString().trim().length >= 2;

    let selectedText: string;
    let anchor: TextAnchor | null;
    let usedSectionId = sectionId;

    if (hasLiveSelection) {
      // Live selection is available — use it directly
      selectedText = selection!.toString().trim();
      const sectionEl = contentRefs.current[sectionId];
      if (!sectionEl) return;
      anchor = buildTextAnchor(sectionEl, selectedText, sectionId);
    } else {
      // Live selection was cleared (common on mobile) — use cached selection
      const cached = lastValidSelectionRef.current;
      if (!cached || Date.now() - cached.timestamp > 10000) {
        // Cache is stale (>10s old), give up
        return;
      }
      selectedText = cached.text;
      anchor = cached.anchor;
      usedSectionId = cached.sectionId;
    }

    if (!anchor) return;

    // Get position from the live selection BEFORE we do anything that might clear it
    let popupPos: { x: number; y: number } | null = null;
    if (mode === 'desktop' && hasLiveSelection) {
      try {
        const range = selection!.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        popupPos = {
          x: Math.min(rect.left + rect.width / 2, window.innerWidth - 200),
          y: rect.bottom + window.scrollY + 8,
        };
      } catch {
        // Range may be invalid if selection was partially cleared
      }
    }

    // Store highlight info so useLayoutEffect can apply it AFTER React re-renders.
    pendingHighlightRef.current = { sectionId: usedSectionId, text: selectedText };

    setSelectionAnchor(anchor);

    if (mode === 'desktop' && popupPos) {
      setCommentPopupPos(popupPos);
    } else {
      // On mobile, or desktop without a valid popup position, use the bottom sheet
      setShowMobileInlineSheet(true);
      setMobileSelectionReady(false);
    }

    // Clear the cached selection now that we've used it
    lastValidSelectionRef.current = null;
  }

  /** Remove all highlights (both inline comment and navigation) */
  function clearInlineHighlight() {
    pendingHighlightRef.current = null;
    navHighlightRef.current = null;
    for (const el of Object.values(contentRefs.current)) {
      if (el) removeHighlightsFrom(el);
    }
  }

  function navigateToComment(comment: ReviewCommentData) {
    // Close all open panels/popups
    setShowCommentsPanel(false);
    setShowMobileInlineSheet(false);
    setCommentPopupPos(null);
    setSelectionAnchor(null);
    setInlineCommentText('');
    clearInlineHighlight();

    // Set the navigation highlight ref BEFORE state changes so the
    // useLayoutEffect can apply it after React commits the render.
    if (comment.commentType === 'inline' && comment.textAnchor) {
      navHighlightRef.current = {
        sectionId: comment.sectionId,
        text: comment.textAnchor.selectedText,
      };
    } else {
      navHighlightRef.current = null;
    }

    // Switch to the section this comment belongs to
    setActiveSection(comment.sectionId);
    setHighlightedCommentId(comment._id);

    // After React re-renders and useLayoutEffect applies the highlight, scroll to it
    setTimeout(() => {
      const sectionEl = contentRefs.current[comment.sectionId];
      if (!sectionEl) return;

      // For inline comments, scroll to the highlighted mark
      if (comment.commentType === 'inline' && comment.textAnchor) {
        const mark = sectionEl.querySelector('mark.akowe-review-highlight');
        if (mark) {
          mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      } else {
        // For general comments, scroll to the section top
        sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      // Auto-clear navigation highlight after 3 seconds
      setTimeout(() => {
        navHighlightRef.current = null;
        const el = contentRefs.current[comment.sectionId];
        if (el) removeHighlightsFrom(el);
        setHighlightedCommentId(null);
      }, 3000);
    }, 300);
  }

  async function fetchReviewData() {
    try {
      const res = await fetch(`/api/review/${token}`);
      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.error || 'Failed to load review');
        return;
      }
      const reviewData = await res.json();
      setData(reviewData);
      fetchComments();
      // Load existing rubric response if there is one
      if (reviewData.rubric && reviewData.rubric.length > 0) {
        fetchRubricResponse();
      }
    } catch {
      setError('Failed to load review');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchRubricResponse() {
    try {
      const res = await fetch(`/api/review/${token}/rubric`);
      if (res.ok) {
        const json = await res.json();
        if (json.response) {
          const map: Record<string, string> = {};
          for (const a of json.response.answers) {
            map[a.question] = a.answer;
          }
          setRubricAnswers(map);
          setRubricSubmitted(true);
        }
      }
    } catch {
      // Silent
    }
  }

  async function submitRubric() {
    if (!data?.rubric || !reviewerName || !sessionId) return;
    setIsSubmittingRubric(true);
    try {
      const answers = data.rubric.map((q) => ({ question: q, answer: rubricAnswers[q] || '' }));
      const res = await fetch(`/api/review/${token}/rubric`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advisorName: reviewerName,
          advisorSessionId: sessionId,
          answers,
        }),
      });
      if (res.ok) {
        setRubricSubmitted(true);
      }
    } catch {
      // Silent
    } finally {
      setIsSubmittingRubric(false);
    }
  }

  async function fetchComments() {
    try {
      const res = await fetch(`/api/review/${token}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch {
      // Silent fail for comments
    }
  }

  function handleNameSubmit() {
    if (!reviewerName.trim()) return;
    setCookie('akowe_reviewer_name', reviewerName.trim(), 30);
    setShowNamePrompt(false);
  }

  function handleTextSelection(sectionId: string) {
    // On mobile, text selection is handled by the selectionchange listener
    // + floating button flow. Skip mouseup handling to avoid conflicts.
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      // Only clear if we don't have a popup/sheet open already
      if (!inlineCommentText && !commentPopupPos && !showMobileInlineSheet) {
        setCommentPopupPos(null);
        setSelectionAnchor(null);
        clearInlineHighlight();
      }
      return;
    }

    captureSelectionAndOpenComment(sectionId, 'desktop');
  }

  async function submitInlineComment() {
    if (!inlineCommentText.trim() || !selectionAnchor || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/review/${token}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advisorName: reviewerName,
          advisorSessionId: sessionId,
          sectionId: selectionAnchor.sectionId,
          commentType: 'inline',
          content: inlineCommentText.trim(),
          textAnchor: selectionAnchor,
        }),
      });

      if (res.ok) {
        setInlineCommentText('');
        setCommentPopupPos(null);
        setSelectionAnchor(null);
        setShowMobileInlineSheet(false);
        clearInlineHighlight();
        window.getSelection()?.removeAllRanges();
        fetchComments();
      }
    } catch {
      // Silent
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitGeneralComment(sectionId: string) {
    if (!generalCommentText.trim() || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/review/${token}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advisorName: reviewerName,
          advisorSessionId: sessionId,
          sectionId,
          commentType: 'general',
          content: generalCommentText.trim(),
        }),
      });

      if (res.ok) {
        setGeneralCommentText('');
        setGeneralCommentSection(null);
        fetchComments();
      }
    } catch {
      // Silent
    } finally {
      setIsSubmitting(false);
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[hsl(var(--primary))] border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]">
            {t('loadingReview')}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center p-4">
        <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-(--radius) shadow-[12px_12px_0_rgba(29,41,57,0.2)] p-8 max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold uppercase tracking-[0.16em] mb-2">
            {t('unableToLoad')}
          </h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const sectionComments = (sectionId: string) =>
    comments.filter((c) => c.sectionId === sectionId && !c.parentCommentId);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] overflow-x-hidden">
      {/* Name Prompt Modal */}
      {showNamePrompt && (
        <div className="fixed inset-0 bg-[hsl(var(--foreground))]/60 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm">
            <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-(--radius) shadow-[12px_12px_0_rgba(29,41,57,0.2)] p-6">
              <h3 className="text-lg font-bold uppercase tracking-[0.16em] mb-4 text-center">
                {t('welcomeReviewer')}
              </h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4 text-center">
                {t('enterNamePrompt')}
              </p>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                placeholder={t('namePlaceholder')}
                className="w-full px-3 py-2 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--background))] text-sm mb-4 focus:outline-none focus:border-[hsl(var(--primary))]"
                autoFocus
              />
              <button
                onClick={handleNameSubmit}
                disabled={!reviewerName.trim()}
                className="w-full px-4 py-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-(--radius) text-sm font-semibold uppercase tracking-[0.2em] disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {t('continue')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))]">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-bold uppercase tracking-[0.12em] shrink-0">
                Akowe
              </span>
              <span className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] border-l-2 border-[hsl(var(--border))] pl-2 shrink-0">
                {t('review')}
              </span>
            </div>
            <h1 className="text-lg md:text-xl font-semibold break-words">{data.project.name}</h1>
            <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-[0.16em]">
              {data.project.type} &middot; {data.project.citationStyle} &middot;{' '}
              {data.project.wordCount?.toLocaleString() || 0} words
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCommentsPanel(!showCommentsPanel)}
              className="flex items-center gap-2 px-3 py-2 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) text-xs uppercase tracking-[0.18em] font-semibold hover:bg-[hsl(var(--accent))] active:bg-[hsl(var(--accent))] transition-colors touch-manipulation min-h-[44px]"
            >
              <MessageSquare className="h-4 w-4" />
              <span>{comments.filter((c) => !c.parentCommentId).length}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto flex relative overflow-x-hidden">
        {/* Section Navigation */}
        <nav className="w-56 shrink-0 border-r-2 border-[hsl(var(--border))] bg-[hsl(var(--surface))] min-h-[calc(100vh-80px)] hidden md:block">
          <div className="p-4 space-y-1">
            <p className="text-[10px] uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))] mb-3 font-semibold">
              {t('sections')}
            </p>
            {data.sections.map((section) => {
              const count = sectionComments(section.id).length;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-3 py-2 rounded-(--radius) text-sm transition-colors flex items-center justify-between ${
                    activeSection === section.id
                      ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] font-semibold'
                      : 'hover:bg-[hsl(var(--surface-muted))]'
                  }`}
                >
                  <span className="truncate">{section.title}</span>
                  {count > 0 && (
                    <span className="text-[10px] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-full px-1.5 py-0.5 font-semibold">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Mobile Section Selector */}
          <div className="md:hidden border-b-2 border-[hsl(var(--border))] p-3">
            <select
              value={activeSection || ''}
              onChange={(e) => setActiveSection(e.target.value)}
              className="w-full px-3 py-2 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--background))] text-sm"
            >
              {data.sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          {data.sections
            .filter((s) => !activeSection || s.id === activeSection)
            .map((section) => (
              <div key={section.id} className="p-4 md:p-6 border-b-2 border-[hsl(var(--border))] overflow-hidden">
                <h2 className="text-lg font-bold uppercase tracking-[0.12em] mb-4 break-words">
                  {section.title}
                </h2>

                {/* Section Content (read-only) */}
                <div
                  ref={(el) => { contentRefs.current[section.id] = el; }}
                  onMouseUp={() => handleTextSelection(section.id)}
                  className="prose prose-sm max-w-none mb-6 select-text cursor-text break-words overflow-wrap-anywhere [word-break:break-word] [&_table]:block [&_table]:overflow-x-auto [&_table]:max-w-full [&_pre]:overflow-x-auto [&_pre]:max-w-full [&_img]:max-w-full [&_img]:h-auto [&_*]:max-w-full"
                  style={{ overflowWrap: 'anywhere' }}
                  dangerouslySetInnerHTML={{ __html: section.content || '<p><em>No content yet.</em></p>' }}
                />

                {/* Section Comments */}
                {sectionComments(section.id).length > 0 && (
                  <div className="border-t-2 border-[hsl(var(--border))] pt-4 mb-4">
                    <p className="text-xs uppercase tracking-[0.2em] font-semibold text-[hsl(var(--muted-foreground))] mb-3">
                      {t('comments')} ({sectionComments(section.id).length})
                    </p>
                    <div className="space-y-3">
                      {sectionComments(section.id).map((comment) => (
                        <div
                          key={comment._id}
                          className={`border-2 rounded-(--radius) p-3 transition-all duration-300 ${
                            highlightedCommentId === comment._id
                              ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5 shadow-[0_0_0_2px_hsl(var(--primary)/0.2)]'
                              : 'border-[hsl(var(--border))]'
                          } ${comment.commentType === 'inline' && comment.textAnchor ? 'cursor-pointer' : ''}`}
                          onClick={() => {
                            if (comment.commentType === 'inline' && comment.textAnchor) {
                              // Use the ref so the highlight persists across re-renders
                              navHighlightRef.current = {
                                sectionId: comment.sectionId,
                                text: comment.textAnchor.selectedText,
                              };
                              setHighlightedCommentId(comment._id);

                              // Scroll to the highlighted mark after React commits
                              requestAnimationFrame(() => {
                                const sectionEl = contentRefs.current[comment.sectionId];
                                const mark = sectionEl?.querySelector('mark.akowe-review-highlight');
                                if (mark) {
                                  mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                              });

                              // Auto-clear after 3s
                              setTimeout(() => {
                                navHighlightRef.current = null;
                                const sectionEl = contentRefs.current[comment.sectionId];
                                if (sectionEl) removeHighlightsFrom(sectionEl);
                                setHighlightedCommentId(null);
                              }, 3000);
                            }
                          }}
                        >
                          {comment.commentType === 'inline' && comment.textAnchor && (
                            <div className="bg-[hsl(var(--accent))]/50 border-l-4 border-[hsl(var(--primary))] px-3 py-1 mb-2 text-sm italic">
                              &ldquo;{comment.textAnchor.selectedText.slice(0, 100)}
                              {comment.textAnchor.selectedText.length > 100 ? '...' : ''}&rdquo;
                            </div>
                          )}
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold">{comment.advisorName}</span>
                            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                          {comment.commentType === 'inline' && comment.textAnchor && (
                            <p className="text-[10px] uppercase tracking-[0.16em] text-[hsl(var(--primary))] mt-2 font-semibold">
                              {t('tapToSeeInText')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* General Comment Input */}
                {!showNamePrompt && (
                  <div className="border-t-2 border-[hsl(var(--border))] pt-4">
                    {generalCommentSection === section.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={generalCommentText}
                          onChange={(e) => setGeneralCommentText(e.target.value)}
                          placeholder={t('generalCommentPlaceholder')}
                          className="w-full px-3 py-2 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--background))] text-sm min-h-[80px] focus:outline-none focus:border-[hsl(var(--primary))] resize-y"
                          autoFocus
                        />
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => {
                              setGeneralCommentSection(null);
                              setGeneralCommentText('');
                            }}
                            className="px-3 py-1.5 text-xs uppercase tracking-[0.18em] font-semibold hover:bg-[hsl(var(--surface-muted))] rounded-(--radius) transition-colors"
                          >
                            {t('cancel')}
                          </button>
                          <button
                            onClick={() => submitGeneralComment(section.id)}
                            disabled={!generalCommentText.trim() || isSubmitting}
                            className="px-3 py-1.5 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-(--radius) text-xs uppercase tracking-[0.18em] font-semibold disabled:opacity-50 flex items-center gap-1.5"
                          >
                            <Send className="h-3 w-3" />
                            {isSubmitting ? t('sending') : t('comment')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setGeneralCommentSection(section.id)}
                        className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] font-semibold flex items-center gap-2 transition-colors"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        {t('addCommentOnSection')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
        </main>

        {/* Comments Panel - Desktop sidebar */}
        {showCommentsPanel && (
          <aside className="w-72 shrink-0 border-l-2 border-[hsl(var(--border))] bg-[hsl(var(--surface))] min-h-[calc(100vh-80px)] hidden md:block overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs uppercase tracking-[0.24em] font-semibold">
                  {t('allComments')} ({comments.filter((c) => !c.parentCommentId).length})
                </p>
                <button
                  onClick={() => setShowCommentsPanel(false)}
                  className="p-1 hover:bg-[hsl(var(--surface-muted))] rounded-(--radius)"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3">
                {comments
                  .filter((c) => !c.parentCommentId)
                  .map((comment) => {
                    const section = data.sections.find((s) => s.id === comment.sectionId);
                    return (
                      <div
                        key={comment._id}
                        className="border-2 border-[hsl(var(--border))] rounded-(--radius) p-3 cursor-pointer hover:border-[hsl(var(--border-strong))] transition-colors"
                        onClick={() => navigateToComment(comment)}
                      >
                        <p className="text-[10px] uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))] mb-1">
                          {section?.title || 'Unknown section'}
                        </p>
                        {comment.commentType === 'inline' && comment.textAnchor && (
                          <p className="text-xs italic text-[hsl(var(--muted-foreground))] mb-1 line-clamp-2">
                            &ldquo;{comment.textAnchor.selectedText.slice(0, 60)}...&rdquo;
                          </p>
                        )}
                        <p className="text-sm line-clamp-3">{comment.content}</p>
                        <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1">
                          {comment.advisorName} &middot;{' '}
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    );
                  })}
                {comments.filter((c) => !c.parentCommentId).length === 0 && (
                  <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-4">
                    {t('noCommentsYet')}
                  </p>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Comments Panel - Mobile overlay */}
      {showCommentsPanel && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-[hsl(var(--foreground))]/40"
            onClick={() => setShowCommentsPanel(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] bg-[hsl(var(--surface))] border-t-4 border-[hsl(var(--border-strong))] rounded-t-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-200">
            <div className="p-4 border-b-2 border-[hsl(var(--border-strong))] shrink-0">
              <div className="w-10 h-1 bg-[hsl(var(--border-strong))] rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.24em] font-semibold">
                  {t('allComments')} ({comments.filter((c) => !c.parentCommentId).length})
                </p>
                <button
                  onClick={() => setShowCommentsPanel(false)}
                  className="p-2 hover:bg-[hsl(var(--surface-muted))] rounded-(--radius) touch-manipulation"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {comments
                .filter((c) => !c.parentCommentId)
                .map((comment) => {
                  const section = data.sections.find((s) => s.id === comment.sectionId);
                  return (
                    <div
                      key={comment._id}
                      className="border-2 border-[hsl(var(--border))] rounded-(--radius) p-3 cursor-pointer active:border-[hsl(var(--border-strong))] transition-colors touch-manipulation"
                      onClick={() => navigateToComment(comment)}
                    >
                      <p className="text-[10px] uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))] mb-1">
                        {section?.title || 'Unknown section'}
                      </p>
                      {comment.commentType === 'inline' && comment.textAnchor && (
                        <p className="text-xs italic text-[hsl(var(--muted-foreground))] mb-1 line-clamp-2">
                          &ldquo;{comment.textAnchor.selectedText.slice(0, 60)}...&rdquo;
                        </p>
                      )}
                      <p className="text-sm line-clamp-3">{comment.content}</p>
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1">
                        {comment.advisorName} &middot;{' '}
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  );
                })}
              {comments.filter((c) => !c.parentCommentId).length === 0 && (
                <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-8">
                  No comments yet. Highlight text or use the comment button below each section.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Inline Comment Popup - Desktop (positioned near selection via mouseup) */}
      {commentPopupPos && selectionAnchor && !showNamePrompt && (
        <div
          data-comment-popup
          className="fixed z-50 hidden md:block"
          style={{
            left: `${commentPopupPos.x}px`,
            top: `${commentPopupPos.y}px`,
            transform: 'translateX(-50%)',
          }}
          // Prevent clicks inside popup from bubbling to section's onMouseUp
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
        >
          <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-(--radius) shadow-[8px_8px_0_rgba(29,41,57,0.15)] p-3 w-72">
            <div className="text-xs text-[hsl(var(--muted-foreground))] mb-2 italic line-clamp-2">
              &ldquo;{selectionAnchor.selectedText.slice(0, 80)}
              {selectionAnchor.selectedText.length > 80 ? '...' : ''}&rdquo;
            </div>
            <textarea
              value={inlineCommentText}
              onChange={(e) => setInlineCommentText(e.target.value)}
              placeholder={t('inlineCommentPlaceholder')}
              className="w-full px-2 py-1.5 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--background))] text-sm min-h-[60px] focus:outline-none focus:border-[hsl(var(--primary))] resize-y"
              autoFocus
            />
            <div className="flex items-center gap-2 mt-2 justify-end">
              <button
                onClick={() => {
                  setCommentPopupPos(null);
                  setSelectionAnchor(null);
                  setInlineCommentText('');
                  clearInlineHighlight();
                  window.getSelection()?.removeAllRanges();
                }}
                className="px-2 py-1 text-xs uppercase tracking-[0.16em] hover:bg-[hsl(var(--surface-muted))] rounded-(--radius)"
              >
                {t('cancel')}
              </button>
              <button
                onClick={submitInlineComment}
                disabled={!inlineCommentText.trim() || isSubmitting}
                className="px-2 py-1 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-(--radius) text-xs uppercase tracking-[0.16em] font-semibold disabled:opacity-50 flex items-center gap-1"
              >
                <Send className="h-3 w-3" />
                {isSubmitting ? '...' : t('send')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating "Comment on selection" button — works on both mobile and desktop as backup */}
      {mobileSelectionReady && !showMobileInlineSheet && !commentPopupPos && !showNamePrompt && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <button
            onPointerDown={(e) => {
              // Use pointerdown + preventDefault to fire before the browser clears the selection
              e.preventDefault();
              e.stopPropagation();

              // Use the current section ID, or fall back to the cached one
              const sectionId = mobileSelectionSectionId || lastValidSelectionRef.current?.sectionId;
              if (sectionId) {
                const isMobile = window.matchMedia('(pointer: coarse)').matches;
                captureSelectionAndOpenComment(sectionId, isMobile ? 'mobile' : 'desktop');
              }
            }}
            className="flex items-center gap-2 px-4 py-3 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-full shadow-lg text-xs uppercase tracking-[0.18em] font-semibold touch-manipulation min-h-[48px]"
          >
            <MessageSquarePlus className="h-4 w-4" />
            {t('commentOnSelection')}
          </button>
        </div>
      )}

      {/* Mobile: Inline comment bottom sheet (opened after tapping the floating button) */}
      {showMobileInlineSheet && selectionAnchor && !showNamePrompt && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-[hsl(var(--foreground))]/40"
            onClick={() => {
              setShowMobileInlineSheet(false);
              setSelectionAnchor(null);
              setInlineCommentText('');
              clearInlineHighlight();
              window.getSelection()?.removeAllRanges();
            }}
          />
          <div className="absolute inset-x-0 bottom-0 bg-[hsl(var(--surface))] border-t-4 border-[hsl(var(--border-strong))] rounded-t-2xl p-4 animate-in slide-in-from-bottom duration-200">
            <div className="w-10 h-1 bg-[hsl(var(--border-strong))] rounded-full mx-auto mb-3" />
            <div className="text-xs text-[hsl(var(--muted-foreground))] mb-3 italic bg-[hsl(var(--accent))]/50 border-l-4 border-[hsl(var(--primary))] px-3 py-2 rounded-(--radius) line-clamp-3">
              &ldquo;{selectionAnchor.selectedText.slice(0, 120)}
              {selectionAnchor.selectedText.length > 120 ? '...' : ''}&rdquo;
            </div>
            <textarea
              value={inlineCommentText}
              onChange={(e) => setInlineCommentText(e.target.value)}
              placeholder={t('mobileInlineCommentPlaceholder')}
              className="w-full px-3 py-2 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--background))] text-sm min-h-[80px] focus:outline-none focus:border-[hsl(var(--primary))] resize-y"
              autoFocus
            />
            <div className="flex items-center gap-2 mt-3 justify-end">
              <button
                onClick={() => {
                  setShowMobileInlineSheet(false);
                  setSelectionAnchor(null);
                  setInlineCommentText('');
                  clearInlineHighlight();
                  window.getSelection()?.removeAllRanges();
                }}
                className="px-3 py-2 text-xs uppercase tracking-[0.16em] hover:bg-[hsl(var(--surface-muted))] rounded-(--radius) touch-manipulation min-h-[44px]"
              >
                {t('cancel')}
              </button>
              <button
                onClick={async () => {
                  await submitInlineComment();
                }}
                disabled={!inlineCommentText.trim() || isSubmitting}
                className="px-3 py-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-(--radius) text-xs uppercase tracking-[0.16em] font-semibold disabled:opacity-50 flex items-center gap-1 touch-manipulation min-h-[44px]"
              >
                <Send className="h-3 w-3" />
                {isSubmitting ? t('sending') : t('send')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rubric form — shown only if the share link has questions */}
      {data?.rubric && data.rubric.length > 0 && !showNamePrompt && (
        <div className="max-w-5xl mx-auto px-4 pb-12">
          <div className="border-4 border-[hsl(var(--border-strong))] rounded-(--radius) p-6">
            <h2 className="text-xs uppercase tracking-[0.24em] font-semibold mb-1">
              Review Checklist
            </h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-5">
              {data.project.name
                ? `${data.advisorName ? data.advisorName.split(' ')[0] + ', please' : 'Please'} answer the questions below about "${data.project.name}".`
                : 'Please answer the questions below.'}
            </p>

            {rubricSubmitted ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-green-600 font-semibold mb-4">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                  Feedback submitted. You can update your answers below.
                </div>
                {data.rubric.map((question, i) => (
                  <div key={i}>
                    <p className="text-xs uppercase tracking-[0.16em] font-semibold mb-1">
                      {question}
                    </p>
                    <textarea
                      value={rubricAnswers[question] || ''}
                      onChange={(e) =>
                        setRubricAnswers((prev) => ({ ...prev, [question]: e.target.value }))
                      }
                      rows={3}
                      className="w-full px-3 py-2 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--background))] text-sm focus:outline-none focus:border-[hsl(var(--primary))] resize-y"
                    />
                  </div>
                ))}
                <button
                  onClick={submitRubric}
                  disabled={isSubmittingRubric}
                  className="px-4 py-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-(--radius) text-xs uppercase tracking-[0.16em] font-semibold disabled:opacity-50 flex items-center gap-2"
                >
                  <Send className="h-3 w-3" />
                  {isSubmittingRubric ? 'Saving...' : 'Update Answers'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {data.rubric.map((question, i) => (
                  <div key={i}>
                    <p className="text-xs uppercase tracking-[0.16em] font-semibold mb-1">
                      {question}
                    </p>
                    <textarea
                      value={rubricAnswers[question] || ''}
                      onChange={(e) =>
                        setRubricAnswers((prev) => ({ ...prev, [question]: e.target.value }))
                      }
                      rows={3}
                      placeholder="Your answer..."
                      className="w-full px-3 py-2 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--background))] text-sm focus:outline-none focus:border-[hsl(var(--primary))] resize-y"
                    />
                  </div>
                ))}
                <button
                  onClick={submitRubric}
                  disabled={isSubmittingRubric}
                  className="px-4 py-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-(--radius) text-xs uppercase tracking-[0.16em] font-semibold disabled:opacity-50 flex items-center gap-2"
                >
                  <Send className="h-3 w-3" />
                  {isSubmittingRubric ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t-2 border-[hsl(var(--border))] bg-[hsl(var(--surface))] py-4 mt-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            {t('poweredBy')}{' '}
            <a
              href="https://useakowe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold hover:text-[hsl(var(--foreground))] transition-colors"
            >
              Akowe
            </a>{' '}
            &mdash; {t('tagline')}
          </p>
          <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
            {t('expires', { date: new Date(data.expiresAt).toLocaleDateString() })}
          </p>
        </div>
      </footer>
    </div>
  );
}
