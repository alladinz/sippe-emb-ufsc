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

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  nbsp: ' ',
  quot: '"',
  apos: "'",
  aacute: 'á',
  Aacute: 'Á',
  agrave: 'à',
  Agrave: 'À',
  acirc: 'â',
  Acirc: 'Â',
  atilde: 'ã',
  Atilde: 'Ã',
  eacute: 'é',
  Eacute: 'É',
  ecirc: 'ê',
  Ecirc: 'Ê',
  iacute: 'í',
  Iacute: 'Í',
  oacute: 'ó',
  Oacute: 'Ó',
  ocirc: 'ô',
  Ocirc: 'Ô',
  otilde: 'õ',
  Otilde: 'Õ',
  uacute: 'ú',
  Uacute: 'Ú',
  uuml: 'ü',
  Uuml: 'Ü',
  ccedil: 'ç',
  Ccedil: 'Ç',
  ndash: '–',
  mdash: '—',
  laquo: '«',
  raquo: '»',
  ldquo: '“',
  rdquo: '”',
  lsquo: '‘',
  rsquo: '’',
  hellip: '…',
  bull: '•',
  middot: '·',
  times: '×',
  divide: '÷',
  plusmn: '±',
  le: '≤',
  ge: '≥',
  ne: '≠',
  approx: '≈',
  deg: '°',
  ordm: 'º',
  ordf: 'ª',
  sect: '§',
};

export function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  return text
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = Number(dec);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _;
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _;
    })
    .replace(/&([a-zA-Z]+);/g, (full, name) => NAMED_ENTITIES[name] ?? full);
}

export function normalizePlainTextToHtml(raw: string | null | undefined): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';
  // If already HTML, return as-is
  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return raw;
  }
  const paragraphs = trimmed.split(/\n{2,}/);
  return paragraphs
    .map((p) => {
      const escaped = p
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>');
      return `<p>${escaped}</p>`;
    })
    .join('');
}

function tiptapNodeToHtml(node: unknown): string {
  if (!node || typeof node !== 'object') return '';
  const n = node as Record<string, unknown>;

  if (n.type === 'text') {
    let text = String(n.text ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const marks = Array.isArray(n.marks) ? (n.marks as Record<string, unknown>[]) : [];
    for (const mark of marks) {
      if (mark.type === 'bold') text = `<strong>${text}</strong>`;
      if (mark.type === 'italic') text = `<em>${text}</em>`;
    }
    return text;
  }

  if (n.type === 'hardBreak') return '<br />';

  const inner = (Array.isArray(n.content) ? n.content : []).map(tiptapNodeToHtml).join('');
  switch (n.type) {
    case 'doc':
      return inner;
    case 'paragraph':
      return `<p>${inner}</p>`;
    case 'heading': {
      const level = (n.attrs as Record<string, unknown> | undefined)?.level || 3;
      return `<h${level}>${inner}</h${level}>`;
    }
    case 'bulletList':
      return `<ul>${inner}</ul>`;
    case 'orderedList':
      return `<ol>${inner}</ol>`;
    case 'listItem':
      return `<li>${inner}</li>`;
    case 'blockquote':
      return `<blockquote>${inner}</blockquote>`;
    default:
      return inner;
  }
}

export interface PdfTextRun {
  text: string;
  bold: boolean;
  italic: boolean;
}

export type PdfRichBlock =
  | { type: 'paragraph'; runs: PdfTextRun[]; isHeading?: boolean }
  | { type: 'list-item'; marker: string; depth: number; runs: PdfTextRun[] };

function pushRun(
  runs: PdfTextRun[],
  text: string,
  bold: boolean,
  italic: boolean
) {
  if (!text) return;
  // Also support markdown **bold** segments (including multi-line **...**)
  if (text.includes('**')) {
    const parts = text.split(/\*\*([\s\S]+?)\*\*/g);
    parts.forEach((part, idx) => {
      if (!part) return;
      const isMdBold = idx % 2 === 1;
      const effectiveBold = bold || isMdBold;
      const prev = runs[runs.length - 1];
      if (prev && prev.bold === effectiveBold && prev.italic === italic) {
        prev.text += part;
      } else {
        runs.push({ text: part, bold: effectiveBold, italic });
      }
    });
    return;
  }

  const prev = runs[runs.length - 1];
  if (prev && prev.bold === bold && prev.italic === italic) {
    prev.text += text;
  } else {
    runs.push({ text, bold, italic });
  }
}

export function rawContentToHtml(raw: unknown): string {
  if (!raw) return '';

  if (typeof raw === 'object' && raw !== null) {
    return tiptapNodeToHtml(raw);
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        return tiptapNodeToHtml(parsed);
      } catch {
        return normalizePlainTextToHtml(trimmed);
      }
    }
    if (/<[a-z][\s\S]*>/i.test(trimmed)) {
      // Remove HTML whitespace formatting newlines between tags and convert residual markdown bold
      return trimmed
        .replace(/>\s*\n+\s*</g, '><')
        .replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>');
    }
    return normalizePlainTextToHtml(trimmed);
  }

  return normalizePlainTextToHtml(String(raw));
}

