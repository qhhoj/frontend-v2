import { onMounted, onScopeDispose, watch } from 'vue';
import type { Ref } from 'vue';
import { i18n, translate } from '@/i18n';
import { COPIED_FEEDBACK_MS, clipboardAvailable, copyText } from '@/lib/clipboard';

/** One copy bar: the button and its polite live region. `copied` is the 2 s confirmation. */
interface CopyBar {
  button: HTMLButtonElement;
  text: HTMLElement;
  status: HTMLElement;
  copied: boolean;
  resetTimer?: ReturnType<typeof setTimeout>;
}

const HEADING = 'h1,h2,h3,h4,h5,h6';
const BOLD_TAGS = ['STRONG', 'B'];

/** The sample's title row: a heading, or a paragraph that is only bold text ("Ví dụ vào"), right before the block. */
function titleRowOf(block: HTMLElement): HTMLElement | null {
  const previous = block.previousElementSibling;
  if (!(previous instanceof HTMLElement)) return null;
  if (previous.matches(HEADING)) return previous;
  const bold = previous.children[0];
  const isBoldLine =
    previous.tagName === 'P' &&
    previous.children.length === 1 &&
    BOLD_TAGS.includes(bold?.tagName ?? '') &&
    previous.textContent?.trim() === bold?.textContent?.trim();
  return isBoldLine ? previous : null;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/** The two-sheets "copy" glyph, drawn in the button's text colour. */
function copyIcon(): SVGElement {
  const icon = document.createElementNS(SVG_NS, 'svg');
  icon.setAttribute('viewBox', '0 0 16 16');
  icon.setAttribute('aria-hidden', 'true');
  icon.setAttribute('class', 'copy-icon');
  const back = document.createElementNS(SVG_NS, 'path');
  back.setAttribute('d', 'M5.5 2.5h7v8h-7zM3.5 5.5v8h7');
  icon.append(back);
  return icon;
}

/** Wraps every titled `pre` (title row + block) in `.sample`, and each two neighbouring samples (input, output) in `.sample-pair`, so CSS can lay them side by side. */
function pairSamples(root: HTMLElement) {
  const samples: HTMLElement[] = [];
  for (const block of root.querySelectorAll<HTMLElement>('pre')) {
    if (block.parentElement?.matches('.sample')) continue;
    const title = titleRowOf(block);
    if (!title) continue;
    const sample = document.createElement('div');
    sample.className = 'sample';
    title.before(sample);
    sample.append(title, block);
    samples.push(sample);
  }
  for (let index = 0; index + 1 < samples.length; index++) {
    const [first, second] = [samples[index], samples[index + 1]];
    if (!first || !second || first.nextElementSibling !== second) continue;
    const pair = document.createElement('div');
    pair.className = 'sample-pair';
    first.before(pair);
    pair.append(first, second);
    index++;
  }
}

/**
 * Adds a copy button to every `pre` in backend-sanitized HTML (samples have no structured form yet, backend ask B22).
 * Right after a title row the button joins that row (right-aligned, no extra line above the box); otherwise a bar
 * sits above the block. Either way it is a sibling above the block, never inside it: the button covers no sample
 * text and its focus ring is not cut by the block's scroll box. `v-html` replaces the whole subtree when `html`
 * changes, so the bars are made again after each render; a `pre` that already has its bar is skipped. Without
 * the Clipboard API no bar is added and the sample stays selectable text.
 */
export function useCopyableBlocks(root: Ref<HTMLElement | null>, html: Ref<string>) {
  const bars = new Set<CopyBar>();

  /** Visible text and accessible name agree (WCAG 2.5.3): the idle name only extends the visible "Copy". */
  const label = (bar: CopyBar) => {
    bar.text.textContent = translate(bar.copied ? 'common.copied' : 'common.copy');
    if (bar.copied) bar.button.removeAttribute('aria-label');
    else bar.button.setAttribute('aria-label', translate('problem.copySample'));
    bar.status.textContent = bar.copied ? translate('common.copied') : '';
  };

  function addBar(block: HTMLElement) {
    const text = block.textContent ?? '';
    const titleRow = titleRowOf(block);
    const element = document.createElement('div');
    element.className = titleRow ? 'copy-bar-inline' : 'copy-bar';
    const bar: CopyBar = {
      button: document.createElement('button'),
      text: document.createElement('span'),
      status: document.createElement('span'),
      copied: false,
    };
    bar.status.className = 'sr-only';
    bar.status.setAttribute('aria-live', 'polite');
    bar.button.type = 'button';
    bar.button.className = 'copy-block';
    bar.button.append(copyIcon(), bar.text);
    const copyAndConfirm = async () => {
      if (!(await copyText(text))) return;
      bar.copied = true;
      label(bar);
      clearTimeout(bar.resetTimer);
      bar.resetTimer = setTimeout(() => {
        bar.copied = false;
        label(bar);
      }, COPIED_FEEDBACK_MS);
    };
    bar.button.addEventListener('click', () => void copyAndConfirm());
    label(bar);
    if (!titleRow) bar.button.classList.add('copy-bar-float');
    element.append(bar.button, bar.status);
    if (titleRow) {
      titleRow.classList.add('sample-title');
      const titleText = document.createElement('span');
      titleText.append(...titleRow.childNodes);
      titleRow.append(titleText);
      titleRow.append(element);
    } else block.before(element);
    bars.add(bar);
  }

  const addMissingBars = (container: HTMLElement) => {
    for (const block of container.querySelectorAll<HTMLElement>('pre')) {
      const previous = block.previousElementSibling;
      if (!previous?.matches('.copy-bar') && !previous?.querySelector('.copy-bar-inline'))
        addBar(block);
    }
  };
  const decorate = () => {
    const container = root.value;
    if (!container) return;
    if (clipboardAvailable()) addMissingBars(container);
    pairSamples(container);
  };
  onMounted(decorate);
  watch(html, decorate, { flush: 'post' });
  watch(
    () => i18n.global.locale.value,
    () => bars.forEach(label),
  );
  onScopeDispose(() => bars.forEach((bar) => clearTimeout(bar.resetTimer)));
}
