import React, { useRef } from 'react';
import { Trash2 as TrashIcon } from 'lucide-react';
import {
  extractTitleAndBold,
  parseBoldMarkers,
  stripBoldMarkers,
} from '../../utils/bibliografiaUtils';
import type { BibliografiaItem } from '../../types/programaEnsino';

interface BibliografiaItemEditorProps {
  item:       BibliografiaItem;
  isReadOnly: boolean;
  onChange:   (id: string, value: string) => void;
  onRemove:   (id: string) => void;
}

export function BibliografiaItemEditor({
  item, isReadOnly, onChange, onRemove,
}: BibliografiaItemEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Apply auto-bold to selected text or auto-detect ──
  const handleBoldToggle = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end   = textarea.selectionEnd;
    const value = item.referencia;

    if (start !== end) {
      // TEXT IS SELECTED — wrap selection in **...**
      const before   = value.substring(0, start);
      const selected = value.substring(start, end);
      const after    = value.substring(end);

      // Check if already bold — toggle off if so
      if (selected.startsWith('**') && selected.endsWith('**')) {
        const unwrapped = selected.slice(2, -2);
        onChange(item.id, before + unwrapped + after);
      } else {
        // Remove any existing ** markers from selection
        // before re-wrapping (prevent double-wrapping)
        const clean = selected.replace(/\*\*/g, '');
        onChange(item.id, before + `**${clean}**` + after);
      }
    } else {
      // NO SELECTION — auto-detect title from details
      // Use extractTitleAndBold on the full referencia
      // Only applies if no ** already present
      if (value.includes('**')) {
        // Already has bold markers — remove all
        onChange(item.id, stripBoldMarkers(value));
      } else {
        // Auto-detect: bold everything up to first ". "
        onChange(item.id, extractTitleAndBold(value));
      }
    }
  };

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 mb-2 group">
      <div className="flex-1 min-w-0">
        {/* Type label */}
        <span className={`text-xs font-semibold uppercase tracking-wide ${item.tipo === 'basica' ? 'text-blue-600' : 'text-gray-500'}`}>
          {item.tipo === 'basica' ? 'Básica' : 'Complementar'}
        </span>

        {/* Toolbar: Bold button */}
        {!isReadOnly && (
          <div className="flex items-center gap-1 mt-1.5 mb-1">
            <button
              type="button"
              onClick={handleBoldToggle}
              title="Negrito — selecione o texto ou clique para detectar título automaticamente"
              className="inline-flex items-center justify-center w-6 h-6 text-xs font-black text-gray-600 border border-gray-300 rounded hover:bg-gray-100 hover:border-gray-400 transition-colors select-none"
            >
              B
            </button>
            <span className="text-xs text-gray-400">
              Selecione o título e clique B, ou clique B sem seleção para detectar automaticamente
            </span>
          </div>
        )}

        {/* Textarea — shows raw text with ** markers */}
        <textarea
          ref={textareaRef}
          value={item.referencia}
          onChange={e => onChange(item.id, e.target.value)}
          disabled={isReadOnly}
          rows={2}
          placeholder="SOBRENOME, Nome. Título da obra. Edição. Local: Editora, Ano. ISBN: ..."
          className="w-full text-sm text-gray-800 bg-transparent border-none resize-none focus:outline-none focus:ring-0 p-0 font-mono disabled:text-gray-500 placeholder:text-gray-400 mt-1"
        />

        {/* Live preview of bold rendering */}
        {item.referencia.includes('**') && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-400 mb-1">Pré-visualização:</p>
            <BibliografiaPreview text={item.referencia} />
          </div>
        )}
      </div>

      {/* Remove button */}
      {!isReadOnly && (
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// Inline preview component — renders ** markers as bold
function BibliografiaPreview({ text }: { text: string }) {
  const segments = parseBoldMarkers(text);
  return (
    <p className="text-sm text-gray-800 leading-relaxed">
      {segments.map((seg, i) =>
        seg.isBold ? <strong key={i}>{seg.text}</strong> : <span key={i}>{seg.text}</span>
      )}
    </p>
  );
}
