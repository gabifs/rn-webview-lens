import * as vscode from 'vscode';
import {
  InjectedJsSemanticTokensProvider,
  legend,
} from './providers/semanticTokensProvider';

const SUPPORTED_LANGUAGES = [
  { language: 'javascript', scheme: 'file' },
  { language: 'javascriptreact', scheme: 'file' },
  { language: 'typescript', scheme: 'file' },
  { language: 'typescriptreact', scheme: 'file' },
];

export function activate(context: vscode.ExtensionContext) {
  const provider = new InjectedJsSemanticTokensProvider();

  const disposable = vscode.languages.registerDocumentSemanticTokensProvider(
    SUPPORTED_LANGUAGES,
    provider,
    legend,
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
