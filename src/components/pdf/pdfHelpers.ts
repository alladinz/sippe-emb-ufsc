// Shared utility functions for SIPPE PDF documents

// Strip HTML tags and decode HTML entities
// Used when rich text fields store HTML strings
export function stripHtmlForPdf(html: string | null | undefined): string {
  if (!html) return '';

  const text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<strong[^>]*>/gi, '**')
    .replace(/<\/strong>/gi, '**')
    .replace(/<b[^>]*>/gi, '**')
    .replace(/<\/b>/gi, '**');

  let inTags = false;
  let currentTag = '';
  const listStack: { type: string, counter: number }[] = [];
  let result = '';

  for (let i = 0; i < text.length; i++) {
    if (text[i] === '<') {
      inTags = true;
      currentTag = '';
    } else if (text[i] === '>') {
      inTags = false;
      const tag = currentTag.toLowerCase().trim();
      const tagName = tag.split(/\s+/)[0];
      
      if (tagName === 'ol') {
        listStack.push({ type: 'ol', counter: 0 });
      } else if (tagName === '/ol') {
        if (listStack.length > 0 && listStack[listStack.length - 1].type === 'ol') {
          listStack.pop();
        }
      } else if (tagName === 'ul') {
        listStack.push({ type: 'ul', counter: 0 });
      } else if (tagName === '/ul') {
        if (listStack.length > 0 && listStack[listStack.length - 1].type === 'ul') {
          listStack.pop();
        }
      } else if (tagName === 'li') {
        const currentList = listStack.length > 0 ? listStack[listStack.length - 1] : null;
        const indent = '  '.repeat(Math.max(0, listStack.length - 1));
        
        if (result.length > 0 && !result.endsWith('\n')) {
          result += '\n';
        }

        if (currentList && currentList.type === 'ol') {
          currentList.counter++;
          const olStack = listStack.filter(l => l.type === 'ol');
          const prefix = olStack.map(l => l.counter).join('.');
          result += `${indent}${prefix}. `;
        } else {
          result += `${indent}• `;
        }
      } else if (tagName === '/li') {
        if (result.length > 0 && !result.endsWith('\n')) {
          result += '\n';
        }
      }
    } else if (!inTags) {
      result += text[i];
    } else {
      currentTag += text[i];
    }
  }

  return result
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

function nodeToText(node: unknown, olCounters: number[] = []): string {
  if (!node || typeof node !== 'object') return '';
  const n = node as Record<string, unknown>;

  if (n.type === 'text') {
    const isBold = Array.isArray(n.marks) && n.marks.some((m: Record<string, unknown>) => m.type === 'bold');
    let text = (n.text as string) ?? '';
    if (isBold) text = `**${text}**`;
    return text;
  }
  if (n.type === 'hardBreak') return '\n';
  if (n.type === 'listItem') {
    const text = (Array.isArray(n.content) ? n.content : [])
      .map((child) => nodeToText(child, olCounters))
      .join('');
    return text;
  }
  if (n.type === 'bulletList') {
    return (Array.isArray(n.content) ? n.content : [])
      .map((item) => {
        const itemNode = item as Record<string, unknown>;
        const text = (Array.isArray(itemNode.content) ? itemNode.content : [])
          .map((child) => nodeToText(child, olCounters))
          .join('');
        const indent = '  '.repeat(olCounters.length);
        return `${indent}• ${text}`;
      })
      .join('\n');
  }
  if (n.type === 'orderedList') {
    const newCounters = [...olCounters, 0];
    return (Array.isArray(n.content) ? n.content : [])
      .map((item) => {
        newCounters[newCounters.length - 1]++;
        const itemNode = item as Record<string, unknown>;
        const text = (Array.isArray(itemNode.content) ? itemNode.content : [])
          .map((child) => nodeToText(child, newCounters))
          .join('');
        const indent = '  '.repeat(olCounters.length);
        return `${indent}${newCounters.join('.')}. ${text}`;
      })
      .join('\n');
  }
  
  const childrenText = (Array.isArray(n.content) ? n.content : [])
    .map((child) => nodeToText(child, olCounters))
    .join('');
  const blockTypes = [
    'paragraph', 'heading', 'blockquote', 'codeBlock',
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

export interface TextSegment {
  text:   string;
  isBold: boolean;
}

export function parseBoldMarkers(
  text: string
): TextSegment[] {
  if (!text) return [{ text: '', isBold: false }];
  const segments: TextSegment[] = [];
  const parts = text.split(/\*\*(.+?)\*\*/g);
  parts.forEach((part, index) => {
    if (!part) return;
    segments.push({
      text:   part,
      isBold: index % 2 === 1,
    });
  });
  return segments.length > 0
    ? segments
    : [{ text, isBold: false }];
}
