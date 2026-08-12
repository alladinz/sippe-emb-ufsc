// Shared utility functions for SIPPE PDF documents

// Strip HTML tags and decode HTML entities
// Used when rich text fields store HTML strings
export function stripHtmlForPdf(html: string | null | undefined): string {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<\/ol>/gi, '\n')
    .replace(/<strong[^>]*>/gi, '')
    .replace(/<\/strong>/gi, '')
    .replace(/<em[^>]*>/gi, '')
    .replace(/<\/em>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n') // collapse triple+ newlines
    .trim();
}

// Convert Tiptap JSON to plain text (if editor uses JSON)
export function tiptapToPlainText(content: unknown): string {
  if (!content) return '';
  if (typeof content === 'string') {
    // Try JSON parse first
    try {
      const parsed = JSON.parse(content);
      return tiptapToPlainText(parsed);
    } catch {
      return stripHtmlForPdf(content);
    }
  }
  if (typeof content === 'object' && content !== null) {
    const c = content as Record<string, unknown>;
    if (c.type === 'doc' && Array.isArray(c.content)) {
      return c.content
        .map((node) => nodeToText(node))
        .filter(Boolean)
        .join('\n');
    }
  }
  return String(content);
}

function nodeToText(node: unknown): string {
  if (!node || typeof node !== 'object') return '';
  const n = node as Record<string, unknown>;

  if (n.type === 'text') {
    return (n.text as string) ?? '';
  }
  if (n.type === 'hardBreak') return '\n';
  if (n.type === 'listItem') {
    const text = (Array.isArray(n.content) ? n.content : [])
      .map((child) => nodeToText(child))
      .join('');
    return '• ' + text;
  }
  if (n.type === 'orderedList') {
    return (Array.isArray(n.content) ? n.content : [])
      .map((item, i: number) => {
        const itemNode = item as Record<string, unknown>;
        const text = (Array.isArray(itemNode.content) ? itemNode.content : [])
          .map((child) => nodeToText(child))
          .join('');
        return `${i + 1}. ${text}`;
      })
      .join('\n');
  }
  
  const childrenText = (Array.isArray(n.content) ? n.content : [])
    .map((child) => nodeToText(child))
    .join('');
  const blockTypes = [
    'paragraph', 'heading', 'bulletList',
    'blockquote', 'codeBlock',
  ];
  return blockTypes.includes(n.type as string)
    ? childrenText + '\n'
    : childrenText;
}

// Smart content resolver:
// tries JSON parse, falls back to HTML strip
export function resolveContent(raw: unknown): string {
  if (!raw) return '';
  if (typeof raw === 'object') {
    return tiptapToPlainText(raw);
  }
  if (typeof raw === 'string') {
    if (raw.trim().startsWith('{')
      || raw.trim().startsWith('[')) {
      return tiptapToPlainText(raw);
    }
    return stripHtmlForPdf(raw);
  }
  return String(raw);
}

// Format date to Brazilian Portuguese
export function formatDateBR(
  date?: string | Date | null
): string {
  if (!date) return '—';
  const d = typeof date === 'string'
    ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
}

// Format date with time
export function formatDateTimeBR(
  date?: string | Date | null
): string {
  if (!date) return '—';
  const d = typeof date === 'string'
    ? new Date(date) : date;
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}
