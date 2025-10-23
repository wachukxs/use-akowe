'use client';

import { useEffect, useState, useRef } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { LinkNode } from '@lexical/link';
import { EditorState, $getRoot, $createParagraphNode, $createTextNode } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import ToolbarPlugin from './ToolbarPlugin';

interface LexicalEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
}

// Plugin to handle initial content
function InitialContentPlugin({ initialContent }: { initialContent?: string }) {
  const [editor] = useLexicalComposerContext();
  const [lastContent, setLastContent] = useState(initialContent);

  useEffect(() => {
    if (initialContent && initialContent !== lastContent) {
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        
        try {
          // Try to parse as Lexical JSON first
          const parsedContent = JSON.parse(initialContent);
          if (parsedContent && parsedContent.root) {
            // This is Lexical JSON format - let Lexical handle it
            const editorState = editor.parseEditorState(parsedContent);
            editor.setEditorState(editorState);
            setLastContent(initialContent);
            return;
          }
        } catch (e) {
          // Not JSON, treat as plain text
        }
        
        // Parse as plain text content
        const lines = initialContent.split('\n');
        lines.forEach((line, index) => {
          if (line.trim()) {
            const paragraph = $createParagraphNode();
            
            // Check if line starts with # for headings
            if (line.startsWith('# ')) {
              const heading = $createTextNode(line.substring(2));
              heading.setFormat('bold');
              paragraph.append(heading);
            } else if (line.startsWith('## ')) {
              const heading = $createTextNode(line.substring(3));
              heading.setFormat('bold');
              paragraph.append(heading);
            } else {
              const text = $createTextNode(line);
              paragraph.append(text);
            }
            
            root.append(paragraph);
          }
        });
      });
      setLastContent(initialContent);
    }
  }, [editor, initialContent, lastContent]);

  return null;
}

const theme = {
  paragraph: 'mb-4 text-gray-900 leading-relaxed',
  heading: {
    h1: 'text-3xl font-bold mb-4 text-gray-900',
    h2: 'text-2xl font-bold mb-3 text-gray-900',
    h3: 'text-xl font-semibold mb-2 text-gray-900',
  },
  list: {
    ul: 'list-disc ml-6 mb-4',
    ol: 'list-decimal ml-6 mb-4',
    listitem: 'mb-1',
  },
  text: {
    bold: 'font-semibold',
    italic: 'italic',
    underline: 'underline',
  },
  link: 'text-primary hover:underline cursor-pointer',
};

export default function LexicalEditor({ initialContent, onChange, placeholder = 'Start writing...' }: LexicalEditorProps) {
  const [isMounted, setIsMounted] = useState(false);
  const contentRef = useRef(initialContent);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update content ref when initialContent changes
  useEffect(() => {
    contentRef.current = initialContent;
  }, [initialContent]);

  const initialConfig = {
    namespace: 'AkoweEditor',
    theme,
    onError: (error: Error) => {
      console.error('Lexical error:', error);
    },
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      LinkNode,
    ],
  };

  const handleChange = (editorState: EditorState) => {
    editorState.read(() => {
      const json = JSON.stringify(editorState.toJSON());
      onChange?.(json);
    });
  };

  if (!isMounted) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading editor...</div>
      </div>
    );
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="relative bg-white rounded-lg border border-gray-200">
        <ToolbarPlugin />
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="min-h-[400px] px-6 py-4 focus:outline-none prose max-w-none" />
            }
            placeholder={
              <div className="absolute top-4 left-6 text-gray-400 pointer-events-none">
                {placeholder}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <OnChangePlugin onChange={handleChange} />
        <InitialContentPlugin initialContent={contentRef.current} />
      </div>
    </LexicalComposer>
  );
}

