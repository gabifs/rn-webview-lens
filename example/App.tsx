// @ts-nocheck
import React from 'react';
import { WebView } from 'react-native-webview';

// Case 1: Inline template literal
function InlineTemplateLiteral() {
  return (
    <WebView
      source={{ uri: 'https://example.com' }}
      injectedJavaScript={`
        const el = document.getElementById('root');
        if (el) {
          el.style.backgroundColor = 'red';
          el.style.color = '#fff';
          console.log('injected!');
        }
      `}
    />
  );
}

// Case 2: Variable in same scope (template literal)
function VariableSameScope() {
  const jsCode = `
    const items = document.querySelectorAll('.item');
    for (let i = 0; i < items.length; i++) {
      items[i].addEventListener('click', function(event) {
        event.preventDefault();
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'click',
          index: i,
        }));
      });
    }
  `;

  return (
    <WebView
      source={{ uri: 'https://example.com' }}
      injectedJavaScript={jsCode}
    />
  );
}

// Case 3: Variable outside component
const BEFORE_CONTENT_SCRIPT = `
  window.__APP_READY__ = false;

  document.addEventListener('DOMContentLoaded', function() {
    window.__APP_READY__ = true;
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0';
    document.head.appendChild(meta);
  });
`;

function VariableOutsideComponent() {
  return (
    <WebView
      source={{ uri: 'https://example.com' }}
      injectedJavaScriptBeforeContentLoaded={BEFORE_CONTENT_SCRIPT}
    />
  );
}

// Case 4: String literals (single and double quotes)
const SIMPLE_SCRIPT = "document.title = 'Hello from RN'";

function StringLiterals() {
  return (
    <WebView
      source={{ uri: 'https://example.com' }}
      injectedJavaScript={SIMPLE_SCRIPT}
      injectedJavaScriptBeforeContentLoaded={'console.log("before content loaded")'}
    />
  );
}

// Case 5: Both props on the same component
const initScript = `
  window.onerror = function(msg, url, line) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'error',
      message: msg,
      url: url,
      line: line,
    }));
    return true;
  };
`;

const mainScript = `
  // Wait for page to be ready
  setTimeout(function() {
    const links = document.querySelectorAll('a[href]');
    links.forEach(function(link) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'navigation',
          url: link.href,
        }));
      });
    });
  }, 500);
`;

function BothProps() {
  return (
    <WebView
      source={{ uri: 'https://example.com' }}
      injectedJavaScriptBeforeContentLoaded={initScript}
      injectedJavaScript={mainScript}
    />
  );
}

export { InlineTemplateLiteral, VariableSameScope, VariableOutsideComponent, StringLiterals, BothProps };
