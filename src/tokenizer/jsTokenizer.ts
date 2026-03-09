import { JS_KEYWORDS, JS_BUILTINS, SEMANTIC_TOKEN_TYPES } from '../constants';

export interface JsToken {
  type: (typeof SEMANTIC_TOKEN_TYPES)[number];
  line: number;
  startChar: number;
  length: number;
  modifiers?: number;
}

// Modifier bitmask values (matching SEMANTIC_TOKEN_MODIFIERS order)
const MOD_DEFAULT_LIBRARY = 1 << 1;

export function tokenizeJs(source: string): JsToken[] {
  const tokens: JsToken[] = [];
  let pos = 0;
  let line = 0;
  let col = 0;

  function advance(n = 1) {
    for (let i = 0; i < n; i++) {
      if (source[pos] === '\n') {
        line++;
        col = 0;
      } else {
        col++;
      }
      pos++;
    }
  }

  function peek(offset = 0): string {
    return source[pos + offset] ?? '';
  }

  function pushToken(
    type: JsToken['type'],
    startLine: number,
    startCol: number,
    length: number,
    modifiers?: number,
  ) {
    tokens.push({ type, line: startLine, startChar: startCol, length, modifiers });
  }

  while (pos < source.length) {
    const ch = source[pos];

    // Whitespace
    if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') {
      advance();
      continue;
    }

    // Line comment
    if (ch === '/' && peek(1) === '/') {
      const startLine = line;
      const startCol = col;
      const start = pos;
      while (pos < source.length && source[pos] !== '\n') {
        advance();
      }
      pushToken('comment', startLine, startCol, pos - start);
      continue;
    }

    // Block comment
    if (ch === '/' && peek(1) === '*') {
      const startLine = line;
      const startCol = col;
      const start = pos;
      advance(2); // skip /*
      while (pos < source.length && !(source[pos] === '*' && peek(1) === '/')) {
        advance();
      }
      if (pos < source.length) {
        advance(2); // skip */
      }
      pushToken('comment', startLine, startCol, pos - start);
      continue;
    }

    // Single-quoted string
    if (ch === "'") {
      const startLine = line;
      const startCol = col;
      const start = pos;
      advance(); // skip opening quote
      while (pos < source.length && source[pos] !== "'" && source[pos] !== '\n') {
        if (source[pos] === '\\') advance(); // skip escape
        advance();
      }
      if (pos < source.length && source[pos] === "'") advance(); // skip closing quote
      pushToken('string', startLine, startCol, pos - start);
      continue;
    }

    // Double-quoted string
    if (ch === '"') {
      const startLine = line;
      const startCol = col;
      const start = pos;
      advance(); // skip opening quote
      while (pos < source.length && source[pos] !== '"' && source[pos] !== '\n') {
        if (source[pos] === '\\') advance();
        advance();
      }
      if (pos < source.length && source[pos] === '"') advance();
      pushToken('string', startLine, startCol, pos - start);
      continue;
    }

    // Template literal (nested)
    if (ch === '`') {
      const startLine = line;
      const startCol = col;
      const start = pos;
      advance(); // skip opening backtick
      while (pos < source.length && source[pos] !== '`') {
        if (source[pos] === '\\') advance();
        if (source[pos] === '$' && peek(1) === '{') {
          // Skip interpolation — just scan until matching }
          advance(2); // skip ${
          let depth = 1;
          while (pos < source.length && depth > 0) {
            if (source[pos] === '{') depth++;
            else if (source[pos] === '}') depth--;
            if (depth > 0) advance();
          }
          if (pos < source.length) advance(); // skip closing }
          continue;
        }
        advance();
      }
      if (pos < source.length) advance(); // skip closing backtick
      pushToken('string', startLine, startCol, pos - start);
      continue;
    }

    // Numbers
    if (isDigit(ch) || (ch === '.' && isDigit(peek(1)))) {
      const startLine = line;
      const startCol = col;
      const start = pos;
      if (ch === '0' && (peek(1) === 'x' || peek(1) === 'X')) {
        advance(2);
        while (pos < source.length && isHexDigit(source[pos])) advance();
      } else if (ch === '0' && (peek(1) === 'b' || peek(1) === 'B')) {
        advance(2);
        while (pos < source.length && (source[pos] === '0' || source[pos] === '1')) advance();
      } else if (ch === '0' && (peek(1) === 'o' || peek(1) === 'O')) {
        advance(2);
        while (pos < source.length && source[pos] >= '0' && source[pos] <= '7') advance();
      } else {
        while (pos < source.length && isDigit(source[pos])) advance();
        if (pos < source.length && source[pos] === '.') {
          advance();
          while (pos < source.length && isDigit(source[pos])) advance();
        }
        if (pos < source.length && (source[pos] === 'e' || source[pos] === 'E')) {
          advance();
          if (pos < source.length && (source[pos] === '+' || source[pos] === '-')) advance();
          while (pos < source.length && isDigit(source[pos])) advance();
        }
      }
      // Skip bigint suffix
      if (pos < source.length && source[pos] === 'n') advance();
      pushToken('number', startLine, startCol, pos - start);
      continue;
    }

    // Identifiers and keywords
    if (isIdentStart(ch)) {
      const startLine = line;
      const startCol = col;
      const start = pos;
      while (pos < source.length && isIdentPart(source[pos])) advance();
      const word = source.slice(start, pos);
      const len = pos - start;

      if (JS_KEYWORDS.has(word)) {
        pushToken('keyword', startLine, startCol, len);
      } else if (source[pos] === '(') {
        pushToken('function', startLine, startCol, len);
      } else if (JS_BUILTINS.has(word)) {
        pushToken('variable', startLine, startCol, len, MOD_DEFAULT_LIBRARY);
      } else {
        // Check if preceded by '.' -> property
        const charBeforeIdent = source[start - 1];
        if (charBeforeIdent === '.') {
          pushToken('property', startLine, startCol, len);
        } else {
          pushToken('variable', startLine, startCol, len);
        }
      }
      continue;
    }

    // Skip everything else (operators, punctuation)
    advance();
  }

  return tokens;
}

function isDigit(ch: string): boolean {
  return ch >= '0' && ch <= '9';
}

function isHexDigit(ch: string): boolean {
  return isDigit(ch) || (ch >= 'a' && ch <= 'f') || (ch >= 'A' && ch <= 'F');
}

function isIdentStart(ch: string): boolean {
  return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_' || ch === '$';
}

function isIdentPart(ch: string): boolean {
  return isIdentStart(ch) || isDigit(ch);
}
