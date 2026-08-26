"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Extension } from "@tiptap/core";
import { Bold, Italic, List, ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import React from "react";

interface TiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function TiptapEditor({
  value,
  onChange,
  placeholder,
  className,
  disabled,
}: TiptapEditorProps) {

  const TabHandler = React.useMemo(() => Extension.create({
    name: 'tabHandler',
    addKeyboardShortcuts() {
      return {
        Tab: () => this.editor.commands.sinkListItem('listItem'),
        'Shift-Tab': () => this.editor.commands.liftListItem('listItem'),
      };
    },
  }), []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || "Digite aqui...",
      }),
      TabHandler,
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });

  // Update content if value prop changes externally
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn(
      "flex flex-col w-full border border-input rounded-md bg-white overflow-hidden focus-within:ring-1 focus-within:ring-ring/50 focus-within:border-ring transition-all",
      disabled && "opacity-50 cursor-not-allowed bg-slate-50",
      className
    )}>
      {!disabled && (
        <div className="flex items-center gap-1 p-1 border-b bg-slate-50/50">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn("h-8 w-8 p-0", editor.isActive("bold") && "bg-slate-200 text-brand-blue")}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Negrito"
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn("h-8 w-8 p-0", editor.isActive("italic") && "bg-slate-200 text-brand-blue")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Itálico"
          >
            <Italic className="w-4 h-4" />
          </Button>
          <div className="w-px h-4 bg-slate-200 mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn("h-8 w-8 p-0", editor.isActive("bulletList") && "bg-slate-200 text-brand-blue")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Lista com Marcadores"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn("h-8 w-8 p-0", editor.isActive("orderedList") && "bg-slate-200 text-brand-blue")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Lista Numerada"
          >
            <ListOrdered className="w-4 h-4" />
          </Button>
        </div>
      )}
      <EditorContent 
        editor={editor} 
        className="prose prose-sm max-w-none focus:outline-none min-h-[150px] px-3 py-2 overflow-y-auto"
      />
      <style jsx global>{`
        .ProseMirror {
          min-height: 150px;
          outline: none;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        
        /* Bullets */
        .ProseMirror ul {
          list-style-type: disc !important;
          padding-left: 2rem !important;
        }
        
        /* CSS Counters for nested numbered lists (1.1, 1.2, etc.) */
        .ProseMirror ol {
          counter-reset: item;
          list-style-type: none !important;
          padding-left: 2rem !important;
        }
        .ProseMirror ol > li {
          display: block;
          position: relative;
        }
        .ProseMirror ol > li::before {
          content: counters(item, ".") ". ";
          counter-increment: item;
          position: absolute;
          right: 100%;
          padding-right: 0.5rem;
          font-weight: 500;
          text-align: right;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}
