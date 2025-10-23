'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useCallback, useEffect, useState } from 'react';
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
} from 'lexical';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading2,
  Quote,
  Undo,
  Redo,
  Sparkles,
  Link as LinkIcon,
} from 'lucide-react';

export default function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
    }
  }, []);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  const formatText = (format: 'bold' | 'italic' | 'underline') => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const undo = () => {
    editor.dispatchCommand(UNDO_COMMAND, undefined);
  };

  const redo = () => {
    editor.dispatchCommand(REDO_COMMAND, undefined);
  };

  return (
    <div className="flex items-center gap-1 p-2 border-b border-gray-200 flex-wrap">
      {/* Undo/Redo */}
      <button
        onClick={undo}
        className="p-2 hover:bg-gray-100 rounded transition-colors"
        title="Undo"
      >
        <Undo size={18} />
      </button>
      <button
        onClick={redo}
        className="p-2 hover:bg-gray-100 rounded transition-colors"
        title="Redo"
      >
        <Redo size={18} />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Text Formatting */}
      <button
        onClick={() => formatText('bold')}
        className={`p-2 rounded transition-colors ${
          isBold ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100'
        }`}
        title="Bold"
      >
        <Bold size={18} />
      </button>
      <button
        onClick={() => formatText('italic')}
        className={`p-2 rounded transition-colors ${
          isItalic ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100'
        }`}
        title="Italic"
      >
        <Italic size={18} />
      </button>
      <button
        onClick={() => formatText('underline')}
        className={`p-2 rounded transition-colors ${
          isUnderline ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100'
        }`}
        title="Underline"
      >
        <Underline size={18} />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Heading */}
      <button
        className="p-2 hover:bg-gray-100 rounded transition-colors"
        title="Heading"
      >
        <Heading2 size={18} />
      </button>

      {/* Lists */}
      <button
        className="p-2 hover:bg-gray-100 rounded transition-colors"
        title="Bullet List"
      >
        <List size={18} />
      </button>
      <button
        className="p-2 hover:bg-gray-100 rounded transition-colors"
        title="Numbered List"
      >
        <ListOrdered size={18} />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      {/* Quote */}
      <button
        className="p-2 hover:bg-gray-100 rounded transition-colors"
        title="Quote"
      >
        <Quote size={18} />
      </button>

      {/* Link */}
      <button
        className="p-2 hover:bg-gray-100 rounded transition-colors"
        title="Add Link"
      >
        <LinkIcon size={18} />
      </button>

      <div className="flex-1" />

      {/* AI Write Button */}
      <button
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-accent-purple text-white rounded-lg hover:shadow-md transition-all"
        title="AI Write"
      >
        <Sparkles size={18} />
        <span className="text-sm font-medium">AI Write</span>
      </button>
    </div>
  );
}