export function parseHtmlToRichBlocks(raw: unknown): PdfRichBlock[] {
  const html = rawContentToHtml(raw);
  if (!html) return [];

  const blocks: PdfRichBlock[] = [];
  let boldDepth = 0;
  let italicDepth = 0;

  type ListFrame = { type: 'ul' | 'ol'; counter: number };
  const listStack: ListFrame[] = [];

  type PendingBlock =
    | { kind: 'paragraph'; isHeading?: boolean; runs: PdfTextRun[] }
    | { kind: 'list-item'; marker: string; depth: number; runs: PdfTextRun[]; flushed: boolean };

  let currentBlock: PendingBlock | null = null;

  const trimRunsEdgeWhitespace = (runs: PdfTextRun[]): PdfTextRun[] => {
    const cloned = runs.map((r) => ({ ...r }));
    while (cloned.length > 0 && !cloned[0].text.replace(/\n/g, '').trim() && !cloned[0].text.includes('\n')) {
      cloned.shift();
    }
    if (cloned.length > 0) {
      cloned[0].text = cloned[0].text.replace(/^[ \t]+/, '');
    }
    while (cloned.length > 0 && !cloned[cloned.length - 1].text.replace(/\n/g, '').trim() && !cloned[cloned.length - 1].text.includes('\n')) {
      cloned.pop();
    }
    if (cloned.length > 0) {
      cloned[cloned.length - 1].text = cloned[cloned.length - 1].text.replace(/[ \t]+$/, '');
    }
    return cloned.filter((r) => r.text.length > 0);
  };

  const flushCurrentBlock = () => {
    if (!currentBlock) return;
    const cleanedRuns = trimRunsEdgeWhitespace(currentBlock.runs);
    if (cleanedRuns.length > 0) {
      if (currentBlock.kind === 'list-item') {
        blocks.push({
          type: 'list-item',
          marker: currentBlock.marker,
          depth: currentBlock.depth,
          runs: cleanedRuns,
        });
        currentBlock.flushed = true;
      } else {
        blocks.push({
          type: 'paragraph',
          isHeading: currentBlock.isHeading,
          runs: cleanedRuns,
        });
      }
    }
    if (currentBlock.kind === 'list-item') {
      currentBlock.runs = [];
    } else {
      currentBlock = null;
    }
  };

  // Tokenize into tags and text segments
  const tokens = html.match(/<[^>]+>|[^<]+/g) ?? [];

  for (const token of tokens) {
    if (token.startsWith('<')) {
      const inner = token.slice(1, -1).trim();
      const isClosing = inner.startsWith('/');
      const tagName = (isClosing ? inner.slice(1) : inner).split(/[\s/]+/)[0].toLowerCase();

      if (!isClosing) {
        if (tagName === 'strong' || tagName === 'b') {
          boldDepth++;
        } else if (tagName === 'em' || tagName === 'i' || tagName === 'cite') {
          italicDepth++;
        } else if (tagName === 'br') {
          if (!currentBlock) {
            currentBlock = { kind: 'paragraph', runs: [] };
          }
          pushRun(currentBlock.runs, '\n', boldDepth > 0, italicDepth > 0);
        } else if (tagName === 'ul') {
          if (currentBlock?.kind === 'list-item' && currentBlock.runs.length > 0) {
            flushCurrentBlock();
          } else if (currentBlock?.kind === 'paragraph') {
            flushCurrentBlock();
          }
          listStack.push({ type: 'ul', counter: 0 });
        } else if (tagName === 'ol') {
          if (currentBlock?.kind === 'list-item' && currentBlock.runs.length > 0) {
            flushCurrentBlock();
          } else if (currentBlock?.kind === 'paragraph') {
            flushCurrentBlock();
          }
          listStack.push({ type: 'ol', counter: 0 });
        } else if (tagName === 'li') {
          if (currentBlock?.kind === 'paragraph') {
            flushCurrentBlock();
          } else if (currentBlock?.kind === 'list-item' && currentBlock.runs.length > 0) {
            flushCurrentBlock();
          }
          const top = listStack[listStack.length - 1];
          const depth = Math.max(0, listStack.length - 1);
          let marker = '•';
          if (top?.type === 'ol') {
            top.counter++;
            const olCounters = listStack.filter((l) => l.type === 'ol').map((l) => l.counter);
            marker = `${olCounters.join('.')}.`;
          } else if (depth > 0) {
            marker = '◦';
          }
          currentBlock = {
            kind: 'list-item',
            marker,
            depth,
            runs: [],
            flushed: false,
          };
        } else if (tagName === 'p' || tagName === 'blockquote' || /^h[1-6]$/.test(tagName)) {
          const isHeading = /^h[1-6]$/.test(tagName);
          if (currentBlock?.kind === 'list-item') {
            // If a list-item already had content flushed or accumulated, open a continuation paragraph indented at list level;
            // if it's the first <p> inside <li>, keep appending directly to the list-item!
            if (currentBlock.flushed || currentBlock.runs.length > 0) {
              flushCurrentBlock();
              currentBlock = { kind: 'paragraph', isHeading, runs: [] };
            }
          } else {
            flushCurrentBlock();
            currentBlock = { kind: 'paragraph', isHeading, runs: [] };
          }
        }
      } else {
        if (tagName === 'strong' || tagName === 'b') {
          boldDepth = Math.max(0, boldDepth - 1);
        } else if (tagName === 'em' || tagName === 'i' || tagName === 'cite') {
          italicDepth = Math.max(0, italicDepth - 1);
        } else if (tagName === 'p' || tagName === 'blockquote' || /^h[1-6]$/.test(tagName)) {
          if (currentBlock?.kind === 'paragraph') {
            flushCurrentBlock();
          }
        } else if (tagName === 'li') {
          flushCurrentBlock();
          currentBlock = null;
        } else if (tagName === 'ul' || tagName === 'ol') {
          flushCurrentBlock();
          currentBlock = null;
          listStack.pop();
        }
      }
    } else {
      const decoded = decodeHtmlEntities(token);
      // Collapse raw source newlines/tabs into normal space
      const normalized = decoded.replace(/[\r\n\t]+/g, ' ');
      if (!normalized.trim() && !currentBlock) {
        continue;
      }
      if (!currentBlock) {
        currentBlock = { kind: 'paragraph', runs: [] };
      }
      pushRun(currentBlock.runs, normalized, boldDepth > 0, italicDepth > 0);
    }
  }

  flushCurrentBlock();
  return blocks;
}
