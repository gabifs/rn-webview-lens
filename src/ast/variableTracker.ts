import { AST_NODE_TYPES } from '@typescript-eslint/typescript-estree';
import type { TSESTree } from '@typescript-eslint/typescript-estree';
import { parse } from './parser';
import { TARGET_PROP_NAMES } from '../constants';

export interface TrackedInjectedScript {
  variableName: string;
  loc: TSESTree.SourceLocation;
  content: string;
}

export function trackVariables(source: string): TrackedInjectedScript[] {
  const ast = parse(source);
  if (!ast) return [];

  const referencedIdentifiers = new Set<string>();
  const results: TrackedInjectedScript[] = [];

  // Phase 1: Find all JSX attributes that reference variables or inline template literals
  walkNode(ast, (node) => {
    if (
      node.type === AST_NODE_TYPES.JSXAttribute &&
      node.name.type === AST_NODE_TYPES.JSXIdentifier &&
      (TARGET_PROP_NAMES as readonly string[]).includes(node.name.name) &&
      node.value?.type === AST_NODE_TYPES.JSXExpressionContainer
    ) {
      const expr = node.value.expression;

      if (expr.type === AST_NODE_TYPES.Identifier) {
        // Case 2/3: variable reference — collect for Phase 2
        referencedIdentifiers.add(expr.name);
      } else if (expr.type === AST_NODE_TYPES.TemplateLiteral) {
        // Inline template literal
        const content = extractStringContent(source, expr);
        results.push({
          variableName: `<inline:${node.name.name}>`,
          loc: expr.loc,
          content,
        });
      } else if (
        expr.type === AST_NODE_TYPES.Literal &&
        typeof expr.value === 'string'
      ) {
        // Inline string literal ('...' or "...")
        const content = extractStringContent(source, expr);
        results.push({
          variableName: `<inline:${node.name.name}>`,
          loc: expr.loc,
          content,
        });
      }
    }
  });

  // Phase 2: Find variable declarations with template literal or string literal init
  if (referencedIdentifiers.size > 0) {
    walkNode(ast, (node) => {
      if (
        node.type === AST_NODE_TYPES.VariableDeclarator &&
        node.id.type === AST_NODE_TYPES.Identifier &&
        referencedIdentifiers.has(node.id.name) &&
        node.init
      ) {
        if (
          node.init.type === AST_NODE_TYPES.TemplateLiteral ||
          (node.init.type === AST_NODE_TYPES.Literal &&
            typeof node.init.value === 'string')
        ) {
          const content = extractStringContent(source, node.init);
          results.push({
            variableName: node.id.name,
            loc: node.init.loc,
            content,
          });
        }
      }
    });
  }

  return results;
}

function extractStringContent(
  source: string,
  node: TSESTree.TemplateLiteral | TSESTree.StringLiteral,
): string {
  // Extract raw content between the delimiters (backtick, single or double quote)
  const start = node.range[0] + 1; // skip opening delimiter
  const end = node.range[1] - 1; // skip closing delimiter
  return source.slice(start, end);
}

function walkNode(
  node: TSESTree.Node,
  visitor: (node: TSESTree.Node) => void,
): void {
  visitor(node);
  for (const key of Object.keys(node)) {
    const child = (node as Record<string, unknown>)[key];
    if (child && typeof child === 'object') {
      if (Array.isArray(child)) {
        for (const item of child) {
          if (item && typeof item === 'object' && 'type' in item) {
            walkNode(item as TSESTree.Node, visitor);
          }
        }
      } else if ('type' in child) {
        walkNode(child as TSESTree.Node, visitor);
      }
    }
  }
}
