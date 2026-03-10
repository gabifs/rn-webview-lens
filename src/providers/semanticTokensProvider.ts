import * as vscode from 'vscode';
import { SEMANTIC_TOKEN_TYPES, SEMANTIC_TOKEN_MODIFIERS } from '../constants';

type TrackVariablesFn = typeof import('../ast/variableTracker').trackVariables;
type TokenizeJsFn = typeof import('../tokenizer/jsTokenizer').tokenizeJs;

let trackVariables: TrackVariablesFn | null = null;
let tokenizeJs: TokenizeJsFn | null = null;

async function loadModules(): Promise<{
  trackVariables: TrackVariablesFn;
  tokenizeJs: TokenizeJsFn;
}> {
  if (!trackVariables || !tokenizeJs) {
    const [tracker, tokenizer] = await Promise.all([
      import('../ast/variableTracker'),
      import('../tokenizer/jsTokenizer'),
    ]);
    trackVariables = tracker.trackVariables;
    tokenizeJs = tokenizer.tokenizeJs;
  }
  return { trackVariables, tokenizeJs };
}

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
  private cache = new Map<
    string,
    { version: number; tokens: vscode.SemanticTokens }
  >();

  async provideDocumentSemanticTokens(
    document: vscode.TextDocument,
    token: vscode.CancellationToken,
  ): Promise<vscode.SemanticTokens> {
    const uri = document.uri.toString();
    const version = document.version;
    const cached = this.cache.get(uri);
    if (cached && cached.version === version) {
      return cached.tokens;
    }

    const builder = new vscode.SemanticTokensBuilder(legend);
    const source = document.getText();

    if (!source.includes('injectedJavaScript')) {
      const tokens = builder.build();
      this.cache.set(uri, { version, tokens });
      return tokens;
    }

    if (token.isCancellationRequested) return builder.build();

    const modules = await loadModules();

    if (token.isCancellationRequested) return builder.build();

    const tracked = modules.trackVariables(source);

    for (const item of tracked) {
      const jsTokens = modules.tokenizeJs(item.content);

      // Template literal starts at item.loc.start (1-based line in AST)
      // Content starts after the opening backtick
      const templateStartLine = item.loc.start.line - 1; // convert to 0-based
      const templateStartCol = item.loc.start.column + 1; // skip backtick

      for (const jsToken of jsTokens) {
        const typeIdx = tokenTypeIndex.get(jsToken.type);
        if (typeIdx === undefined) continue;

        const absoluteLine = templateStartLine + jsToken.line;
        const absoluteCol =
          jsToken.line === 0
            ? templateStartCol + jsToken.startChar
            : jsToken.startChar;

        builder.push(
          absoluteLine,
          absoluteCol,
          jsToken.length,
          typeIdx,
          jsToken.modifiers ?? 0,
        );
      }
    }

    const tokens = builder.build();
    this.cache.set(uri, { version, tokens });
    return tokens;
  }
}
