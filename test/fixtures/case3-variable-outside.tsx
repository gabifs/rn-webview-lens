import React from 'react';
import { WebView } from 'react-native-webview';

const INJECTED_SCRIPT = `document.body.style.backgroundColor = 'red';`;

export default function App() {
  return (
    <WebView
      source={{ uri: 'https://example.com' }}
      injectedJavaScript={INJECTED_SCRIPT}
    />
  );
}
