'use client';

import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Check,
  RotateCcw,
  Send,
  ChevronRight,
  X,
  Users,
} from 'lucide-react';
import { ReviewCommentData, Section } from '@/types';

interface ReviewCommentsPanelProps {
  projectId: string;
  sections: Section[];
  onClose: () => void;
  onNavigateToSection?: (sectionId: string) => void;
  onNavigateToComment?: (comment: ReviewCommentData) => void;
}

export default function ReviewCommentsPanel({
  projectId,
  sections,
  onClose,
  onNavigateToSection,
  onNavigateToComment,
}: ReviewCommentsPanelProps) {
  const [comments, setComments] = useState<ReviewCommentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'open' | 'resolved' | 'all'>('open');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAdvisor, setSelectedAdvisor] = useState<string | null>(null);

  useEffect(() => {
    fetchComments();
  }, [projectId]);

  async function fetchComments() {
    try {
      const res = await fetch(`/api/projects/${projectId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResolve(commentId: string) {
    try {
      const res = await fetch(`/api/projects/${projectId}/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve' }),
      });
      if (res.ok) fetchComments();
    } catch {
      // Silent
    }
  }

  async function handleReopen(commentId: string) {
    try {
      const res = await fetch(`/api/projects/${projectId}/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reopen' }),
      });
      if (res.ok) fetchComments();
    } catch {
      // Silent
    }
  }

  async function handleReply(commentId: string) {
    if (!replyText.trim() || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reply', content: replyText.trim() }),
      });
      if (res.ok) {
        setReplyText('');
        setReplyingTo(null);
        fetchComments();
      }
    } catch {
      // Silent
    } finally {
      setIsSubmitting(false);
    }
  }

  // --- Derived stats (always from all comments, unaffected by filters) ---
  const uniqueAdvisors = [...new Set(comments.map((c) => c.advisorName))];
  const openCount = comments.filter((c) => c.status === 'open').length;
  const resolvedCount = comments.filter((c) => c.status === 'resolved').length;

  const commentedSectionIds = new Set(comments.map((c) => c.sectionId));
  const unreviewedSections = sections
    .slice()
    .sort((a, b) => a.order - b.order)
    .filter((s) => !commentedSectionIds.has(s.id));

  // Open comment count per section (for section header badges)
  const openBySectionId = new Map<string, number>();
  for (const c of comments) {
    if (c.status === 'open') {
      openBySectionId.set(c.sectionId, (openBySectionId.get(c.sectionId) || 0) + 1);
    }
  }

  // Filtered view (respects both status filter and advisor filter)
  const filtered = comments.filter((c) => {
    if (selectedAdvisor && c.advisorName !== selectedAdvisor) return false;
    if (filter === 'all') return true;
    return c.status === filter;
  });

  // Group filtered comments by section
  const sectionMap = new Map<string, ReviewCommentData[]>();
  for (const comment of filtered) {
    if (!sectionMap.has(comment.sectionId)) sectionMap.set(comment.sectionId, []);
    sectionMap.get(comment.sectionId)!.push(comment);
  }

  // Show unreviewed sections in the list when viewing open or all comments
  // and no advisor filter is active (unreviewed is a project-level concept)
  const showUnreviewed =
    unreviewedSections.length > 0 &&
    !selectedAdvisor &&
    (filter === 'open' || filter === 'all');

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b-2 border-[hsl(var(--border-strong))] shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-[hsl(var(--primary))]" />
            <h3 className="text-xs uppercase tracking-[0.24em] font-semibold">
              Review Comments
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[hsl(var(--surface-muted))] rounded-(--radius)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Summary stats strip — visible once comments have loaded */}
        {!isLoading && comments.length > 0 && (
          <div className="flex items-center gap-3 mb-3 px-0.5">
            <span className="flex items-center gap-1 text-[10px] text-[hsl(var(--muted-foreground))]">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block shrink-0" />
              {openCount} open
            </span>
            <span className="flex items-center gap-1 text-[10px] text-[hsl(var(--muted-foreground))]">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block shrink-0" />
              {resolvedCount} resolved
            </span>
            {unreviewedSections.length > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-[hsl(var(--muted-foreground))]">
                <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--border-strong))] inline-block shrink-0" />
                {unreviewedSections.length} not reviewed
              </span>
            )}
          </div>
        )}

        {/* Status filter tabs */}
        <div className="flex gap-1">
          {(['open', 'resolved', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] font-semibold rounded-(--radius) transition-colors touch-manipulation min-h-[36px] ${
                filter === f
                  ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]'
                  : 'hover:bg-[hsl(var(--surface-muted))] active:bg-[hsl(var(--surface-muted))]'
              }`}
            >
              {f === 'open'
                ? `Open (${openCount})`
                : f === 'resolved'
                ? `Resolved (${resolvedCount})`
                : `All (${comments.length})`}
            </button>
          ))}
        </div>

        {/* Advisor filter chips — only when comments from multiple advisors */}
        {uniqueAdvisors.length > 1 && (
          <div className="flex items-center gap-1 mt-2 flex-wrap">
            <Users className="h-3 w-3 text-[hsl(var(--muted-foreground))] shrink-0" />
            <button
              onClick={() => setSelectedAdvisor(null)}
              className={`px-2 py-1 text-[10px] uppercase tracking-[0.12em] font-semibold rounded-(--radius) transition-colors ${
                !selectedAdvisor
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                  : 'border border-[hsl(var(--border))] hover:bg-[hsl(var(--surface-muted))]'
              }`}
            >
              All
            </button>
            {uniqueAdvisors.map((name) => (
              <button
                key={name}
                onClick={() => setSelectedAdvisor(selectedAdvisor === name ? null : name)}
                className={`px-2 py-1 text-[10px] uppercase tracking-[0.12em] font-semibold rounded-(--radius) transition-colors ${
                  selectedAdvisor === name
                    ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                    : 'border border-[hsl(var(--border))] hover:bg-[hsl(var(--surface-muted))]'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {isLoading ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-8">
            Loading...
          </p>
        ) : filtered.length === 0 && !showUnreviewed ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-8">
            {filter === 'open'
              ? selectedAdvisor
                ? `No open comments from ${selectedAdvisor}.`
                : 'No open comments.'
              : filter === 'resolved'
              ? 'No resolved comments.'
              : 'No comments yet. Share your project with an advisor to get feedback.'}
          </p>
        ) : (
          <>
            {/* Section groups with comments */}
            {Array.from(sectionMap.entries()).map(([sectionId, sectionComments]) => {
              const section = sections.find((s) => s.id === sectionId);
              const openInSection = openBySectionId.get(sectionId) || 0;

              return (
                <div key={sectionId}>
                  <button
                    onClick={() => onNavigateToSection?.(sectionId)}
                    className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] mb-2 flex items-center gap-1 w-full text-left"
                  >
                    <ChevronRight className="h-3 w-3 shrink-0" />
                    <span className="flex-1">{section?.title || 'Unknown Section'}</span>
                    {openInSection > 0 ? (
                      <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full font-semibold shrink-0">
                        {openInSection} open
                      </span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full font-semibold shrink-0">
                        clear
                      </span>
                    )}
                  </button>

                  <div className="space-y-2 ml-2">
                    {sectionComments.map((comment) => (
                      <div
                        key={comment._id}
                        className={`border-2 rounded-(--radius) p-3 cursor-pointer touch-manipulation transition-colors ${
                          comment.status === 'resolved'
                            ? 'border-[hsl(var(--border))] opacity-70 hover:opacity-90'
                            : 'border-[hsl(var(--border-strong))] hover:bg-[hsl(var(--accent))]/30'
                        }`}
                        onClick={() => {
                          if (onNavigateToComment) {
                            onNavigateToComment(comment);
                          } else {
                            onNavigateToSection?.(comment.sectionId);
                          }
                        }}
                      >
                        {/* Inline text excerpt */}
                        {comment.commentType === 'inline' && comment.textAnchor && (
                          <div className="bg-[hsl(var(--accent))]/50 border-l-4 border-[hsl(var(--primary))] px-2 py-1 mb-2 text-xs italic line-clamp-2">
                            &ldquo;{comment.textAnchor.selectedText.slice(0, 80)}
                            {comment.textAnchor.selectedText.length > 80 ? '...' : ''}&rdquo;
                          </div>
                        )}

                        {/* Comment header */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold">{comment.advisorName}</span>
                          <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                          {comment.status === 'resolved' && (
                            <span className="text-[10px] text-green-600 font-semibold">Resolved</span>
                          )}
                        </div>

                        {/* Comment body */}
                        <p className="text-sm mb-2">{comment.content}</p>

                        {/* Replies */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="ml-3 border-l-2 border-[hsl(var(--border))] pl-3 space-y-2 mb-2">
                            {comment.replies.map((reply) => (
                              <div key={reply._id}>
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-[10px] font-semibold">
                                    {reply.authorType === 'student' ? 'You' : reply.advisorName}
                                  </span>
                                  <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                                    {new Date(reply.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-xs">{reply.content}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-3 mt-2">
                          {comment.status === 'open' ? (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleResolve(comment._id); }}
                                className="text-[10px] uppercase tracking-[0.16em] text-green-600 hover:text-green-700 active:text-green-700 font-semibold flex items-center gap-1 min-h-[36px] px-2 touch-manipulation"
                              >
                                <Check className="h-3.5 w-3.5" />
                                Resolve
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setReplyingTo(replyingTo === comment._id ? null : comment._id);
                                }}
                                className="text-[10px] uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] active:text-[hsl(var(--foreground))] font-semibold min-h-[36px] px-2 touch-manipulation"
                              >
                                Reply
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleReopen(comment._id); }}
                              className="text-[10px] uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] active:text-[hsl(var(--foreground))] font-semibold flex items-center gap-1 min-h-[36px] px-2 touch-manipulation"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              Reopen
                            </button>
                          )}
                        </div>

                        {/* Reply input */}
                        {replyingTo === comment._id && (
                          <div className="mt-2 space-y-2" onClick={(e) => e.stopPropagation()}>
                            <textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Your reply..."
                              className="w-full px-2 py-1.5 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--background))] text-xs min-h-[50px] focus:outline-none focus:border-[hsl(var(--primary))] resize-y"
                              autoFocus
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => {
                                  setReplyingTo(null);
                                  setReplyText('');
                                }}
                                className="px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] min-h-[36px] touch-manipulation"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleReply(comment._id)}
                                disabled={!replyText.trim() || isSubmitting}
                                className="px-3 py-1.5 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-(--radius) text-[10px] uppercase tracking-[0.16em] font-semibold disabled:opacity-50 flex items-center gap-1 min-h-[36px] touch-manipulation"
                              >
                                <Send className="h-2.5 w-2.5" />
                                Send
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Unreviewed sections — shown when no advisor filter is active */}
            {showUnreviewed && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[hsl(var(--muted-foreground))] mb-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--border-strong))] inline-block shrink-0" />
                  Not yet reviewed
                </p>
                <div className="space-y-1 ml-4">
                  {unreviewedSections.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => onNavigateToSection?.(s.id)}
                      className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] w-full text-left py-1 touch-manipulation"
                    >
                      {s.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
