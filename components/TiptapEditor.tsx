'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { TextSelection } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import Link from '@tiptap/extension-link';
import Typography from '@tiptap/extension-typography';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Image from '@tiptap/extension-image';
import { Node, Mark, mergeAttributes } from '@tiptap/core';
import { forwardRef, useImperativeHandle, useEffect, useRef, useCallback, useState } from 'react';
import type { Editor } from '@tiptap/core';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, List, Hash,
  Undo, Redo, Calculator, BarChart3, Sparkles, BookOpen, ImageIcon, Loader2,
  Quote, Link2, Link2Off, Superscript as SuperscriptIcon, Subscript as SubscriptIcon,
  Table as TableIcon, Plus, FileText, Code, Code2, Minus, ListChecks,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CITATION_HIGHLIGHT_ATTR, CITATION_HIGHLIGHT_CLASS } from '@/lib/citation-highlight';
import Tooltip from '@/components/ui/Tooltip';

// ---------------------------------------------------------------------------
// Custom extensions
// ---------------------------------------------------------------------------

/**
 * MathBlock — block-level atom for LaTeX math equations.
 * Parses existing `<div class="math-equation">` HTML from legacy content.
 */
const MathBlock = Node.create({
  name: 'mathBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      latex: { default: '' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div.math-equation',
        getAttrs: (el) => {
          const text = (el as HTMLElement).textContent?.trim() || '';
          const match = text.match(/\$([^$]+)\$/);
          return { latex: match?.[1]?.trim() || text };
        },
      },
    ];
  },

  renderHTML({ node }) {
    const latex = (node.attrs.latex as string) || '';
    return [
      'div',
      {
        class: 'math-equation',
        style:
          'margin:16px 0;padding:16px;border:1px solid hsl(210 34% 16%);border-radius:6px;background:hsl(48 24% 95%);text-align:center;',
      },
      [
        'div',
        {
          style:
            'font-size:1.2em;font-family:"Times New Roman",serif;color:hsl(210 34% 16%);',
        },
        `$${latex}$`,
      ],
    ];
  },
});

/**
 * CitationHighlight — inline mark for the temporary "just added" highlight.
 * Parses legacy `<span data-citation-highlight>` spans from stored HTML.
 */
const CitationHighlight = Mark.create({
  name: 'citationHighlight',
  inclusive: false,

  parseHTML() {
    return [{ tag: `span[${CITATION_HIGHLIGHT_ATTR}]` }];
  },

  renderHTML() {
    return [
      'span',
      mergeAttributes({ class: CITATION_HIGHLIGHT_CLASS, [CITATION_HIGHLIGHT_ATTR]: 'true' }),
      0,
    ];
  },
});

/**
 * FootnoteRef — inline atom that renders as a superscript footnote number.
 * Stores the footnote text so the content is self-contained in the HTML.
 */
const FootnoteRef = Node.create({
  name: 'footnoteRef',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      id: { default: '' },
      index: { default: 1 },
      content: { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'sup[data-footnote-ref]' }];
  },

  renderHTML({ node }) {
    return [
      'sup',
      mergeAttributes({
        'data-footnote-ref': 'true',
        'data-footnote-id': node.attrs.id,
        'data-footnote-content': node.attrs.content,
        'data-footnote-index': node.attrs.index,
        class: 'footnote-ref',
        title: node.attrs.content,
      }),
      String(node.attrs.index),
    ];
  },
});

// ---------------------------------------------------------------------------
// Upload helper
// ---------------------------------------------------------------------------

