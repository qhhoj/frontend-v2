import { aceForFenceName } from './code-language-keys';

const FENCE_PREFIX = 'language-';

function fenceName(code: Element): string | null {
  const fence = [...code.classList].find((name) => name.startsWith(FENCE_PREFIX));
  return fence ? fence.slice(FENCE_PREFIX.length) : null;
}

/** Each block is parsed on the main thread: past this many in one render the rest stay plain. */
export const MAX_HIGHLIGHTED_BLOCKS = 50;

/** The fenced blocks under `root` that have a parser, with the parser's ace mode. Cheap: no editor code is involved. */
function codeBlocksWithParser(root: ParentNode) {
  const found: { code: HTMLElement; ace: string }[] = [];
  for (const code of root.querySelectorAll<HTMLElement>('pre > code[class*="language-"]')) {
    const name = fenceName(code);
    const ace = name === null ? null : aceForFenceName(name);
    if (ace !== null) found.push({ code, ace });
  }
  return found.slice(0, MAX_HIGHLIGHTED_BLOCKS);
}

/**
 * Colours every fenced `pre > code.language-xxx` under `root` (the backend's Markdown output). A block without
 * a language, or with one we have no parser for, stays plain: nothing is guessed. The block's text never changes,
 * and the plain text is already in its box, so colours arriving later move nothing.
 *
 * The highlighter pulls in the editor's core chunk (about 260 kB), so it is imported only when the content has
 * a block it can colour; a statement without fences fetches no editor code. A chunk that fails to load leaves the blocks plain.
 */
export async function highlightMarkdownBlocks(root: ParentNode) {
  const blocks = codeBlocksWithParser(root);
  if (blocks.length === 0) return;
  try {
    const { showCode } = await import('./code-highlight');
    for (const { code, ace } of blocks) void showCode(code, code.textContent ?? '', ace);
  } catch (error) {
    console.warn('code highlighter failed to load', error);
  }
}
