# rn-webview-lens

VSCode extension that adds JavaScript syntax highlighting to `react-native-webview`'s `injectedJavaScript` and `injectedJavaScriptBeforeContentLoaded` props.

## Commands

- `npm run build` — Bundle extension with esbuild → `dist/extension.js`
- `npm run watch` — Build in watch mode
- `npm test` — Run all tests with vitest
- `npx vitest run test/variableTracker.test.ts` — Run a single test file
- `npm run package` — Package .vsix with vsce

## Architecture

**Hybrid approach**: TextMate injection grammar (inline case) + Semantic Tokens Provider (variable reference cases).

- `syntaxes/injection.json` — TextMate injection grammar for inline template literals in JSX props (Case 1)
- `src/ast/parser.ts` — Wrapper around `@typescript-eslint/typescript-estree`
- `src/ast/variableTracker.ts` — AST walker that finds template literals referenced by target props (Cases 2 & 3)
- `src/tokenizer/jsTokenizer.ts` — Regex-based single-pass JS tokenizer for semantic token classification
- `src/providers/semanticTokensProvider.ts` — `DocumentSemanticTokensProvider` that combines variable tracking + tokenization
- `src/extension.ts` — Entry point, registers providers
- `src/constants.ts` — Shared prop names, JS keywords, builtins, token type definitions

## Conventions

- TypeScript strict mode
- Tests in `test/` using vitest, fixtures in `test/fixtures/`
- esbuild for bundling (vscode marked as external)
- No runtime dependency on vscode API in `src/ast/` and `src/tokenizer/` (keeps them unit-testable)

## Versioning Roadmap

- **v0.1** (current) — Syntax highlighting via TextMate + semantic tokens
- **v0.2** — Diagnostics via `vscode.languages.createDiagnosticCollection`
- **v0.3** — Embedded LSP with Volar, ESLint integration
- **v0.4** — Prettier formatting
