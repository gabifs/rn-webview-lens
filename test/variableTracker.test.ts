import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { trackVariables } from '../src/ast/variableTracker';

function readFixture(name: string): string {
  return readFileSync(join(__dirname, 'fixtures', name), 'utf-8');
}

describe('variableTracker', () => {
  it('case 1 — inline template literal is tracked', () => {
    const source = readFixture('case1-inline.tsx');
    const results = trackVariables(source);
    expect(results).toHaveLength(1);
    expect(results[0].variableName).toBe('<inline:injectedJavaScript>');
    expect(results[0].content).toBe(
      "document.body.style.backgroundColor = 'red';",
    );
  });

  it('case 2 — variable in same scope is tracked', () => {
    const source = readFixture('case2-variable.tsx');
    const results = trackVariables(source);
    expect(results).toHaveLength(1);
    expect(results[0].variableName).toBe('jsCode');
    expect(results[0].content).toBe(
      "document.body.style.backgroundColor = 'red';",
    );
  });

  it('case 3 — variable outside component is tracked', () => {
    const source = readFixture('case3-variable-outside.tsx');
    const results = trackVariables(source);
    expect(results).toHaveLength(1);
    expect(results[0].variableName).toBe('INJECTED_SCRIPT');
    expect(results[0].content).toBe(
      "document.body.style.backgroundColor = 'red';",
    );
  });

  it('tracks both props on the same component', () => {
    const source = `
import React from 'react';
import { WebView } from 'react-native-webview';

const scriptA = \`console.log('a')\`;
const scriptB = \`console.log('b')\`;

export default function App() {
  return (
    <WebView
      injectedJavaScript={scriptA}
      injectedJavaScriptBeforeContentLoaded={scriptB}
    />
  );
}`;
    const results = trackVariables(source);
    expect(results).toHaveLength(2);
    const names = results.map((r) => r.variableName).sort();
    expect(names).toEqual(['scriptA', 'scriptB']);
  });

  it('returns empty for non-template-literal variable', () => {
    const source = `
import React from 'react';
import { WebView } from 'react-native-webview';

const jsCode = getScript();

export default function App() {
  return <WebView injectedJavaScript={jsCode} />;
}`;
    const results = trackVariables(source);
    expect(results).toHaveLength(0);
  });

  it('tracks regular string variable (single/double quotes)', () => {
    const source = `
import React from 'react';
import { WebView } from 'react-native-webview';

const jsCode = "console.log('hello')";

export default function App() {
  return <WebView injectedJavaScript={jsCode} />;
}`;
    const results = trackVariables(source);
    expect(results).toHaveLength(1);
    expect(results[0].variableName).toBe('jsCode');
    expect(results[0].content).toBe("console.log('hello')");
  });

  it('returns empty when no target props are present', () => {
    const source = `
import React from 'react';
import { WebView } from 'react-native-webview';

export default function App() {
  return <WebView source={{ uri: 'https://example.com' }} />;
}`;
    const results = trackVariables(source);
    expect(results).toHaveLength(0);
  });
});
