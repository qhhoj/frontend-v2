import { describe, expect, it, vi } from 'vitest';
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
  highlightMarkdownBlocks(root);
  await vi.waitFor(() => expect(settled(root)).toBe(true));
  root.remove();
  expect(root.textContent).toBe(text); // the copy button copies exactly this
  return root;
}

describe('highlightMarkdownBlocks', () => {
  it('colours a language-cpp block, also under its c++ alias', async () => {
    for (const name of ['cpp', 'c++', 'CPP']) {
      const root = await highlighted(
        `<pre><code class="language-${name}">int x = 1;\nreturn x;\n</code></pre>`,
      );
      expect(root.querySelector('code .syn-keyword')?.textContent).toBe('return');
    }
  });

  it('leaves a block without a language, and one with an unknown language, plain', async () => {
    const root = await highlighted(
      '<pre><code>int x = 1;</code></pre><pre><code class="language-brainfuck">+++</code></pre>',
    );
    expect(root.querySelector('span')).toBeNull();
  });

  it('does not touch inline code', async () => {
    const root = await highlighted('<p><code class="language-cpp">int</code></p>');
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
    highlightMarkdownBlocks(root);
    await vi.waitFor(() =>
      expect(root.querySelectorAll('code .syn-keyword')).toHaveLength(MAX_HIGHLIGHTED_BLOCKS),
    );
    root.remove();
  });
});
