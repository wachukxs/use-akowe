'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, ToggleLeft, ToggleRight, Megaphone, Users, Eye } from 'lucide-react';

interface Announcement {
  _id: string;
  title: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
  type: 'banner' | 'modal';
  target: 'all' | 'free' | 'paid';
  active: boolean;
  expiresAt?: string | null;
  createdAt: string;
  dismissCount: number;
}

const EMPTY_FORM = {
  title: '',
  body: '',
  ctaText: '',
  ctaUrl: '',
  type: 'banner' as 'banner' | 'modal',
  target: 'all' as 'all' | 'free' | 'paid',
  active: false,
  expiresAt: '',
};

export default function AnnouncementsTab() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/announcements');
      const data = await r.json();
      setAnnouncements(data.announcements ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function create() {
    if (!form.title.trim() || !form.body.trim()) {
      setError('Title and body are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const r = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          expiresAt: form.expiresAt || null,
        }),
      });
      if (!r.ok) {
        const d = await r.json();
        setError(d.error ?? 'Failed to create.');
        return;
      }
      setForm(EMPTY_FORM);
      setShowForm(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(a: Announcement) {
    await fetch(`/api/admin/announcements/${a._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !a.active }),
    });
    setAnnouncements((prev) =>
      prev.map((x) => (x._id === a._id ? { ...x, active: !a.active } : x))
    );
  }

  async function remove(id: string) {
    if (!confirm('Delete this announcement?')) return;
    await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' });
    setAnnouncements((prev) => prev.filter((a) => a._id !== id));
  }

  const targetLabel = (t: string) =>
    t === 'all' ? 'All users' : t === 'free' ? 'Free users' : 'Paid users';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold uppercase tracking-[0.16em]">Announcements</h2>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
            In-product banners and modals shown to logged-in users.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(''); }}
          className="flex items-center gap-2 border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] rounded hover:opacity-90 transition-opacity"
        >
          <Plus size={14} />
          New Announcement
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] rounded p-5 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-[0.14em]">Create Announcement</h3>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-[0.14em] mb-1">Title *</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="What's new?"
                className="w-full border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--background))] px-3 py-2 text-sm rounded focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-[0.14em] mb-1">Body *</label>
              <textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={3}
                placeholder="Describe the feature or update..."
                className="w-full border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--background))] px-3 py-2 text-sm rounded focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.14em] mb-1">CTA Button Text</label>
              <input
                value={form.ctaText}
                onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                placeholder="See what's new"
                className="w-full border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--background))] px-3 py-2 text-sm rounded focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.14em] mb-1">CTA URL</label>
              <input
                value={form.ctaUrl}
                onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })}
                placeholder="/dashboard or https://..."
                className="w-full border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--background))] px-3 py-2 text-sm rounded focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.14em] mb-1">Display Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as 'banner' | 'modal' })}
                className="w-full border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--background))] px-3 py-2 text-sm rounded focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
              >
                <option value="banner">Banner (top of page)</option>
                <option value="modal">Modal (centered dialog)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.14em] mb-1">Target Audience</label>
              <select
                value={form.target}
                onChange={(e) => setForm({ ...form, target: e.target.value as 'all' | 'free' | 'paid' })}
                className="w-full border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--background))] px-3 py-2 text-sm rounded focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
              >
                <option value="all">All users</option>
                <option value="free">Free users only</option>
                <option value="paid">Paid users only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.14em] mb-1">Expires At (optional)</label>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="w-full border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--background))] px-3 py-2 text-sm rounded focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active-check"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="w-4 h-4 accent-[hsl(var(--primary))]"
              />
              <label htmlFor="active-check" className="text-xs font-semibold uppercase tracking-[0.14em]">
                Activate immediately
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={create}
              disabled={saving}
              className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-5 py-2 text-xs font-semibold uppercase tracking-[0.16em] rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {saving ? 'Saving...' : 'Create'}
            </button>
            <button
              onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setError(''); }}
              className="border-2 border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))] px-5 py-2 text-xs font-semibold uppercase tracking-[0.16em] rounded hover:opacity-80 transition-opacity"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading...</p>
      ) : announcements.length === 0 ? (
        <div className="border-2 border-dashed border-[hsl(var(--border-strong))] rounded p-8 text-center">
          <Megaphone size={28} className="mx-auto text-[hsl(var(--muted-foreground))] mb-3" />
          <p className="text-sm text-[hsl(var(--muted-foreground))] uppercase tracking-[0.14em]">
            No announcements yet. Create your first one.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div
              key={a._id}
              className={`border-2 rounded p-4 flex flex-col sm:flex-row sm:items-start gap-4 ${
                a.active
                  ? 'border-[hsl(var(--border-strong))] bg-[hsl(var(--surface))]'
                  : 'border-[hsl(var(--border-strong))]/50 bg-[hsl(var(--background))] opacity-60'
              }`}
            >
              {/* Main content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-sm font-bold truncate">{a.title}</span>
                  <span className={`text-[10px] uppercase tracking-[0.16em] px-2 py-0.5 rounded font-semibold border ${
                    a.active
                      ? 'bg-green-100 text-green-700 border-green-300'
                      : 'bg-gray-100 text-gray-500 border-gray-300'
                  }`}>
                    {a.active ? 'Live' : 'Draft'}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.14em] px-2 py-0.5 rounded border border-[hsl(var(--border-strong))] text-[hsl(var(--muted-foreground))]">
                    {a.type}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.14em] px-2 py-0.5 rounded border border-[hsl(var(--border-strong))] text-[hsl(var(--muted-foreground))]">
                    {targetLabel(a.target)}
                  </span>
                </div>
                <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed line-clamp-2 mb-2">
                  {a.body}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-[hsl(var(--muted-foreground))]">
                  <span className="flex items-center gap-1">
                    <Eye size={11} />
                    {a.dismissCount} dismissed
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={11} />
                    Created {new Date(a.createdAt).toLocaleDateString()}
                  </span>
                  {a.expiresAt && (
                    <span>
                      Expires {new Date(a.expiresAt).toLocaleDateString()}
                    </span>
                  )}
                  {a.ctaText && (
                    <span className="text-[hsl(var(--primary))] font-medium">
                      CTA: {a.ctaText}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleActive(a)}
                  title={a.active ? 'Deactivate' : 'Activate'}
                  className="p-2 rounded hover:bg-[hsl(var(--accent))] transition-colors"
                >
                  {a.active
                    ? <ToggleRight size={20} className="text-green-600" />
                    : <ToggleLeft size={20} className="text-[hsl(var(--muted-foreground))]" />
                  }
                </button>
                <button
                  onClick={() => remove(a._id)}
                  title="Delete"
                  className="p-2 rounded hover:bg-red-50 text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
