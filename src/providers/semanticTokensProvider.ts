import * as vscode from 'vscode';
import { trackVariables } from '../ast/variableTracker';
import { tokenizeJs } from '../tokenizer/jsTokenizer';
import { SEMANTIC_TOKEN_TYPES, SEMANTIC_TOKEN_MODIFIERS } from '../constants';

export const legend = new vscode.SemanticTokensLegend(
  [...SEMANTIC_TOKEN_TYPES],
  [...SEMANTIC_TOKEN_MODIFIERS],
);

const tokenTypeIndex = new Map<string, number>(
  SEMANTIC_TOKEN_TYPES.map((t, i) => [t, i]),
);

export class InjectedJsSemanticTokensProvider
  implements vscode.DocumentSemanticTokensProvider
{
  provideDocumentSemanticTokens(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken,
  ): vscode.SemanticTokens {
    const builder = new vscode.SemanticTokensBuilder(legend);
    const source = document.getText();
    const tracked = trackVariables(source);

    for (const item of tracked) {
      const jsTokens = tokenizeJs(item.content);

      // Template literal starts at item.loc.start (0-based line in AST, 1-based in source)
      // Content starts after the opening backtick
      const templateStartLine = item.loc.start.line - 1; // convert to 0-based
      const templateStartCol = item.loc.start.column + 1; // skip backtick

      for (const token of jsTokens) {
        const typeIdx = tokenTypeIndex.get(token.type);
        if (typeIdx === undefined) continue;

        const absoluteLine = templateStartLine + token.line;
        const absoluteCol =
          token.line === 0
            ? templateStartCol + token.startChar
            : token.startChar;

        builder.push(
          absoluteLine,
          absoluteCol,
          token.length,
          typeIdx,
          token.modifiers ?? 0,
        );
      }
    }

    return builder.build();
  }
}
