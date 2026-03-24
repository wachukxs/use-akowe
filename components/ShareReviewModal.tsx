'use client';

import { useState, useEffect } from 'react';
import { X, Copy, Check, Share2, Trash2, ExternalLink } from 'lucide-react';
import { Section, ShareLinkData } from '@/types';
import Button from '@/components/ui/Button';

interface ShareReviewModalProps {
  projectId: string;
  sections: Section[];
  onClose: () => void;
}

export default function ShareReviewModal({
  projectId,
  sections,
  onClose,
}: ShareReviewModalProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  const [links, setLinks] = useState<ShareLinkData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Create form state
  const [advisorName, setAdvisorName] = useState('');
  const [advisorEmail, setAdvisorEmail] = useState('');
  const [selectedSections, setSelectedSections] = useState<Set<string>>(
    new Set(sections.map((s) => s.id))
  );
  const [expiryDays, setExpiryDays] = useState(30);
  const [isCreating, setIsCreating] = useState(false);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchLinks();
  }, [projectId]);

  async function fetchLinks() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/share`);
      if (res.ok) {
        const data = await res.json();
        setLinks(data.links || []);
      }
    } catch (error) {
      console.error('Failed to fetch share links:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreate() {
    if (!advisorName.trim()) return;
    setIsCreating(true);
    setCreatedUrl(null);

    try {
      const allSelected = selectedSections.size === sections.length;
      const res = await fetch(`/api/projects/${projectId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advisorName: advisorName.trim(),
          advisorEmail: advisorEmail.trim() || undefined,
          sectionIds: allSelected ? [] : Array.from(selectedSections),
          expiryDays,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Use client-side origin to ensure the URL matches what the user sees,
        // since the API might return a different base URL (e.g. production domain in dev)
        const link = data.link;
        const clientUrl = link?.token
          ? `${window.location.origin}/review/${link.token}`
          : data.shareUrl;
        setCreatedUrl(clientUrl);
        setAdvisorName('');
        setAdvisorEmail('');
        fetchLinks();
      }
    } catch (error) {
      console.error('Failed to create share link:', error);
    } finally {
      setIsCreating(false);
    }
  }

  async function handleRevoke(linkId: string) {
    try {
      const res = await fetch(`/api/projects/${projectId}/share/${linkId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchLinks();
      }
    } catch (error) {
      console.error('Failed to revoke link:', error);
    }
  }

  async function copyToClipboard(url: string, token: string) {
    try {
      // Try the modern Clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback for non-secure contexts or older browsers
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    } catch {
      // Last resort fallback
      try {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopiedToken(token);
        setTimeout(() => setCopiedToken(null), 2000);
      } catch {
        // If all else fails, prompt the user
        window.prompt('Copy this link:', url);
      }
    }
  }

  function toggleSection(sectionId: string) {
    const next = new Set(selectedSections);
    if (next.has(sectionId)) {
      next.delete(sectionId);
    } else {
      next.add(sectionId);
    }
    setSelectedSections(next);
  }

  function toggleAll() {
    if (selectedSections.size === sections.length) {
      setSelectedSections(new Set());
    } else {
      setSelectedSections(new Set(sections.map((s) => s.id)));
    }
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="fixed inset-0 bg-[hsl(var(--foreground))]/60 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="border-4 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded-(--radius) shadow-[12px_12px_0_rgba(29,41,57,0.2)] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b-[3px] border-[hsl(var(--border-strong))] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <Share2 className="h-5 w-5 text-[hsl(var(--primary))]" />
              <h3 className="text-xl font-semibold uppercase tracking-[0.2em]">
                Share for Review
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) hover:-translate-x-[0.125rem] hover:-translate-y-[0.125rem] transition-transform duration-150"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b-2 border-[hsl(var(--border-strong))] shrink-0">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 px-4 py-3 text-xs uppercase tracking-[0.2em] font-semibold transition-colors ${
                activeTab === 'create'
                  ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]'
                  : 'hover:bg-[hsl(var(--surface-muted))]'
              }`}
            >
              Create New Link
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`flex-1 px-4 py-3 text-xs uppercase tracking-[0.2em] font-semibold transition-colors ${
                activeTab === 'manage'
                  ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]'
                  : 'hover:bg-[hsl(var(--surface-muted))]'
              }`}
            >
              Manage Links {links.length > 0 && `(${links.length})`}
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto">
            {activeTab === 'create' && (
              <div className="space-y-5">
                {createdUrl ? (
                  <div className="space-y-4">
                    <div className="border-2 border-green-400 bg-green-50 dark:bg-green-900/20 p-4 rounded-(--radius)">
                      <p className="text-sm font-semibold mb-2">Link created! Share this with your advisor:</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={createdUrl}
                          className="flex-1 px-3 py-2 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--background))] text-sm"
                        />
                        <button
                          onClick={() => copyToClipboard(createdUrl, 'created')}
                          className="p-2 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) hover:bg-[hsl(var(--accent))] transition-colors"
                        >
                          {copiedToken === 'created' ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <Button
                      onClick={() => setCreatedUrl(null)}
                      variant="outline"
                      size="sm"
                    >
                      Create Another
                    </Button>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs uppercase tracking-[0.2em] font-semibold mb-2">
                        Advisor Name *
                      </label>
                      <input
                        type="text"
                        value={advisorName}
                        onChange={(e) => setAdvisorName(e.target.value)}
                        placeholder="e.g. Dr. Smith"
                        className="w-full px-3 py-2 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--background))] text-sm focus:outline-none focus:border-[hsl(var(--primary))]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-[0.2em] font-semibold mb-2">
                        Advisor Email (optional)
                      </label>
                      <input
                        type="email"
                        value={advisorEmail}
                        onChange={(e) => setAdvisorEmail(e.target.value)}
                        placeholder="advisor@university.edu"
                        className="w-full px-3 py-2 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--background))] text-sm focus:outline-none focus:border-[hsl(var(--primary))]"
                      />
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                        We&apos;ll notify you when they leave comments
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs uppercase tracking-[0.2em] font-semibold">
                          Sections to Share
                        </label>
                        <button
                          onClick={toggleAll}
                          className="text-xs text-[hsl(var(--primary))] hover:underline"
                        >
                          {selectedSections.size === sections.length ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                      <div className="space-y-1 max-h-40 overflow-y-auto border-2 border-[hsl(var(--border))] rounded-(--radius) p-2">
                        {sections
                          .sort((a, b) => a.order - b.order)
                          .map((section) => (
                            <label
                              key={section.id}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-(--radius) hover:bg-[hsl(var(--surface-muted))] cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedSections.has(section.id)}
                                onChange={() => toggleSection(section.id)}
                                className="rounded"
                              />
                              <span className="text-sm">{section.title}</span>
                            </label>
                          ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-[0.2em] font-semibold mb-2">
                        Link Expires In
                      </label>
                      <select
                        value={expiryDays}
                        onChange={(e) => setExpiryDays(Number(e.target.value))}
                        className="w-full px-3 py-2 border-2 border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--background))] text-sm"
                      >
                        <option value={7}>7 days</option>
                        <option value={14}>14 days</option>
                        <option value={30}>30 days</option>
                        <option value={60}>60 days</option>
                        <option value={90}>90 days</option>
                      </select>
                    </div>

                    <Button
                      onClick={handleCreate}
                      disabled={!advisorName.trim() || selectedSections.size === 0 || isCreating}
                      className="w-full"
                    >
                      {isCreating ? 'Generating...' : 'Generate Review Link'}
                    </Button>
                  </>
                )}
              </div>
            )}

            {activeTab === 'manage' && (
              <div className="space-y-3">
                {isLoading ? (
                  <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-8">
                    Loading...
                  </p>
                ) : links.length === 0 ? (
                  <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-8">
                    No share links yet. Create one to get started.
                  </p>
                ) : (
                  links.map((link) => {
                    const isExpired = new Date() > new Date(link.expiresAt);
                    const isRevoked = !!link.revokedAt;
                    const isActive = !isExpired && !isRevoked;
                    const shareUrl = `${baseUrl}/review/${link.token}`;

                    return (
                      <div
                        key={link._id}
                        className={`border-2 border-[hsl(var(--border))] rounded-(--radius) p-4 ${
                          !isActive ? 'opacity-60' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">
                              {link.advisorName}
                            </span>
                            <span
                              className={`text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full font-semibold ${
                                isActive
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : isRevoked
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                              }`}
                            >
                              {isRevoked ? 'Revoked' : isExpired ? 'Expired' : 'Active'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            {isActive && (
                              <>
                                <button
                                  onClick={() => copyToClipboard(shareUrl, link.token)}
                                  className="p-1.5 border border-[hsl(var(--border))] rounded-(--radius) hover:bg-[hsl(var(--accent))] transition-colors"
                                  title="Copy link"
                                >
                                  {copiedToken === link.token ? (
                                    <Check className="h-3.5 w-3.5 text-green-600" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                                <a
                                  href={shareUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 border border-[hsl(var(--border))] rounded-(--radius) hover:bg-[hsl(var(--accent))] transition-colors"
                                  title="Open link"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                                <button
                                  onClick={() => handleRevoke(link._id)}
                                  className="p-1.5 border border-red-300 rounded-(--radius) hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                  title="Revoke link"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-[hsl(var(--muted-foreground))] flex-wrap">
                          <span>
                            Created {new Date(link.createdAt).toLocaleDateString()}
                          </span>
                          <span>
                            Expires {new Date(link.expiresAt).toLocaleDateString()}
                          </span>
                          <span>{link.accessCount || 0} views</span>
                          <span>{link.commentCount || 0} comments</span>
                          {isActive && link.accessCount === 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full font-semibold uppercase tracking-[0.1em]">
                              Not opened yet
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
