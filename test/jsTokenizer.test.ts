import { describe, it, expect } from 'vitest';
import { tokenizeJs } from '../src/tokenizer/jsTokenizer';

describe('jsTokenizer', () => {
  it('classifies keywords', () => {
    const tokens = tokenizeJs('const x = 1; return x;');
    const keywords = tokens.filter((t) => t.type === 'keyword');
    expect(keywords.map((k) => ({ startChar: k.startChar, length: k.length })))
      .toEqual([
        { startChar: 0, length: 5 },  // const
        { startChar: 13, length: 6 }, // return
      ]);
  });

  it('classifies single-quoted strings', () => {
    const tokens = tokenizeJs("const x = 'hello';");
    const strings = tokens.filter((t) => t.type === 'string');
    expect(strings).toHaveLength(1);
    expect(strings[0].startChar).toBe(10);
    expect(strings[0].length).toBe(7); // 'hello'
  });

  it('classifies double-quoted strings', () => {
    const tokens = tokenizeJs('const x = "world";');
    const strings = tokens.filter((t) => t.type === 'string');
    expect(strings).toHaveLength(1);
    expect(strings[0].length).toBe(7); // "world"
  });

  it('classifies numbers', () => {
    const tokens = tokenizeJs('42 3.14 0xff 0b101 0o77');
    const numbers = tokens.filter((t) => t.type === 'number');
    expect(numbers).toHaveLength(5);
  });

  it('classifies line comments', () => {
    const tokens = tokenizeJs('x // this is a comment\ny');
    const comments = tokens.filter((t) => t.type === 'comment');
    expect(comments).toHaveLength(1);
    expect(comments[0].startChar).toBe(2);
  });

  it('classifies block comments', () => {
    const tokens = tokenizeJs('x /* block */ y');
    const comments = tokens.filter((t) => t.type === 'comment');
    expect(comments).toHaveLength(1);
    expect(comments[0].length).toBe(11); // /* block */
  });

  it('classifies property access', () => {
    const tokens = tokenizeJs('document.body.style');
    const props = tokens.filter((t) => t.type === 'property');
    expect(props.map((p) => p.startChar)).toEqual([9, 14]); // body, style
  });

  it('classifies function calls', () => {
    const tokens = tokenizeJs('console.log("hi")');
    const fns = tokens.filter((t) => t.type === 'function');
    expect(fns).toHaveLength(1);
    expect(fns[0].startChar).toBe(8); // log
  });

  it('classifies built-in globals with defaultLibrary modifier', () => {
    const tokens = tokenizeJs('document');
    expect(tokens).toHaveLength(1);
    expect(tokens[0].type).toBe('variable');
    expect(tokens[0].modifiers).toBe(1 << 1); // defaultLibrary
  });

  it('handles multi-line input with correct positions', () => {
    const tokens = tokenizeJs('const x = 1;\nconst y = 2;');
    const keywords = tokens.filter((t) => t.type === 'keyword');
    expect(keywords).toHaveLength(2);
    expect(keywords[0]).toMatchObject({ line: 0, startChar: 0 });
    expect(keywords[1]).toMatchObject({ line: 1, startChar: 0 });
  });

  it('handles escaped characters in strings', () => {
    const tokens = tokenizeJs("'hello\\'world'");
    const strings = tokens.filter((t) => t.type === 'string');
    expect(strings).toHaveLength(1);
    expect(strings[0].length).toBe(14);
  });

  it('handles empty input', () => {
    const tokens = tokenizeJs('');
    expect(tokens).toHaveLength(0);
  });
});
