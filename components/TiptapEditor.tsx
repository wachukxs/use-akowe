'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import { Node, Mark, mergeAttributes } from '@tiptap/core';
import { forwardRef, useImperativeHandle, useEffect, useRef, useCallback, useState } from 'react';
import type { Editor } from '@tiptap/core';
import {
  Bold, Italic, Underline as UnderlineIcon, List, Hash,
  Undo, Redo, Calculator, BarChart3, Sparkles, BookOpen, ImageIcon, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CITATION_HIGHLIGHT_ATTR, CITATION_HIGHLIGHT_CLASS } from '@/lib/citation-highlight';

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
        Image.configure({ inline: false, allowBase64: false }),
        MathBlock,
        CitationHighlight,
      ],
      content: content || '<p></p>',
      editorProps: {
        attributes: {
          class:
            'w-full min-h-[400px] p-4 focus:outline-none leading-relaxed prose prose-sm max-w-none',
          spellCheck: 'true',
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
        const hasSelection = from !== to;
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

    const isLitReviewEnabled = citationCount >= 3;
    const hasSelection = editor ? !editor.state.selection.empty : false;

    return (
      <div className="border-[3px] border-[hsl(var(--border-strong))] rounded-(--radius) overflow-hidden bg-[hsl(var(--surface))]">
        {/* ---- Toolbar ---- */}
        <div className="border-b-[3px] border-[hsl(var(--border-strong))] p-2 md:p-3 flex items-center gap-1 md:gap-2 bg-[hsl(var(--surface-muted))] overflow-x-auto toolbar-container">

          {/* Undo / Redo */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => editor?.chain().focus().undo().run()}
              disabled={!editor?.can().undo()}
              className={toolbarBtn(false)}
              title={t('undo')}
            >
              <Undo className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor?.chain().focus().redo().run()}
              disabled={!editor?.can().redo()}
              className={toolbarBtn(false)}
              title={t('redo')}
            >
              <Redo className="h-4 w-4" />
            </button>
          </div>

          <div className="w-px h-6 bg-[hsl(var(--border-strong))] mx-1" />

          {/* Text formatting */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={toolbarBtn(!!editor?.isActive('bold'))}
              title={t('bold')}
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={toolbarBtn(!!editor?.isActive('italic'))}
              title="Italic (Ctrl+I)"
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              className={toolbarBtn(!!editor?.isActive('underline'))}
              title={t('underline')}
            >
              <UnderlineIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="w-px h-6 bg-[hsl(var(--border-strong))] mx-1" />

          {/* Lists */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              className={toolbarBtn(!!editor?.isActive('bulletList'))}
              title={t('bulletList')}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              className={toolbarBtn(!!editor?.isActive('orderedList'))}
              title={t('numberedList')}
            >
              <Hash className="h-4 w-4" />
            </button>
          </div>

          <div className="w-px h-6 bg-[hsl(var(--border-strong))] mx-1" />

          {/* Headings */}
          <div className="flex items-center gap-1">
            {([1, 2, 3] as const).map((level) => (
              <button
                key={level}
                onClick={() => editor?.chain().focus().toggleHeading({ level }).run()}
                className={toolbarBtn(!!editor?.isActive('heading', { level }))}
                title={t(`header${level}`)}
              >
                <span className="text-sm font-bold">H{level}</span>
              </button>
            ))}
            <button
              onClick={() => editor?.chain().focus().setParagraph().run()}
              className={toolbarBtn(!!editor?.isActive('paragraph') && !editor?.isActive('heading'))}
              title={t('normalText')}
            >
              <span className="text-sm font-medium">{t('normal')}</span>
            </button>
          </div>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Custom action buttons */}
          <div className="flex items-center gap-1">
            {/* Image upload */}
            <button
              onClick={() => imageInputRef.current?.click()}
              disabled={isUploadingImage}
              className={toolbarBtn(false)}
              title={t('insertImage')}
            >
              {isUploadingImage
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <ImageIcon className="h-4 w-4" />
              }
            </button>
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
              <button
                onClick={onMathClick}
                className={toolbarBtn(false)}
                title={t('insertMathEquation')}
              >
                <Calculator className="h-4 w-4" />
              </button>
            )}
            {onChartClick && (
              <button
                onClick={onChartClick}
                className={toolbarBtn(false)}
                title={t('insertChart')}
              >
                <BarChart3 className="h-4 w-4" />
              </button>
            )}
            {onRewriteClick && (
              <>
                <div className="w-px h-6 bg-[hsl(var(--border-strong))] mx-1" />
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
                  title={t('rewriteWithAI')}
                >
                  <Sparkles className="h-4 w-4" />
                </button>
              </>
            )}
            {onLitReviewClick && (
              <>
                <div className="w-px h-6 bg-[hsl(var(--border-strong))] mx-1" />
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
                  title={
                    isLitReviewEnabled
                      ? t('litReview.toolbarButton')
                      : t('litReview.toolbarDisabled')
                  }
                >
                  <BookOpen className="h-4 w-4" />
                </button>
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

        {/* ---- Editor content ---- */}
        <EditorContent
          editor={editor}
          onContextMenu={onContextMenu}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        />
      </div>
    );
  },
);

TiptapEditor.displayName = 'TiptapEditor';
export default TiptapEditor;
