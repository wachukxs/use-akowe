'use client';

import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Check,
  RotateCcw,
  Send,
  ChevronRight,
  X,
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

  const filtered = comments.filter((c) => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  // Group by section
  const sectionMap = new Map<string, ReviewCommentData[]>();
  for (const comment of filtered) {
    if (!sectionMap.has(comment.sectionId)) sectionMap.set(comment.sectionId, []);
    sectionMap.get(comment.sectionId)!.push(comment);
  }

  const openCount = comments.filter((c) => c.status === 'open').length;
  const resolvedCount = comments.filter((c) => c.status === 'resolved').length;

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

        {/* Filter tabs */}
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
              {f === 'open' ? `Open (${openCount})` : f === 'resolved' ? `Resolved (${resolvedCount})` : `All (${comments.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {isLoading ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-8">
            Loading...
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-8">
            {filter === 'open'
              ? 'No open comments.'
              : filter === 'resolved'
              ? 'No resolved comments.'
              : 'No comments yet. Share your project with an advisor to get feedback.'}
          </p>
        ) : (
          Array.from(sectionMap.entries()).map(([sectionId, sectionComments]) => {
            const section = sections.find((s) => s.id === sectionId);
            return (
              <div key={sectionId}>
                <button
                  onClick={() => onNavigateToSection?.(sectionId)}
                  className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] mb-2 flex items-center gap-1"
                >
                  <ChevronRight className="h-3 w-3" />
                  {section?.title || 'Unknown Section'}
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
          })
        )}
      </div>
    </div>
  );
}
