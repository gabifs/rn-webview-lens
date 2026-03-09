import { parse as tsParse, AST } from '@typescript-eslint/typescript-estree';

export type ParseResult = AST<{ jsx: true; loc: true; range: true }>;

export function parse(source: string): ParseResult | null {
  try {
    return tsParse(source, {
      jsx: true,
      loc: true,
      range: true,
      errorOnUnknownASTType: false,
    });
  } catch {
    return null;
  }
}
