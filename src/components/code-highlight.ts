import { highlightCode } from '@lezer/highlight';
import './code-highlight.css';
import { loadLanguagePack } from './code-languages';
import { syntaxClasses } from './code-syntax';

/** Bigger sources stay plain: parsing and spans for them would stall the page. */
export const MAX_HIGHLIGHT_CHARS = 200_000;
export const MAX_HIGHLIGHT_LINES = 5000;

function isTooLarge(source: string) {
  if (source.length > MAX_HIGHLIGHT_CHARS) return true;
  let lines = 1;
  for (let at = source.indexOf('\n'); at !== -1; at = source.indexOf('\n', at + 1)) lines++;
  return lines > MAX_HIGHLIGHT_LINES;
}

/**
 * The source as text nodes and class-only spans, built from the text itself (never parsed as HTML), so
 * concatenating their text gives back exactly `source`. `null` means show it plain: no parser for `ace`,
 * a source too large, or a parser chunk that failed to load.
 */
export async function highlightedNodes(source: string, ace: string | null): Promise<Node[] | null> {
  if (ace === null || isTooLarge(source)) return null;
  const support = await loadLanguagePack(ace);
  if (!support) return null;
  const nodes: Node[] = [];
  highlightCode(
    source,
    support.language.parser.parse(source),
    syntaxClasses,
    (text, classes) => {
      if (!classes) return nodes.push(document.createTextNode(text));
      const span = document.createElement('span');
      span.className = classes;
      span.textContent = text;
      nodes.push(span);
    },
    () => nodes.push(document.createTextNode('\n')),
  );
  return nodes;
}

/** The newest `showCode` call per target; an older call that finishes later must not repaint. */
const latestCall = new WeakMap<HTMLElement, number>();
let callCount = 0;

/** Shows `source` in `target` at once as plain text, then swaps in the coloured nodes when they are ready, unless a newer call for `target` has started. */
export async function showCode(target: HTMLElement, source: string, ace: string | null) {
  const call = ++callCount;
  latestCall.set(target, call);
  target.textContent = source;
  const nodes = await highlightedNodes(source, ace);
  if (nodes && target.isConnected && latestCall.get(target) === call)
    target.replaceChildren(...nodes);
}