async function uploadImageToCloudinary(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/images', { method: 'POST', body: form });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || 'Image upload failed');
  }
  const { url } = await res.json() as { url: string };
  return url;
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface TiptapEditorHandle {
  /** Replace the entire editor content (does not emit an onChange event). */
  setContent: (html: string) => void;
  /** Return the current editor content as HTML. */
  getHTML: () => string;
  /** Focus the editor. */
  focus: () => void;
  /** Return the underlying ProseMirror contenteditable DOM element. */
  getEditorDOM: () => HTMLElement | null;
  /** Return the tiptap Editor instance. */
  getEditor: () => Editor | null;
  /** Remove all citation-highlight marks (called after the highlight timeout). */
  clearCitationHighlights: () => void;
}

export interface TiptapEditorProps {
  /** Initial / controlled HTML content. */
  content: string;
  /** Called on every edit with the new HTML string. */
  onChange: (html: string) => void;
  /**
   * Called when the selection changes inside the editor.
   * `rect` is the bounding box of the selection (null when collapsed or empty).
   */
  onSelectionChange?: (hasSelection: boolean, rect: DOMRect | null) => void;
  /** Called when the user copies text; receives the word count. */
  onTextCopied?: (wordCount: number) => void;
  /** Right-click handler forwarded from the parent page. */
  onContextMenu?: (e: React.MouseEvent) => void;
  /** Long-press touch handlers forwarded from the parent page. */
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchMove?: (e: React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
  // ---- toolbar special-action callbacks ----
  wordCount?: number;
  onMathClick?: () => void;
  onChartClick?: () => void;
  onRewriteClick?: () => void;
  onLitReviewClick?: () => void;
  citationCount?: number;
  /** Whether the rewrite panel is currently open (suppresses floating bar). */
  rewritePanelVisible?: boolean;
  /** Translation helper (same `t` used by the parent page). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: string, ...args: any[]) => string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toolbarBtn(active: boolean, extra?: string) {
  return cn(
    'cursor-pointer p-2 rounded-(--radius) transition-colors',
    'min-w-[44px] min-h-[44px] flex items-center justify-center',
    'toolbar-button border-2 border-transparent',
    active
      ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] border-[hsl(var(--border-strong))]'
      : 'hover:border-[hsl(var(--border-strong))]',
    extra,
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const TiptapEditor = forwardRef<TiptapEditorHandle, TiptapEditorProps>(
  (props, ref) => {
    const {
      content,
      onChange,
      onSelectionChange,
      onTextCopied,
      onContextMenu,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      wordCount = 0,
      onMathClick,
      onChartClick,
      onRewriteClick,
      onLitReviewClick,
      citationCount = 0,
      rewritePanelVisible = false,
      t,
    } = props;

    const prevContentRef = useRef<string>(content);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [imageUploadError, setImageUploadError] = useState<string | null>(null);
    const [linkModalOpen, setLinkModalOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [showTableMenu, setShowTableMenu] = useState(false);
    const [footnoteModalOpen, setFootnoteModalOpen] = useState(false);
    const [footnoteText, setFootnoteText] = useState('');

    // Shared upload handler — used by toolbar button, drag-drop, and paste
    const insertImageFile = useCallback(async (file: File, editorInstance: Editor) => {
      setIsUploadingImage(true);
      setImageUploadError(null);
      try {
        const url = await uploadImageToCloudinary(file);
        editorInstance.chain().focus().setImage({ src: url, alt: file.name }).run();
      } catch (err) {
        setImageUploadError(err instanceof Error ? err.message : 'Image upload failed');
        setTimeout(() => setImageUploadError(null), 4000);
      } finally {
        setIsUploadingImage(false);
      }
    }, []);

    const editor = useEditor({
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
        Underline,
        Superscript,
        Subscript,
        Link.configure({
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { class: 'text-[hsl(var(--secondary))] underline underline-offset-2 cursor-pointer' },
        }),
        Typography,
        Table.configure({ resizable: false }),
        TableRow,
        TableCell,
        TableHeader,
        TaskList,
        TaskItem.configure({ nested: true }),
        Image.configure({ inline: false, allowBase64: false }),
        MathBlock,
        CitationHighlight,
        FootnoteRef,
      ],
      content: content || '<p></p>',
      editorProps: {
        attributes: {
          class:
            'w-full min-h-[400px] p-4 focus:outline-none leading-relaxed prose prose-sm max-w-none',
          spellCheck: 'true',
        },
        handleKeyDown(_, event) {
          if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            setLinkModalOpen(v => !v);
            return true;
          }
          return false;
        },
        // Handle drag-and-drop of image files onto the editor
        handleDrop(view, event) {
          const files = Array.from(event.dataTransfer?.files ?? []);
          const imageFile = files.find(f => f.type.startsWith('image/'));
          if (!imageFile) return false;

          event.preventDefault();

          // Insert at the drop position
          const coords = { left: event.clientX, top: event.clientY };
          const pos = view.posAtCoords(coords);
          if (pos) view.dispatch(view.state.tr.setSelection(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).prosemirror?.Selection?.near?.(view.state.doc.resolve(pos.pos)) ?? view.state.selection
          ));

          // We need the editor instance; grab it via the view
          const editorInstance = (view as unknown as { editorView?: never } & { editor?: Editor }).editor;
          if (editorInstance) insertImageFile(imageFile, editorInstance);
          return true;
        },
        // Handle paste of image files / clipboard images
        handlePaste(view, event) {
          const items = Array.from(event.clipboardData?.items ?? []);
          const imageItem = items.find(i => i.type.startsWith('image/'));
          if (!imageItem) return false;

          const file = imageItem.getAsFile();
          if (!file) return false;

          event.preventDefault();
          const editorInstance = (view as unknown as { editor?: Editor }).editor;
          if (editorInstance) insertImageFile(file, editorInstance);
          return true;
        },
      },
      onUpdate: ({ editor: e }) => {
        const html = e.getHTML();
        prevContentRef.current = html;
        onChange(html);
      },
      onSelectionUpdate: ({ editor: e }) => {
        if (!onSelectionChange) return;
        const { from, to } = e.state.selection;
        const hasSelection = from !== to && e.state.selection instanceof TextSelection;
        if (hasSelection && !rewritePanelVisible) {
          const domSel = window.getSelection();
          if (domSel && domSel.rangeCount > 0) {
            const rect = domSel.getRangeAt(0).getBoundingClientRect();
            onSelectionChange(true, rect.width > 0 ? rect : null);
          } else {
            onSelectionChange(true, null);
          }
        } else {
          onSelectionChange(false, null);
        }
      },
    });

    // Expose imperative handle
    useImperativeHandle(
      ref,
      () => ({
        setContent: (html: string) => {
          if (editor) {
            editor.commands.setContent(html || '<p></p>', { emitUpdate: false });
            prevContentRef.current = html;
          }
        },
        getHTML: () => editor?.getHTML() ?? '',
        focus: () => { editor?.commands.focus(); },
        getEditorDOM: () => editor?.view?.dom ?? null,
        getEditor: () => editor ?? null,
        clearCitationHighlights: () => {
          editor?.chain().focus().unsetMark('citationHighlight').run();
        },
      }),
      [editor],
    );

    // Sync when the content prop changes from the parent (e.g. switching sections)
    useEffect(() => {
      if (!editor) return;
      if (content !== prevContentRef.current) {
        prevContentRef.current = content;
        editor.commands.setContent(content || '<p></p>', { emitUpdate: false });
      }
    }, [editor, content]);

    // Copy-event tracking (GA4)
    const handleCopyInternal = useCallback(() => {
      if (!onTextCopied) return;
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) return;
      const words = sel.toString().trim().split(/\s+/).filter(Boolean).length;
      if (words > 0) onTextCopied(words);
    }, [onTextCopied]);

    useEffect(() => {
      const dom = editor?.view?.dom;
      if (!dom) return;
      dom.addEventListener('copy', handleCopyInternal);
      return () => dom.removeEventListener('copy', handleCopyInternal);
    }, [editor, handleCopyInternal]);

    useEffect(() => {
      if (!showTableMenu) return;
      const close = () => setShowTableMenu(false);
      document.addEventListener('mousedown', close);
      return () => document.removeEventListener('mousedown', close);
    }, [showTableMenu]);

    const isLitReviewEnabled = citationCount >= 3;
    const hasSelection = editor
      ? !editor.state.selection.empty && editor.state.selection instanceof TextSelection
      : false;

    return (
      <div className="border-[3px] border-[hsl(var(--border-strong))] rounded-(--radius) bg-[hsl(var(--surface))]">
        {/* ---- Toolbar ---- */}
        <div className="sticky top-0 z-10 rounded-t-(--radius) border-b-[3px] border-[hsl(var(--border-strong))] p-2 md:p-3 flex items-center gap-1 md:gap-2 bg-[hsl(var(--surface-muted))] overflow-x-auto toolbar-container">

