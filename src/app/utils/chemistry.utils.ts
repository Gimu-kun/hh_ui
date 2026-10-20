/**
 * Utility functions for chemical formula typography and text tokenization
 */

// Convert ASCII numbers in chemical formula to unicode subscripts
export function toSubscript(formula: string): string {
  const map: Record<string, string> = {
    '0': '₀',
    '1': '₁',
    '2': '₂',
    '3': '₃',
    '4': '₄',
    '5': '₅',
    '6': '₆',
    '7': '₇',
    '8': '₈',
    '9': '₉',
  };
  return formula.replace(/\d/g, (d) => map[d] || d);
}

export interface TextToken {
  type: 'text' | 'substance';
  content: string;
  formula?: string;
  subscript?: string;
}

/**
 * Regex matching valid chemical formulas like CaCO3, Fe2(SO4)3, Al2O3, H2O, KMnO4, (NH4)2SO4
 */
const FORMULA_REGEX =
  /\b((?:[A-Z][a-z]?\d*|\((?:[A-Z][a-z]?\d*)+\)\d*)+)\b/g;

// Words to exclude from chemical formula detection in text
const EXCLUDED_WORDS = new Set([
  'THPT', 'KBS', 'OK', 'ID', 'STP', 'GCD', 'CPU', 'RAM', 'API', 'CRUD',
  'JSON', 'UI', 'UX', 'HTML', 'CSS', 'URL',
  'Buoc', 'Viet', 'Phan', 'Bang', 'Nguyen', 'To', 'Chat', 'Hop', 'Don',
  'Cho', 'Co', 'Tu', 'Khi', 'Va', 'La', 'Voi', 'Theo', 'Sau', 'Neu',
  'Hoac', 'Hai', 'Ba', 'Bon', 'Nam', 'Bay', 'Tam', 'Chin', 'Muoi',
  'Gia', 'Tri', 'So', 'Mol', 'Gam', 'Lit', 'DKTC', 'PT', 'PTHH',
  'He', 'Can', 'Dau', 'Cuoi', 'Tren', 'Duoi', 'Giua', 'Trong',
  'Phuong', 'Trinh', 'Bao', 'Toan', 'Uoc', 'Toi', 'Gian'
]);

export function isChemicalFormula(word: string): boolean {
  if (!word || word.length === 0) return false;
  if (EXCLUDED_WORDS.has(word)) return false;

  // Single letter words in running text are not chemical links to prevent false positives (like variable a, b, n, V, M)
  if (word.length === 1) return false;

  // Must start with uppercase letter
  if (!/^[A-Z]/.test(word)) return false;

  // Cannot contain underscores
  if (word.includes('_')) return false;

  // Must consist of valid element letters, digits, parentheses
  return /^(?:[A-Z][a-z]?\d*|\((?:[A-Z][a-z]?\d*)+\)\d*)+$/.test(word);
}

/**
 * Tokenize a paragraph or sentence into text and chemical substance links
 */
export function tokenizeChemicalText(text: string): TextToken[] {
  if (!text) return [];

  // Match full words (including accented Vietnamese letters), punctuation, or whitespace
  const tokens: TextToken[] = [];
  const regex = /([A-Za-zÀ-ỹ0-9()]+|[^\sA-Za-zÀ-ỹ0-9()]+|\s+)/gu;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const raw = match[0];
    // Check if word contains Vietnamese accented letters
    const hasVietnameseAccent = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(raw);

    if (!hasVietnameseAccent && isChemicalFormula(raw)) {
      tokens.push({
        type: 'substance',
        content: raw,
        formula: raw,
        subscript: toSubscript(raw),
      });
    } else {
      tokens.push({
        type: 'text',
        content: raw,
      });
    }
  }

  return tokens;
}

/**
 * Tokenize a balanced chemical equation: "4Al + 3O2 → 2Al2O3"
 */
export interface EquationPart {
  type: 'coefficient' | 'substance' | 'operator' | 'arrow' | 'condition';
  text: string;
  formula?: string;
}

export function parseEquationLine(equation: string): EquationPart[] {
  if (!equation) return [];
  const parts: EquationPart[] = [];

  // Replace standard arrows
  const normalized = equation
    .replace(/->/g, '→')
    .replace(/-->/g, '→')
    .replace(/=>/g, '→');

  // Split tokens: numbers, formulas, '+', '→', conditions
  const regex =
    /(?:(\d+)\s*)?([A-Z][A-Za-z0-9()]*|\((?:[A-Za-z0-9()]*)+\)\d*)|(\+)|(→|--[^>]+-->)|(\d+)|([^\s]+)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(normalized)) !== null) {
    const coeff = match[1];
    const formulaCandidate = match[2];
    const plus = match[3];
    const arrow = match[4];
    const standaloneNumber = match[5];
    const other = match[6];

    if (coeff) {
      parts.push({ type: 'coefficient', text: coeff });
    }
    if (formulaCandidate) {
      const cleanFormula = formulaCandidate.replace(/^\d+/, '');
      parts.push({
        type: 'substance',
        text: toSubscript(cleanFormula),
        formula: cleanFormula,
      });
    } else if (standaloneNumber) {
      parts.push({ type: 'coefficient', text: standaloneNumber });
    } else if (plus) {
      parts.push({ type: 'operator', text: '+' });
    } else if (arrow) {
      parts.push({ type: 'arrow', text: arrow });
    } else if (other && other.trim().length > 0) {
      parts.push({ type: 'operator', text: other.trim() });
    }
  }

  return parts;
}

