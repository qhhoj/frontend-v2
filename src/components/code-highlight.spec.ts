import { describe, expect, it } from 'vitest';
import { highlightedNodes } from './code-highlight';

const textOf = (nodes: Node[]) => nodes.map((node) => node.textContent).join('');
const spans = (nodes: Node[]) =>
  nodes.filter((node): node is HTMLElement => node instanceof HTMLElement);
const classOf = (nodes: Node[], text: string) =>
  spans(nodes).find((span) => span.textContent === text)?.className;

describe('highlightedNodes', () => {
  const cpp = '// note\nint main() { return 42; }\nconst char* s = "hi";\n';

  it('wraps C++ keywords, strings and comments in the matching token classes', async () => {
    const nodes = (await highlightedNodes(cpp, 'c_cpp'))!;
    expect(classOf(nodes, 'return')).toBe('syn-keyword');
    expect(classOf(nodes, '"hi"')).toBe('syn-string');
    expect(classOf(nodes, '// note')).toBe('syn-comment');
    expect(classOf(nodes, '42')).toBe('syn-number');
  });

  it('keeps the text exactly equal to the source, line breaks and blank lines included', async () => {
    const source = '\n\nint  x;\t// c\n\n\nreturn 0;\r\n';
    expect(textOf((await highlightedNodes(source, 'c_cpp'))!)).toBe(source);
  });

  it('returns null (show plain) for an unknown language, no language, and a failed pack', async () => {
    expect(await highlightedNodes(cpp, 'pascal')).toBeNull();
    expect(await highlightedNodes(cpp, null)).toBeNull();
  });

  it('builds HTML-looking code as text, never as elements', async () => {
    const source = 'const char* s = "<script>alert(1)</script>"; // <img src=x onerror=alert(1)>';
    const nodes = (await highlightedNodes(source, 'c_cpp'))!;
    const host = document.createElement('pre');
    host.append(...nodes);
    expect(host.querySelector('script, img')).toBeNull();
    expect(host.textContent).toBe(source);
  });

  it('leaves a source over 5000 lines or 200 000 characters plain', async () => {
    expect(await highlightedNodes('int x;\n'.repeat(5001), 'c_cpp')).toBeNull();
    expect(await highlightedNodes(`// ${'x'.repeat(200_001)}`, 'c_cpp')).toBeNull();
    expect(await highlightedNodes('int x;\n'.repeat(4999), 'c_cpp')).not.toBeNull();
  });
});