          {/* Undo / Redo */}
          <div className="flex items-center gap-1">
            <Tooltip label={t('undo')} shortcut="Ctrl+Z">
              <button
                onClick={() => editor?.chain().focus().undo().run()}
                disabled={!editor?.can().undo()}
                className={toolbarBtn(false)}
              >
                <Undo className="h-4 w-4" />
              </button>
            </Tooltip>
            <Tooltip label={t('redo')} shortcut="Ctrl+Shift+Z">
              <button
                onClick={() => editor?.chain().focus().redo().run()}
                disabled={!editor?.can().redo()}
                className={toolbarBtn(false)}
              >
                <Redo className="h-4 w-4" />
              </button>
            </Tooltip>
          </div>

          <div className="w-px h-6 bg-[hsl(var(--border-strong))] mx-1" />

          {/* Text formatting */}
          <div className="flex items-center gap-1">
            <Tooltip label={t('bold')} shortcut="Ctrl+B">
              <button
                onClick={() => editor?.chain().focus().toggleBold().run()}
                className={toolbarBtn(!!editor?.isActive('bold'))}
              >
                <Bold className="h-4 w-4" />
              </button>
            </Tooltip>
            <Tooltip label={t('italic')} shortcut="Ctrl+I">
              <button
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                className={toolbarBtn(!!editor?.isActive('italic'))}
              >
                <Italic className="h-4 w-4" />
              </button>
            </Tooltip>
            <Tooltip label={t('underline')} shortcut="Ctrl+U">
              <button
                onClick={() => editor?.chain().focus().toggleUnderline().run()}
                className={toolbarBtn(!!editor?.isActive('underline'))}
              >
                <UnderlineIcon className="h-4 w-4" />
              </button>
            </Tooltip>
            <Tooltip label={t('strikethrough')} description="Draw a line through selected text">
              <button
                onClick={() => editor?.chain().focus().toggleStrike().run()}
                className={toolbarBtn(!!editor?.isActive('strike'))}
              >
                <Strikethrough className="h-4 w-4" />
              </button>
            </Tooltip>
          </div>

