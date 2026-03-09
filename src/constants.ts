export const TARGET_PROP_NAMES = [
  'injectedJavaScript',
  'injectedJavaScriptBeforeContentLoaded',
] as const;

export const SEMANTIC_TOKEN_TYPES = [
  'comment',
  'keyword',
  'string',
  'number',
  'regexp',
  'variable',
  'function',
  'property',
] as const;

export const SEMANTIC_TOKEN_MODIFIERS = [
  'declaration',
  'defaultLibrary',
] as const;

export const JS_KEYWORDS = new Set([
  'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
  'default', 'delete', 'do', 'else', 'export', 'extends', 'false',
  'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof',
  'let', 'new', 'null', 'of', 'return', 'super', 'switch', 'this',
  'throw', 'true', 'try', 'typeof', 'undefined', 'var', 'void',
  'while', 'with', 'yield', 'async', 'await', 'static',
]);

export const JS_BUILTINS = new Set([
  'document', 'window', 'console', 'navigator', 'localStorage',
  'sessionStorage', 'setTimeout', 'setInterval', 'clearTimeout',
  'clearInterval', 'fetch', 'JSON', 'Math', 'Array', 'Object',
  'String', 'Number', 'Boolean', 'Date', 'RegExp', 'Promise',
  'Error', 'Map', 'Set', 'Symbol', 'Proxy', 'Reflect',
  'WebSocket', 'XMLHttpRequest', 'FormData', 'URL',
  'URLSearchParams', 'Event', 'EventTarget', 'Node', 'Element',
  'HTMLElement', 'parseInt', 'parseFloat', 'isNaN', 'isFinite',
  'encodeURIComponent', 'decodeURIComponent', 'encodeURI', 'decodeURI',
  'atob', 'btoa', 'alert', 'confirm', 'prompt',
]);
