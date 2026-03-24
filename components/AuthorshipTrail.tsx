'use client';

import { useEffect, useState } from 'react';
import { X, Clock, FileText, BookOpen } from 'lucide-react';

interface EditEvent {
  _id: string;
  totalWordCount: number;
  citationCount: number;
  sectionSnapshots: Array<{ sectionId: string; title: string; wordCount: number }>;
  contentHash: string;
  createdAt: string;
}

interface Props {
  projectId: string;
  projectName: string;
  onClose: () => void;
}

export default function AuthorshipTrail({ projectId, projectName, onClose }: Props) {
  const [events, setEvents] = useState<EditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/history?limit=50`);
        if (!res.ok) throw new Error('Failed to load history');
        const data = await res.json();
        setEvents(data.events || []);
      } catch {
        setError('Could not load edit history.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [projectId]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const latestEvent = events[0];
  const firstEvent = events[events.length - 1];
  const wordGrowth =
    latestEvent && firstEvent
      ? latestEvent.totalWordCount - firstEvent.totalWordCount
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[hsl(var(--foreground))]/40 p-4">
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col bg-[hsl(var(--background))] border-4 border-[hsl(var(--border-strong))] rounded-(--radius) shadow-[6px_6px_0_rgba(29,41,57,0.12)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-[hsl(var(--border-strong))]">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.18em]">
              Edit History
            </h2>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 truncate max-w-xs">
              {projectName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-(--radius) hover:bg-[hsl(var(--muted))]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Summary stats */}
        {!isLoading && events.length > 0 && (
          <div className="grid grid-cols-3 gap-3 p-4 border-b-2 border-[hsl(var(--border))]">
            <div className="border-2 border-[hsl(var(--border))] rounded-(--radius) p-3 text-center">
              <div className="text-lg font-bold">{events.length}</div>
              <div className="text-[10px] uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
                Edit Sessions
              </div>
            </div>
            <div className="border-2 border-[hsl(var(--border))] rounded-(--radius) p-3 text-center">
              <div className="text-lg font-bold">
                {latestEvent?.totalWordCount || 0}
              </div>
              <div className="text-[10px] uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
                Total Words
              </div>
            </div>
            <div className="border-2 border-[hsl(var(--border))] rounded-(--radius) p-3 text-center">
              <div className="text-lg font-bold">
                {wordGrowth >= 0 ? '+' : ''}
                {wordGrowth}
              </div>
              <div className="text-[10px] uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
                Words Added
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading && (
            <div className="text-center py-8 text-[hsl(var(--muted-foreground))] text-sm">
              Loading history…
            </div>
          )}
          {error && (
            <div className="text-center py-8 text-[hsl(var(--destructive))] text-sm">
              {error}
            </div>
          )}
          {!isLoading && !error && events.length === 0 && (
            <div className="text-center py-8 text-[hsl(var(--muted-foreground))] text-sm">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>No edit history yet. Start writing to build your trail.</p>
            </div>
          )}
          {!isLoading &&
            events.map((event, index) => {
              const prevEvent = events[index + 1];
              const wordDelta = prevEvent
                ? event.totalWordCount - prevEvent.totalWordCount
                : event.totalWordCount;
              return (
                <div key={event._id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--primary))] border-2 border-[hsl(var(--background))] shadow-sm mt-1 shrink-0" />
                    {index < events.length - 1 && (
                      <div className="w-0.5 bg-[hsl(var(--border))] flex-1 mt-1" />
                    )}
                  </div>
                  <div className="border-2 border-[hsl(var(--border))] rounded-(--radius) p-3 flex-1 mb-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-[0.12em]">
                        {formatDate(event.createdAt)}
                      </span>
                      <span
                        className={`text-xs font-bold ${
                          wordDelta >= 0
                            ? 'text-green-600'
                            : 'text-[hsl(var(--destructive))]'
                        }`}
                      >
                        {wordDelta >= 0 ? '+' : ''}
                        {wordDelta} words
                      </span>
                    </div>
                    <div className="mt-1.5 flex gap-3 text-[11px] text-[hsl(var(--muted-foreground))]">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {event.totalWordCount} total
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {event.citationCount} citations
                      </span>
                    </div>
                    {event.sectionSnapshots && event.sectionSnapshots.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {event.sectionSnapshots.slice(0, 4).map((s) => (
                          <span
                            key={s.sectionId}
                            className="text-[10px] px-1.5 py-0.5 bg-[hsl(var(--muted))] rounded text-[hsl(var(--muted-foreground))]"
                          >
                            {s.title} ({s.wordCount}w)
                          </span>
                        ))}
                        {event.sectionSnapshots.length > 4 && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-[hsl(var(--muted))] rounded text-[hsl(var(--muted-foreground))]">
                            +{event.sectionSnapshots.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Footer */}
        <div className="p-3 border-t-2 border-[hsl(var(--border))] text-[10px] text-[hsl(var(--muted-foreground))] text-center">
          Edit history is recorded automatically. Each entry reflects a content
          save with changes detected.
        </div>
      </div>
    </div>
  );
}