          <div className="w-px h-6 bg-[hsl(var(--border-strong))] mx-1" />

          {/* Blockquote + Horizontal rule */}
          <div className="flex items-center gap-1">
            <Tooltip label={t('blockquote')} description="Indent and style a quotation from a source">
              <button
                onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                className={toolbarBtn(!!editor?.isActive('blockquote'))}
              >
                <Quote className="h-4 w-4" />
              </button>
            </Tooltip>
            <Tooltip label={t('horizontalRule')} description="Insert a horizontal line to divide sections">
              <button
                onClick={() => editor?.chain().focus().setHorizontalRule().run()}
                className={toolbarBtn(false)}
              >
                <Minus className="h-4 w-4" />
              </button>
            </Tooltip>
          </div>

          <div className="w-px h-6 bg-[hsl(var(--border-strong))] mx-1" />

          {/* Code — inline and block */}
          <div className="flex items-center gap-1">
            <Tooltip label={t('inlineCode')} shortcut="Ctrl+E" description="Format a word or phrase as code">
              <button
                onClick={() => editor?.chain().focus().toggleCode().run()}
                className={toolbarBtn(!!editor?.isActive('code'))}
              >
                <Code className="h-4 w-4" />
              </button>
            </Tooltip>
            <Tooltip label={t('codeBlock')} description="Multi-line preformatted code block">
              <button
                onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                className={toolbarBtn(!!editor?.isActive('codeBlock'))}
              >
                <Code2 className="h-4 w-4" />
              </button>
            </Tooltip>
          </div>

