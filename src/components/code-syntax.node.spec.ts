import { ensureSyntaxTree } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { highlightTree } from '@lezer/highlight';
import { describe, expect, it } from 'vitest';
import { loadLanguagePack } from './code-languages';
import { syntaxStyle } from './code-syntax';

async function classesOf(ace: string, doc: string) {
  const pack = await loadLanguagePack(ace);
  const state = EditorState.create({ doc, extensions: pack ? [pack] : [] });
  const tree = ensureSyntaxTree(state, state.doc.length, 5000)!;
  const classes = new Map<string, string>();
  highlightTree(tree, syntaxStyle, (from, to, cls) => classes.set(doc.slice(from, to), cls));
  return classes;
}

describe('syntaxStyle', () => {
  it('colours C++ keywords, types, numbers, strings, comments and functions with six distinct styles', async () => {
    const classes = await classesOf(
      'c_cpp',
      '// note\nint lis(int a) { return 42 + a; }\nconst char* s = "hi";',
    );
    const picks = ['return', 'int', '42', '"hi"', '// note', 'lis'].map((token) =>
      classes.get(token),
    );
    expect(picks.every(Boolean)).toBe(true);
    expect(new Set(picks).size).toBe(6);
  });

  // Each case: one line of source and the token each category should land on (the five colour names are the style's categories).
  const lines: Array<{
    ace: string;
    source: string;
    keyword: string;
    type?: string;
    number: string;
    string: string;
    function: string;
  }> = [
    {
      ace: 'python',
      source: 'def lis(a): return 42 if a else "hi"',
      keyword: 'return',
      number: '42',
      string: '"hi"',
      function: 'lis',
    },
    {
      ace: 'java',
      source: 'class A { int f(int a) { return lis(42); } String s = "hi"; }',
      keyword: 'return',
      type: 'int',
      number: '42',
      string: '"hi"',
      function: 'lis',
    },
    {
      ace: 'javascript',
      source: 'function lis(a) { return 42 + a; } const s = "hi";',
      keyword: 'return',
      number: '42',
      string: '"hi"',
      function: 'lis',
    },
    {
      ace: 'rust',
      source: 'fn lis(a: i32) -> i32 { return 42; } let s = "hi";',
      keyword: 'return',
      type: 'i32',
      number: '42',
      string: '"hi"',
      function: 'lis',
    },
    {
      ace: 'golang',
      source: 'func lis(a int) int { return 42 }; var s = "hi"',
      keyword: 'return',
      type: 'int',
      number: '42',
      string: '"hi"',
      function: 'lis',
    },
  ];

  it.each(lines)(
    'colours $ace keywords, numbers, strings, types and function names apart',
    async (line) => {
      const classes = await classesOf(line.ace, line.source);
      const picks = [
        line.keyword,
        line.number,
        line.string,
        line.function,
        ...(line.type ? [line.type] : []),
      ].map((token) => classes.get(token));
      expect(picks.every(Boolean), `every token coloured: ${picks.join(' | ')}`).toBe(true);
      expect(new Set(picks).size).toBe(picks.length);
    },
  );
});
