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

  it('leaves a plain identifier uncoloured', async () => {
    expect((await classesOf('c_cpp', 'int lis(int a) { return a; }')).get('a')).toBeUndefined();
  });

  it('colours Python too', async () => {
    const classes = await classesOf('python', '# note\ndef lis(a):\n    return 42\n');
    expect(classes.get('return')).toBeTruthy();
    expect(classes.get('42')).not.toBe(classes.get('return'));
  });
});