          <div className="w-px h-6 bg-[hsl(var(--border-strong))] mx-1" />

          {/* Lists */}
          <div className="flex items-center gap-1">
            <Tooltip label={t('bulletList')}>
              <button
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                className={toolbarBtn(!!editor?.isActive('bulletList'))}
              >
                <List className="h-4 w-4" />
              </button>
            </Tooltip>
            <Tooltip label={t('numberedList')}>
              <button
                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                className={toolbarBtn(!!editor?.isActive('orderedList'))}
              >
                <Hash className="h-4 w-4" />
              </button>
            </Tooltip>
            <Tooltip label={t('taskList')} description="Interactive checklist with checkboxes">
              <button
                onClick={() => editor?.chain().focus().toggleTaskList().run()}
                className={toolbarBtn(!!editor?.isActive('taskList'))}
              >
                <ListChecks className="h-4 w-4" />
              </button>
            </Tooltip>
          </div>

          <div className="w-px h-6 bg-[hsl(var(--border-strong))] mx-1" />

          {/* Headings */}
          <div className="flex items-center gap-1">
            {([1, 2, 3] as const).map((level) => {
              const descriptions = ['Major section title', 'Sub-section title', 'Minor heading'];
              const shortcuts = ['Ctrl+Alt+1', 'Ctrl+Alt+2', 'Ctrl+Alt+3'];
              return (
                <Tooltip key={level} label={t(`header${level}`)} shortcut={shortcuts[level - 1]} description={descriptions[level - 1]}>
                  <button
                    onClick={() => editor?.chain().focus().toggleHeading({ level }).run()}
                    className={toolbarBtn(!!editor?.isActive('heading', { level }))}
                  >
                    <span className="text-sm font-bold">H{level}</span>
                  </button>
                </Tooltip>
              );
            })}
            <Tooltip label={t('normalText')} shortcut="Ctrl+Alt+0">
              <button
                onClick={() => editor?.chain().focus().setParagraph().run()}
                className={toolbarBtn(!!editor?.isActive('paragraph') && !editor?.isActive('heading'))}
              >
                <span className="text-sm font-medium">{t('normal')}</span>
              </button>
            </Tooltip>
          </div>

          <div className="w-px h-6 bg-[hsl(var(--border-strong))] mx-1" />

          {/* Superscript / Subscript */}
          <div className="flex items-center gap-1">
            <Tooltip label={t('superscript')} description="Raised text — footnote refs, exponents (x²)">
              <button
                onClick={() => editor?.chain().focus().toggleSuperscript().run()}
                className={toolbarBtn(!!editor?.isActive('superscript'))}
              >
                <SuperscriptIcon className="h-4 w-4" />
              </button>
            </Tooltip>
            <Tooltip label={t('subscript')} description="Lowered text — chemical formulas (H₂O)">
              <button
                onClick={() => editor?.chain().focus().toggleSubscript().run()}
                className={toolbarBtn(!!editor?.isActive('subscript'))}
              >
                <SubscriptIcon className="h-4 w-4" />
              </button>
            </Tooltip>
          </div>

          <div className="w-px h-6 bg-[hsl(var(--border-strong))] mx-1" />

