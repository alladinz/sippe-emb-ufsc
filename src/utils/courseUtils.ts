// Mapping of course names to course codes (Joinville Campus UFSC)
export const COURSE_CODE_MAP: Record<string, string> = {
  "Ciência e Tecnologia": "601",
  "Engenharia Aeroespacial": "602",
  "Engenharia Automotiva": "603",
  "Engenharia Ferroviária e Metroviária": "604",
  "Engenharia Mecatrônica": "605",
  "Engenharia Naval": "606",
  "Engenharia Civil de Infraestrutura": "607",
  "Engenharia de Transportes e Logística": "608",
  "Engenharia de Transporte e Logística": "608",
};

// Inverse map: Code to standard course name
export const CODE_COURSE_MAP: Record<string, string> = {
  "601": "Ciência e Tecnologia",
  "602": "Engenharia Aeroespacial",
  "603": "Engenharia Automotiva",
  "604": "Engenharia Ferroviária e Metroviária",
  "605": "Engenharia Mecatrônica",
  "606": "Engenharia Naval",
  "607": "Engenharia Civil de Infraestrutura",
  "608": "Engenharia de Transportes e Logística",
};

/**
 * Normalizes a string by stripping accents and converting to lowercase.
 */
function normalizeString(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

/**
 * Extracts or resolves the numeric course code for a given course name/string.
 * Returns null if not found.
 */
export function getCourseCode(course: string): number | null {
  if (!course) return null;
  const trimmed = course.trim();
  if (!trimmed || trimmed.toLowerCase() === "geral") return null;

  // Check if it already starts with a 3-digit code
  const match = trimmed.match(/^(\d{3})/);
  if (match) {
    return parseInt(match[1], 10);
  }

  // If it's a known course name
  if (COURSE_CODE_MAP[trimmed]) {
    return parseInt(COURSE_CODE_MAP[trimmed], 10);
  }

  // Normalized check
  const normalized = normalizeString(trimmed);
  for (const [name, code] of Object.entries(COURSE_CODE_MAP)) {
    if (normalized === normalizeString(name)) {
      return parseInt(code, 10);
    }
  }

  // Substring check
  for (const [name, code] of Object.entries(COURSE_CODE_MAP)) {
    const normName = normalizeString(name);
    if (normalized.includes(normName) || normName.includes(normalized)) {
      return parseInt(code, 10);
    }
  }

  return null;
}

/**
 * Formats a single course name into "CODE - NAME" if a code is mapped.
 * Examples:
 * - "Ciência e Tecnologia" -> "601 - Ciência e Tecnologia"
 * - "601 - Ciência e Tecnologia" -> "601 - Ciência e Tecnologia"
 * - "601" -> "601 - Ciência e Tecnologia"
 * - "Geral" -> "Geral"
 */
export function formatCursoVinculado(course: string): string {
  if (!course) return "";
  const trimmed = course.trim();
  if (!trimmed) return "";
  if (trimmed.toLowerCase() === "geral") return trimmed;

  // Check if it already has a format like "601 - Nome" or "601-Nome" or "601 — Nome"
  const match = trimmed.match(/^(\d{3})\s*[-–—:]\s*(.+)$/);
  if (match) {
    const code = match[1];
    const name = match[2].trim();
    return `${code} - ${name}`;
  }

  // If it's just the 3-digit code
  if (CODE_COURSE_MAP[trimmed]) {
    return `${trimmed} - ${CODE_COURSE_MAP[trimmed]}`;
  }

  // Direct exact match
  if (COURSE_CODE_MAP[trimmed]) {
    return `${COURSE_CODE_MAP[trimmed]} - ${trimmed}`;
  }

  // Case/accent insensitive check
  const normalized = normalizeString(trimmed);
  for (const [name, code] of Object.entries(COURSE_CODE_MAP)) {
    if (normalized === normalizeString(name)) {
      return `${code} - ${name}`;
    }
  }

  // Check if the input contains one of the known course names or vice-versa
  for (const [name, code] of Object.entries(COURSE_CODE_MAP)) {
    const normName = normalizeString(name);
    if (normalized.includes(normName) || normName.includes(normalized)) {
      return `${code} - ${name}`;
    }
  }

  return trimmed;
}

/**
 * Formats an array of course names into formatted strings with codes,
 * sorted in ascending numerical order by course code.
 */
export function formatCursosVinculados(cursos?: string[] | null): string {
  if (!cursos || cursos.length === 0) return "-";

  const sorted = [...cursos].sort((a, b) => {
    const codeA = getCourseCode(a);
    const codeB = getCourseCode(b);

    if (codeA !== null && codeB !== null) {
      return codeA - codeB;
    }
    if (codeA !== null) return -1;
    if (codeB !== null) return 1;
    return a.localeCompare(b, 'pt-BR');
  });

  return sorted.map(formatCursoVinculado).join(", ");
}
