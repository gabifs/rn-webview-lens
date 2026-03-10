import { TARGET_PROP_NAMES } from '../constants';

export interface SourceLocation {
  start: { line: number; column: number };
  end: { line: number; column: number };
}

export interface TrackedInjectedScript {
  variableName: string;
  loc: SourceLocation;
  content: string;
}

export function trackVariables(source: string): TrackedInjectedScript[] {
  const results: TrackedInjectedScript[] = [];
  const referencedIdentifiers = new Set<string>();

  // Phase 1: Find JSX attributes matching target props
  for (const propName of TARGET_PROP_NAMES) {
    const pattern = new RegExp(propName + '=\\{', 'g');
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(source)) !== null) {
      const exprStart = match.index + match[0].length;
      const afterBrace = skipWhitespace(source, exprStart);

      const ch = source[afterBrace];
      if (ch === '`') {
        // Inline template literal
        const end = scanTemplateLiteral(source, afterBrace);
        if (end !== -1) {
          const content = source.slice(afterBrace + 1, end - 1);
          results.push({
            variableName: `<inline:${propName}>`,
            loc: offsetToLoc(source, afterBrace, end),
            content,
          });
        }
      } else if (ch === '"' || ch === "'") {
        // Inline string literal
        const end = scanStringLiteral(source, afterBrace);
        if (end !== -1) {
          const content = source.slice(afterBrace + 1, end - 1);
          results.push({
            variableName: `<inline:${propName}>`,
            loc: offsetToLoc(source, afterBrace, end),
            content,
          });
        }
      } else if (isIdentStart(ch)) {
        // Variable reference
        const identEnd = scanIdentifier(source, afterBrace);
        const name = source.slice(afterBrace, identEnd);
        referencedIdentifiers.add(name);
      }
    }
  }

  // Phase 2: Find variable declarations for referenced identifiers
  if (referencedIdentifiers.size > 0) {
    for (const name of referencedIdentifiers) {
      const declPattern = new RegExp(
        '(?:const|let|var)\\s+' + escapeRegex(name) + '\\s*(?::\\s*string\\s*)?=\\s*',
        'g',
      );
      let match: RegExpExecArray | null;

      while ((match = declPattern.exec(source)) !== null) {
        const valueStart = match.index + match[0].length;
        const ch = source[valueStart];

        if (ch === '`') {
          const end = scanTemplateLiteral(source, valueStart);
          if (end !== -1) {
            const content = source.slice(valueStart + 1, end - 1);
            results.push({
              variableName: name,
              loc: offsetToLoc(source, valueStart, end),
              content,
            });
          }
        } else if (ch === '"' || ch === "'") {
          const end = scanStringLiteral(source, valueStart);
          if (end !== -1) {
            const content = source.slice(valueStart + 1, end - 1);
            results.push({
              variableName: name,
              loc: offsetToLoc(source, valueStart, end),
              content,
            });
          }
        }
        // If initializer is something else (function call, etc.), skip it
      }
    }
  }

  return results;
}

/** Scan a template literal starting at the opening backtick. Returns position after closing backtick. */
function scanTemplateLiteral(source: string, start: number): number {
  let i = start + 1; // skip opening backtick
  while (i < source.length) {
    const ch = source[i];
    if (ch === '\\') {
      i += 2; // skip escaped char
    } else if (ch === '$' && source[i + 1] === '{') {
      // Skip template expression ${...}
      i = scanBraces(source, i + 1);
      if (i === -1) return -1;
    } else if (ch === '`') {
      return i + 1; // position after closing backtick
    } else {
      i++;
    }
  }
  return -1;
}

/** Scan a string literal starting at the opening quote. Returns position after closing quote. */
function scanStringLiteral(source: string, start: number): number {
  const quote = source[start];
  let i = start + 1;
  while (i < source.length) {
    const ch = source[i];
    if (ch === '\\') {
      i += 2;
    } else if (ch === quote) {
      return i + 1;
    } else {
      i++;
    }
  }
  return -1;
}

/** Scan balanced braces starting at an opening '{'. Returns position after closing '}'. */
function scanBraces(source: string, start: number): number {
  let depth = 0;
  let i = start;
  while (i < source.length) {
    const ch = source[i];
    if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) return i + 1;
    } else if (ch === '`') {
      i = scanTemplateLiteral(source, i);
      if (i === -1) return -1;
      continue;
    } else if (ch === '"' || ch === "'") {
      i = scanStringLiteral(source, i);
      if (i === -1) return -1;
      continue;
    }
    i++;
  }
  return -1;
}

function skipWhitespace(source: string, pos: number): number {
  while (pos < source.length && /\s/.test(source[pos])) pos++;
  return pos;
}

function isIdentStart(ch: string | undefined): boolean {
  if (!ch) return false;
  return /[a-zA-Z_$]/.test(ch);
}

function scanIdentifier(source: string, start: number): number {
  let i = start;
  while (i < source.length && /[a-zA-Z0-9_$]/.test(source[i])) i++;
  return i;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Convert character offsets to 1-based line / 0-based column SourceLocation. */
function offsetToLoc(
  source: string,
  start: number,
  end: number,
): SourceLocation {
  let line = 1;
  let col = 0;
  let startLoc = { line: 1, column: 0 };
  let endLoc = { line: 1, column: 0 };
  let foundStart = false;

  for (let i = 0; i <= end && i < source.length; i++) {
    if (i === start) {
      startLoc = { line, column: col };
      foundStart = true;
    }
    if (i === end) {
      endLoc = { line, column: col };
      break;
    }
    if (source[i] === '\n') {
      line++;
      col = 0;
    } else {
      col++;
    }
  }

  if (!foundStart) startLoc = { line, column: col };
  // If end is at source.length (past last char)
  if (end >= source.length) endLoc = { line, column: col };

  return { start: startLoc, end: endLoc };
}
