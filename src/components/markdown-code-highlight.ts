import { aceForFenceName } from './code-language-keys';
import { showCode } from './code-highlight';

const FENCE_PREFIX = 'language-';

function fenceName(code: Element): string | null {
  const fence = [...code.classList].find((name) => name.startsWith(FENCE_PREFIX));
  return fence ? fence.slice(FENCE_PREFIX.length) : null;
}

/** Each block is parsed on the main thread: past this many in one render the rest stay plain. */
export const MAX_HIGHLIGHTED_BLOCKS = 50;

/**
 * Colours every fenced `pre > code.language-xxx` under `root` (the backend's Markdown output). A block without
 * a language, or with one we have no parser for, stays plain: nothing is guessed. The block's text never changes.
 */
export function highlightMarkdownBlocks(root: ParentNode) {
  const blocks = [...root.querySelectorAll('pre > code[class*="language-"]')];
  for (const code of blocks.slice(0, MAX_HIGHLIGHTED_BLOCKS)) {
    const name = fenceName(code);
    const ace = name === null ? null : aceForFenceName(name);
    if (ace !== null) void showCode(code as HTMLElement, code.textContent ?? '', ace);
  }
}
