# React Native WebView Lens

JavaScript syntax highlighting for `react-native-webview`'s `injectedJavaScript` and `injectedJavaScriptBeforeContentLoaded` props.

## The Problem

When using `react-native-webview`, injected scripts are plain strings — your editor treats them as such, with no syntax highlighting, no keyword coloring, and no visual distinction from regular text.

This extension detects those scripts and applies JavaScript syntax highlighting to them.

## Supported Patterns

### Case 1 — Inline template literal

```tsx
<WebView injectedJavaScript={`document.body.style.backgroundColor = 'red';`} />
```

### Case 2 — Variable in the same scope

```tsx
export default function App() {
  const script = `document.body.style.backgroundColor = 'red';`;
  return <WebView injectedJavaScript={script} />;
}
```

### Case 3 — Variable outside the component

```tsx
const INJECTED_SCRIPT = `document.body.style.backgroundColor = 'red';`;

export default function App() {
  return <WebView injectedJavaScript={INJECTED_SCRIPT} />;
}
```

All three patterns work with both `injectedJavaScript` and `injectedJavaScriptBeforeContentLoaded`.

## How It Works

- **Inline template literals** (Case 1) use a TextMate injection grammar for zero-cost syntax highlighting
- **Variable references** (Cases 2 & 3) use AST analysis with `@typescript-eslint/typescript-estree` to trace variable declarations and apply semantic token highlighting

## Activation

The extension activates only when `react-native-webview` is found in your workspace's `node_modules`.

## Supported File Types

`.js`, `.jsx`, `.ts`, `.tsx`

## Known Limitations (v0.1)

- Variable tracking only works within the same file
- Nested template literals inside injected scripts may not highlight correctly in the inline case
- Only template literal strings (backticks) are supported — regular strings assigned to variables are not highlighted
- Variable shadowing is not handled — the first matching declaration is used

## Development

```bash
npm install
npm run build
npm test
```

Press **F5** in VSCode to launch the Extension Development Host for manual testing.

## License

MIT
