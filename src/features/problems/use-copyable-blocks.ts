import { onMounted, onScopeDispose, watch } from 'vue';
import type { Ref } from 'vue';
import { i18n, translate } from '@/i18n';
import { COPIED_FEEDBACK_MS, clipboardAvailable, copyText } from '@/lib/clipboard';

/** One copy bar: the button and its polite live region. `copied` is the 2 s confirmation. */
interface CopyBar {
  button: HTMLButtonElement;
  status: HTMLElement;
  copied: boolean;
  resetTimer?: ReturnType<typeof setTimeout>;
}

/**
 * Adds a copy bar (button right-aligned) above every `pre` in backend-sanitized HTML (samples have no structured
 * form yet, backend ask B22). The bar is a sibling above the block, never inside it: the button covers no sample
 * text and its focus ring is not cut by the block's scroll box. `v-html` replaces the whole subtree when `html`
 * changes, so the bars are made again after each render; a `pre` that already has its bar is skipped. Without
 * the Clipboard API no bar is added and the sample stays selectable text.
 */
export function useCopyableBlocks(root: Ref<HTMLElement | null>, html: Ref<string>) {
  const bars = new Set<CopyBar>();

  /** Visible text and accessible name agree (WCAG 2.5.3): the idle name only extends the visible "Copy". */
  const label = (bar: CopyBar) => {
    bar.button.textContent = translate(bar.copied ? 'common.copied' : 'common.copy');
    if (bar.copied) bar.button.removeAttribute('aria-label');
    else bar.button.setAttribute('aria-label', translate('problem.copySample'));
    bar.status.textContent = bar.copied ? translate('common.copied') : '';
  };

  function addBar(block: HTMLElement) {
    const text = block.textContent ?? '';
    const element = document.createElement('div');
    element.className = 'copy-bar';
    const bar: CopyBar = {
      button: document.createElement('button'),
      status: document.createElement('span'),
      copied: false,
    };
    bar.status.className = 'sr-only';
    bar.status.setAttribute('aria-live', 'polite');
    bar.button.type = 'button';
    bar.button.className = 'copy-block';
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
    element.append(bar.button, bar.status);
    block.before(element);
    bars.add(bar);
  }

  const decorate = () => {
    if (!clipboardAvailable()) return;
    for (const block of root.value?.querySelectorAll<HTMLElement>('pre') ?? []) {
      if (!block.previousElementSibling?.matches('.copy-bar')) addBar(block);
    }
  };
  onMounted(decorate);
  watch(html, decorate, { flush: 'post' });
  watch(
    () => i18n.global.locale.value,
    () => bars.forEach(label),
  );
  onScopeDispose(() => bars.forEach((bar) => clearTimeout(bar.resetTimer)));
}
