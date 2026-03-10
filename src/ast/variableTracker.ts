import ts from 'typescript';
import { parse } from './parser';
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
  const sourceFile = parse(source);
  if (!sourceFile) return [];

  const referencedIdentifiers = new Set<string>();
  const results: TrackedInjectedScript[] = [];

  // Phase 1: Find all JSX attributes that reference variables or inline template literals
  walkNode(sourceFile, (node) => {
    if (!ts.isJsxAttribute(node)) return;

    const propName = node.name.text;
    if (!(TARGET_PROP_NAMES as readonly string[]).includes(propName)) return;

    const initializer = node.initializer;
    if (!initializer || !ts.isJsxExpression(initializer)) return;

    const expr = initializer.expression;
    if (!expr) return;

    if (ts.isIdentifier(expr)) {
      // Case 2/3: variable reference — collect for Phase 2
      referencedIdentifiers.add(expr.text);
    } else if (ts.isNoSubstitutionTemplateLiteral(expr)) {
      results.push({
        variableName: `<inline:${propName}>`,
        loc: getLoc(sourceFile, expr),
        content: extractStringContent(source, sourceFile, expr),
      });
    } else if (ts.isStringLiteral(expr)) {
      results.push({
        variableName: `<inline:${propName}>`,
        loc: getLoc(sourceFile, expr),
        content: extractStringContent(source, sourceFile, expr),
      });
    }
  });

  // Phase 2: Find variable declarations with template literal or string literal init
  if (referencedIdentifiers.size > 0) {
    walkNode(sourceFile, (node) => {
      if (!ts.isVariableDeclaration(node)) return;
      if (!ts.isIdentifier(node.name)) return;
      if (!referencedIdentifiers.has(node.name.text)) return;
      if (!node.initializer) return;

      if (
        ts.isNoSubstitutionTemplateLiteral(node.initializer) ||
        ts.isStringLiteral(node.initializer)
      ) {
        results.push({
          variableName: node.name.text,
          loc: getLoc(sourceFile, node.initializer),
          content: extractStringContent(source, sourceFile, node.initializer),
        });
      }
    });
  }

  return results;
}

function getLoc(
  sourceFile: ts.SourceFile,
  node: ts.Node,
): SourceLocation {
  const start = ts.getLineAndCharacterOfPosition(
    sourceFile,
    node.getStart(sourceFile),
  );
  const end = ts.getLineAndCharacterOfPosition(sourceFile, node.end);
  // Use 1-based lines to match previous @typescript-eslint behavior
  return {
    start: { line: start.line + 1, column: start.character },
    end: { line: end.line + 1, column: end.character },
  };
}

function extractStringContent(
  source: string,
  sourceFile: ts.SourceFile,
  node: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral,
): string {
  const start = node.getStart(sourceFile) + 1; // skip opening delimiter
  const end = node.end - 1; // skip closing delimiter
  return source.slice(start, end);
}

function walkNode(node: ts.Node, visitor: (node: ts.Node) => void): void {
  visitor(node);
  ts.forEachChild(node, (child) => walkNode(child, visitor));
}
