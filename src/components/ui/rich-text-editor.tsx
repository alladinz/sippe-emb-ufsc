"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Bold, ListOrdered, Type } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RichTextEditorProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    onValueChange?: (value: string) => void;
}

export const RichTextEditor = React.forwardRef<HTMLTextAreaElement, RichTextEditorProps>(
    ({ className, value, onChange, onValueChange, ...props }, ref) => {
        const internalRef = React.useRef<HTMLTextAreaElement | null>(null);

        // Merge refs
        React.useImperativeHandle(ref, () => internalRef.current!);

        const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            onChange?.(e);
            onValueChange?.(e.target.value);
        };

        const updateValue = (newValue: string, newSelectionStart: number, newSelectionEnd: number) => {
            if (!internalRef.current) return;
            
            // Set value and trigger changes
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
            nativeInputValueSetter?.call(internalRef.current, newValue);
            
            const event = new Event("input", { bubbles: true });
            internalRef.current.dispatchEvent(event);

            // Restore selection
            setTimeout(() => {
                if (internalRef.current) {
                    internalRef.current.focus();
                    internalRef.current.setSelectionRange(newSelectionStart, newSelectionEnd);
                }
            }, 0);
        };

        const handleBold = () => {
            if (!internalRef.current) return;
            const textarea = internalRef.current;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = textarea.value;
            const selectedText = text.substring(start, end);

            const before = text.substring(0, start);
            const after = text.substring(end);

            if (selectedText.startsWith("**") && selectedText.endsWith("**")) {
                // Remove bold
                const unbolded = selectedText.substring(2, selectedText.length - 2);
                updateValue(before + unbolded + after, start, start + unbolded.length);
            } else {
                // Add bold
                updateValue(before + "**" + selectedText + "**" + after, start, end + 4);
            }
        };

        const handleTabNumbering = (isShift: boolean) => {
            if (!internalRef.current) return;
            const textarea = internalRef.current;
            const start = textarea.selectionStart;
            const text = textarea.value;

            // Find start of current line
            const lastNewLine = text.lastIndexOf("\n", start - 1);
            const lineStart = lastNewLine === -1 ? 0 : lastNewLine + 1;
            const lineEnd = text.indexOf("\n", start);
            const currentLine = text.substring(lineStart, lineEnd === -1 ? text.length : lineEnd);

            // Regex for matching numbers like "1.", "1.1.", "10.2.3."
            const numberMatch = currentLine.match(/^(\s*)(\d+(\.\d+)*)\.?\s(.*)$/);

            if (numberMatch) {
                const [fullLine, whitespace, numbers, lastPart, content] = numberMatch;
                const segments = numbers.split(".");
                
                let newNumbers = "";
                if (isShift) {
                    // Un-nest: 1.1 -> 2 (or 1.1 -> 1 if it's the only sub)
                    // For simplicity, we just remove the last segment if possible
                    if (segments.length > 1) {
                        newNumbers = segments.slice(0, -1).join(".");
                    } else {
                        return; // Already top level
                    }
                } else {
                    // Nest: 1 -> 1.1
                    newNumbers = `${numbers}.1`;
                }

                const newLine = `${whitespace}${newNumbers}. ${content}`;
                const newFullText = text.substring(0, lineStart) + newLine + (lineEnd === -1 ? "" : text.substring(lineEnd));
                
                const diff = newLine.length - currentLine.length;
                updateValue(newFullText, start + diff, start + diff);
            }
        };

        const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            // Bold Shortcut (Ctrl+B or Cmd+B)
            if ((e.ctrlKey || e.metaKey) && e.key === "b") {
                e.preventDefault();
                handleBold();
            }

            // Tab Numbering logic
            if (e.key === "Tab") {
                e.preventDefault();
                handleTabNumbering(e.shiftKey);
            }
        };

        return (
            <div className="flex flex-col w-full border border-input rounded-md bg-transparent overflow-hidden focus-within:ring-1 focus-within:ring-ring/50 focus-within:border-ring transition-all">
                <div className="flex items-center gap-1 p-1.5 border-b bg-slate-50/50">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-slate-600 hover:text-brand-blue hover:bg-brand-light/10"
                        onClick={handleBold}
                        title="Negrito (Ctrl+B)"
                    >
                        <Bold className="w-3.5 h-3.5" />
                    </Button>
                    <div className="w-px h-4 bg-slate-200 mx-1" />
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-slate-600 hover:text-brand-blue hover:bg-brand-light/10"
                        onClick={() => handleTabNumbering(false)}
                        title="Aumentar Nível (Tab)"
                    >
                        <ListOrdered className="w-3.5 h-3.5" />
                    </Button>
                    <div className="flex-1" />
                    <span className="text-[10px] text-slate-400 font-medium px-2 flex items-center gap-1.5">
                        <Type className="w-3 h-3" />
                        Suporta Negrito e Listas (Tab)
                    </span>
                </div>
                <textarea
                    ref={internalRef}
                    className={cn(
                        "flex min-h-[120px] w-full bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-none focus:ring-0",
                        className
                    )}
                    onKeyDown={onKeyDown}
                    onChange={handleChange}
                    value={value}
                    {...props}
                />
            </div>
        );
    }
);

RichTextEditor.displayName = "RichTextEditor";
