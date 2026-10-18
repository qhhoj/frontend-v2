import { afterEach, describe, expect, it, vi } from 'vitest';
import { highlightMarkdownBlocks, MAX_HIGHLIGHTED_BLOCKS } from './markdown-code-highlight';

/** Highlighting is done once every block that can be coloured has a span (blocks with no parser never get one). */
const settled = (root: HTMLElement) =>
  [...root.querySelectorAll('pre > code[class*="language-"]')]
    .filter((code) => /language-(cpp|c\+\+)$/i.test(code.className))
    .every((code) => code.querySelector('span'));

async function highlighted(html: string) {
  const root = document.createElement('div');
  root.innerHTML = html;
  const text = root.textContent;
  document.body.append(root);
  await highlightMarkdownBlocks(root);
  await vi.waitFor(() => expect(settled(root)).toBe(true));
  root.remove();
  expect(root.textContent).toBe(text); // the copy button copies exactly this
  return root;
}

describe('highlightMarkdownBlocks', () => {
  it('leaves a block without a language, and one with an unknown language, plain', async () => {
    const root = await highlighted(
      '<pre><code>int x = 1;</code></pre><pre><code class="language-brainfuck">+++</code></pre>',
    );
    expect(root.querySelector('span')).toBeNull();
  });

  it('keeps escaped HTML in a block as text', async () => {
    const root = await highlighted(
      '<pre><code class="language-cpp">string s = &quot;&lt;script&gt;alert(1)&lt;/script&gt;&quot;;</code></pre>',
    );
    expect(root.querySelector('script')).toBeNull();
    expect(root.querySelector('code')?.textContent).toContain('<script>alert(1)</script>');
  });

  it('colours at most 50 blocks per render and leaves the rest plain', async () => {
    const block = '<pre><code class="language-cpp">return 1;</code></pre>';
    const root = document.createElement('div');
    root.innerHTML = block.repeat(MAX_HIGHLIGHTED_BLOCKS + 3);
    document.body.append(root);
    await highlightMarkdownBlocks(root);
    await vi.waitFor(() =>
      expect(root.querySelectorAll('code .syn-keyword')).toHaveLength(MAX_HIGHLIGHTED_BLOCKS),
    );
    root.remove();
  });
});

describe('loading the highlighter', () => {
  afterEach(() => vi.doUnmock('./code-highlight'));

  /** A fresh `highlightMarkdownBlocks` whose highlighter module is a stub that records when it is loaded and used. */
  async function withStubbedHighlighter() {
    const loaded = vi.fn();
    const showCode = vi.fn();
    vi.resetModules();
    vi.doMock('./code-highlight', () => {
      loaded();
      return { showCode };
    });
    const { highlightMarkdownBlocks: highlight } = await import('./markdown-code-highlight');
    return { highlight, loaded, showCode };
  }
  const rootOf = (html: string) => {
    const root = document.createElement('div');
    root.innerHTML = html;
    return root;
  };

  it('does not load it for content without a fenced block, or with only a language it cannot parse', async () => {
    const { highlight, loaded, showCode } = await withStubbedHighlighter();
    await highlight(rootOf('<p>Cho n.</p><pre>4 4\n1 2 5</pre><pre><code>x</code></pre>'));
    await highlight(rootOf('<pre><code class="language-brainfuck">+++</code></pre>'));
    expect(loaded).not.toHaveBeenCalled();
    expect(showCode).not.toHaveBeenCalled();
  });

  it('loads it once for content with a parsable fence and colours only that block', async () => {
    const { highlight, loaded, showCode } = await withStubbedHighlighter();
    const root = rootOf(
      '<pre><code class="language-brainfuck">+++</code></pre><pre><code class="language-cpp">int x;</code></pre>',
    );
    await highlight(root);
    await highlight(root);
    expect(loaded).toHaveBeenCalledTimes(1);
    expect(showCode.mock.calls.map(([, source, ace]) => [source, ace])).toEqual([
      ['int x;', 'c_cpp'],
      ['int x;', 'c_cpp'],
    ]);
    expect(showCode.mock.calls[0]![0]).toBe(root.querySelector('code.language-cpp'));
  });

  it('keeps the blocks plain and does not throw when the highlighter chunk fails to load', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.resetModules();
    vi.doMock('./code-highlight', () => {
      throw new Error('Failed to fetch dynamically imported module');
    });
    const { highlightMarkdownBlocks: highlight } = await import('./markdown-code-highlight');
    const root = rootOf('<pre><code class="language-cpp">int x;</code></pre>');
    await expect(highlight(root)).resolves.toBeUndefined();
    expect(root.textContent).toBe('int x;');
    expect(warn).toHaveBeenCalledOnce();
  });
});
