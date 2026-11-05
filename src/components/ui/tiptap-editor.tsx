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
      "flex flex-col w-full border border-slate-200/90 rounded-xl bg-white overflow-hidden transition-all duration-150 focus-within:border-[#023E8A] focus-within:ring-2 focus-within:ring-[#023E8A]/15 shadow-2xs",
      disabled && "opacity-60 cursor-not-allowed bg-slate-50",
      className
    )}>
      {!disabled && (
        <div className="flex items-center gap-1 px-2 py-1.5 border-b border-slate-100 bg-slate-50/70">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 w-7 p-0 rounded-md transition-all duration-150",
              editor.isActive("bold")
                ? "bg-[#EAF2FE] text-[#023E8A] hover:bg-[#EAF2FE] hover:text-[#023E8A] font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            )}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Negrito (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 w-7 p-0 rounded-md transition-all duration-150",
              editor.isActive("italic")
                ? "bg-[#EAF2FE] text-[#023E8A] hover:bg-[#EAF2FE] hover:text-[#023E8A] font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            )}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Itálico (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </Button>
          <div className="w-px h-3.5 bg-slate-200 mx-1" aria-hidden="true" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 w-7 p-0 rounded-md transition-all duration-150",
              editor.isActive("bulletList")
                ? "bg-[#EAF2FE] text-[#023E8A] hover:bg-[#EAF2FE] hover:text-[#023E8A] font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            )}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Lista com Marcadores"
          >
            <List className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 w-7 p-0 rounded-md transition-all duration-150",
              editor.isActive("orderedList")
                ? "bg-[#EAF2FE] text-[#023E8A] hover:bg-[#EAF2FE] hover:text-[#023E8A] font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            )}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Lista Numerada Multinível"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none focus:outline-none min-h-[160px] px-3.5 py-3 overflow-y-auto"
      />
      <style jsx global>{`
        .ProseMirror {
          min-height: 160px;
          outline: none;
          font-family: inherit;
          color: #1e293b;
          line-height: 1.625;
          font-size: 0.875rem;
        }
        .ProseMirror p {
          margin-bottom: 0.75rem;
        }
        .ProseMirror p:last-child {
          margin-bottom: 0;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #94a3b8;
          font-style: italic;
          pointer-events: none;
          height: 0;
        }

        /* Bullets */
        .ProseMirror ul {
          list-style-type: disc !important;
          padding-left: 1.75rem !important;
          margin-top: 0.5rem;
          margin-bottom: 0.75rem;
        }
        .ProseMirror ul > li {
          margin-bottom: 0.25rem;
        }

        /* CSS Counters for nested numbered lists (1.1, 1.2, etc.) */
        .ProseMirror ol {
          counter-reset: item;
          list-style-type: none !important;
          padding-left: 1.75rem !important;
          margin-top: 0.5rem;
          margin-bottom: 0.75rem;
        }
        .ProseMirror ol > li {
          display: block;
          position: relative;
          margin-bottom: 0.25rem;
        }
        .ProseMirror ol > li::before {
          content: counters(item, ".") ". ";
          counter-increment: item;
          position: absolute;
          right: 100%;
          padding-right: 0.5rem;
          font-weight: 600;
          color: #023E8A;
          text-align: right;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}
