import React from 'react';
import { WebView } from 'react-native-webview';

export default function App() {
  const jsCode = `document.body.style.backgroundColor = 'red';`;
  return (
    <WebView
      source={{ uri: 'https://example.com' }}
      injectedJavaScript={jsCode}
    />
  );
}
