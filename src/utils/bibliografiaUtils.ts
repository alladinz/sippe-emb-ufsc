export function extractTitleAndBold(
  details: string
): string {
  if (!details || !details.trim()) return details;

  // Match everything up to the first ". " (period + space)
  // or ". " followed by a digit (edition number like "6ª")
  // The title ends at the FIRST period-space boundary
  const match = details.match(/^(.+?)\.\s+(.*)$/s);

  if (!match) {
    // No period found — entire string is the title
    return `**${details.trim()}**`;
  }

  const title     = match[1].trim();
  const remainder = match[2].trim();

  return `**${title}**. ${remainder}`;
}

export function buildBoldReference(ref: {
  authors: string;
  details: string;
  full?:   string;
}): string {
  const authors = ref.authors.trim();
  const boldDetails = extractTitleAndBold(ref.details);
  // Ensure authors ends with period-space separator
  const sep = authors.endsWith('.') ? ' ' : '. ';
  return `${authors}${sep}${boldDetails}`;
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
  // Split on **...** markers
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

export function stripBoldMarkers(text: string): string {
  return text.replace(/\*\*/g, '');
}

export function boldMarkersToHtml(text: string): string {
  return text.replace(
    /\*\*(.+?)\*\*/g,
    '<strong>$1</strong>'
  );
}