          {/* Link */}
          <div className="flex items-center gap-1">
            <Tooltip
              label={editor?.isActive('link') ? t('removeLink') : t('insertLink')}
              shortcut={editor?.isActive('link') ? undefined : 'Ctrl+K'}
              description={editor?.isActive('link') ? 'Unlink the selected text' : 'Add a hyperlink to selected text'}
            >
              <button
                onClick={() => {
                  if (editor?.isActive('link')) {
                    editor.chain().focus().unsetLink().run();
                  } else {
                    setLinkUrl(editor?.getAttributes('link').href || '');
                    setLinkModalOpen(true);
                  }
                }}
                className={toolbarBtn(!!editor?.isActive('link'))}
              >
                {editor?.isActive('link') ? <Link2Off className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
              </button>
            </Tooltip>
          </div>

          <div className="w-px h-6 bg-[hsl(var(--border-strong))] mx-1" />

          {/* Table */}
          <div className="relative flex items-center">
            <Tooltip label={t('insertTable')} description="Insert a table for structured data">
            <button
              onClick={() => setShowTableMenu(v => !v)}
              className={toolbarBtn(!!editor?.isActive('table'))}
            >
              <TableIcon className="h-4 w-4" />
            </button>
            </Tooltip>
            {showTableMenu && (
              <div className="absolute top-full left-0 mt-1 z-20 bg-[hsl(var(--surface))] border-2 border-[hsl(var(--border-strong))] rounded-(--radius) shadow-lg p-1 min-w-[160px]">
                {!editor?.isActive('table') ? (
                  <button
                    onClick={() => { editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); setShowTableMenu(false); }}
                    className="w-full text-left px-3 py-2 text-xs uppercase tracking-[0.14em] hover:bg-[hsl(var(--surface-muted))] rounded-(--radius) flex items-center gap-2"
                  >
                    <Plus className="h-3 w-3" /> {t('table.insert')}
                  </button>
                ) : (
                  <>
                    <button onClick={() => { editor?.chain().focus().addRowAfter().run(); setShowTableMenu(false); }} className="w-full text-left px-3 py-2 text-xs uppercase tracking-[0.14em] hover:bg-[hsl(var(--surface-muted))] rounded-(--radius)">{t('table.addRowAfter')}</button>
                    <button onClick={() => { editor?.chain().focus().addColumnAfter().run(); setShowTableMenu(false); }} className="w-full text-left px-3 py-2 text-xs uppercase tracking-[0.14em] hover:bg-[hsl(var(--surface-muted))] rounded-(--radius)">{t('table.addColumnAfter')}</button>
                    <button onClick={() => { editor?.chain().focus().deleteRow().run(); setShowTableMenu(false); }} className="w-full text-left px-3 py-2 text-xs uppercase tracking-[0.14em] hover:bg-[hsl(var(--surface-muted))] rounded-(--radius) text-[hsl(var(--destructive))]">{t('table.deleteRow')}</button>
                    <button onClick={() => { editor?.chain().focus().deleteColumn().run(); setShowTableMenu(false); }} className="w-full text-left px-3 py-2 text-xs uppercase tracking-[0.14em] hover:bg-[hsl(var(--surface-muted))] rounded-(--radius) text-[hsl(var(--destructive))]">{t('table.deleteColumn')}</button>
                    <button onClick={() => { editor?.chain().focus().deleteTable().run(); setShowTableMenu(false); }} className="w-full text-left px-3 py-2 text-xs uppercase tracking-[0.14em] hover:bg-[hsl(var(--surface-muted))] rounded-(--radius) text-[hsl(var(--destructive))]">{t('table.delete')}</button>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-[hsl(var(--border-strong))] mx-1" />

          {/* Footnote */}
          <Tooltip label={t('insertFootnote')} description="Insert a numbered inline footnote">
            <button
              onClick={() => { setFootnoteText(''); setFootnoteModalOpen(true); }}
              className={toolbarBtn(false)}
            >
              <FileText className="h-4 w-4" />
            </button>
          </Tooltip>

          <div className="w-px h-6 bg-[hsl(var(--border-strong))] mx-1" />

          {/* Custom action buttons */}
          <div className="flex items-center gap-1">
            {/* Image upload */}
            <Tooltip label={t('insertImage')} description="Upload or drag-and-drop an image">
              <button
                onClick={() => imageInputRef.current?.click()}
                disabled={isUploadingImage}
                className={toolbarBtn(false)}
              >
                {isUploadingImage
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <ImageIcon className="h-4 w-4" />
                }
              </button>
            </Tooltip>
            {/* Hidden file input */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file && editor) await insertImageFile(file, editor);
              }}
            />

            {onMathClick && (
              <Tooltip label={t('insertMathEquation')} description="Insert a LaTeX formula (∑, ∫, α, β)">
                <button onClick={onMathClick} className={toolbarBtn(false)}>
                  <Calculator className="h-4 w-4" />
                </button>
              </Tooltip>
            )}
            {onChartClick && (
              <Tooltip label={t('insertChart')} description="Insert a data visualization chart">
                <button onClick={onChartClick} className={toolbarBtn(false)}>
                  <BarChart3 className="h-4 w-4" />
                </button>
              </Tooltip>
            )}
            {onRewriteClick && (
              <>
                <div className="w-px h-6 bg-[hsl(var(--border-strong))] mx-1" />
                <Tooltip
                  label={t('rewriteWithAI')}
                  description={hasSelection ? 'Rewrite or improve the selected text' : 'Select text first to rewrite'}
                >
                  <button
                    onClick={onRewriteClick}
                    disabled={!hasSelection}
                    className={cn(
                      'cursor-pointer p-2 rounded-(--radius) transition-colors',
                      'min-w-[44px] min-h-[44px] flex items-center justify-center',
                      'toolbar-button border-2 border-transparent',
                      hasSelection
                        ? 'hover:border-[hsl(var(--border-strong))] text-[hsl(var(--primary))]'
                        : 'opacity-40 cursor-not-allowed',
                    )}
                  >
                    <Sparkles className="h-4 w-4" />
                  </button>
                </Tooltip>
              </>
            )}
            {onLitReviewClick && (
              <>
                <div className="w-px h-6 bg-[hsl(var(--border-strong))] mx-1" />
                <Tooltip
                  label={t('litReview.toolbarButton')}
                  description={isLitReviewEnabled ? 'Generate a literature review from your citations' : 'Add 3+ citations to unlock'}
                >
                  <button
                    onClick={onLitReviewClick}
                    disabled={!isLitReviewEnabled}
                    className={cn(
                      'cursor-pointer p-2 rounded-(--radius) transition-colors',
                      'min-w-[44px] min-h-[44px] flex items-center justify-center',
                      'toolbar-button border-2 border-transparent',
                      isLitReviewEnabled
                        ? 'hover:border-[hsl(var(--border-strong))] text-[hsl(var(--secondary))]'
                        : 'opacity-40 cursor-not-allowed',
                    )}
                  >
                    <BookOpen className="h-4 w-4" />
                  </button>
                </Tooltip>
              </>
            )}
          </div>

          <div className="flex-1" />
          <span className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))] font-semibold">
            {wordCount} {t('words')}
          </span>
        </div>

        {/* Upload error toast */}
        {imageUploadError && (
          <div className="px-4 py-2 bg-[hsl(var(--destructive))]/10 border-b border-[hsl(var(--destructive))]/30 text-xs text-[hsl(var(--destructive))] uppercase tracking-[0.18em]">
            {imageUploadError}
          </div>
        )}

        {/* Link modal */}
        {linkModalOpen && (
          <div className="border-b-[3px] border-[hsl(var(--border-strong))] px-4 py-3 bg-[hsl(var(--surface-muted))] flex items-center gap-3">
            <Link2 className="h-4 w-4 shrink-0 text-[hsl(var(--muted-foreground))]" />
            <input
              autoFocus
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const url = linkUrl.trim();
                  if (url) editor?.chain().focus().setLink({ href: url.startsWith('http') ? url : `https://${url}` }).run();
                  setLinkModalOpen(false);
                  setLinkUrl('');
                } else if (e.key === 'Escape') {
                  setLinkModalOpen(false);
                  setLinkUrl('');
                }
              }}
              placeholder={t('linkPlaceholder')}
              className="flex-1 text-sm bg-transparent outline-none border-b-2 border-[hsl(var(--border-strong))] focus:border-[hsl(var(--secondary))] pb-0.5 text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]"
            />
            <button
              onClick={() => {
                const url = linkUrl.trim();
                if (url) editor?.chain().focus().setLink({ href: url.startsWith('http') ? url : `https://${url}` }).run();
                setLinkModalOpen(false);
                setLinkUrl('');
              }}
              className="text-xs uppercase tracking-[0.18em] font-semibold text-[hsl(var(--secondary))] hover:opacity-80"
            >
              {t('apply')}
            </button>
            <button
              onClick={() => { setLinkModalOpen(false); setLinkUrl(''); }}
              className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] hover:opacity-80"
            >
              {t('cancel')}
            </button>
          </div>
        )}

        {/* Footnote modal */}
        {footnoteModalOpen && (
          <div className="border-b-[3px] border-[hsl(var(--border-strong))] px-4 py-3 bg-[hsl(var(--surface-muted))] flex items-center gap-3">
            <FileText className="h-4 w-4 shrink-0 text-[hsl(var(--muted-foreground))]" />
            <input
              autoFocus
              type="text"
              value={footnoteText}
              onChange={(e) => setFootnoteText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const text = footnoteText.trim();
                  if (text && editor) {
                    const html = editor.getHTML();
                    const existingRefs = (html.match(/data-footnote-ref="true"/g) || []).length;
                    const index = existingRefs + 1;
                    const id = `fn-${Date.now()}`;
                    editor.chain().focus().insertContent({
                      type: 'footnoteRef',
                      attrs: { id, index, content: text },
                    }).run();
                  }
                  setFootnoteModalOpen(false);
                  setFootnoteText('');
                } else if (e.key === 'Escape') {
                  setFootnoteModalOpen(false);
                  setFootnoteText('');
                }
              }}
              placeholder={t('footnotePlaceholder')}
              className="flex-1 text-sm bg-transparent outline-none border-b-2 border-[hsl(var(--border-strong))] focus:border-[hsl(var(--secondary))] pb-0.5 text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]"
            />
            <button
              onClick={() => {
                const text = footnoteText.trim();
                if (text && editor) {
                  const html = editor.getHTML();
                  const existingRefs = (html.match(/data-footnote-ref="true"/g) || []).length;
                  const index = existingRefs + 1;
                  const id = `fn-${Date.now()}`;
                  editor.chain().focus().insertContent({
                    type: 'footnoteRef',
                    attrs: { id, index, content: text },
                  }).run();
                }
                setFootnoteModalOpen(false);
                setFootnoteText('');
              }}
              className="text-xs uppercase tracking-[0.18em] font-semibold text-[hsl(var(--secondary))] hover:opacity-80"
            >
              {t('apply')}
            </button>
            <button
              onClick={() => { setFootnoteModalOpen(false); setFootnoteText(''); }}
              className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))] hover:opacity-80"
            >
              {t('cancel')}
            </button>
          </div>
        )}

        {/* ---- Editor content ---- */}
        <div className="rounded-b-(--radius) overflow-hidden">
          <EditorContent
            editor={editor}
            onContextMenu={onContextMenu}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          />
        </div>
      </div>
    );
  },
);

TiptapEditor.displayName = 'TiptapEditor';
export default TiptapEditor;
