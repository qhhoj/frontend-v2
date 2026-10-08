import { onMounted, watch } from 'vue';
import type { Ref } from 'vue';
import { translate } from '@/i18n';
import { COPIED_FEEDBACK_MS, clipboardAvailable, copyText } from '@/lib/clipboard';

/**
 * Adds a copy button to every `pre` in backend-sanitized HTML (samples have no structured form yet, backend ask B22).
 * `v-html` replaces the whole subtree when `html` changes, so the buttons are made again after each render; a `pre`
 * that already has its button is skipped, so a second pass never duplicates. Without the Clipboard API no button is
 * added and the sample stays selectable text.
 */
export function useCopyableBlocks(root: Ref<HTMLElement | null>, html: Ref<string>) {
  const decorate = () => {
    if (!clipboardAvailable()) return;
    for (const block of root.value?.querySelectorAll('pre') ?? []) {
      if (!block.querySelector('button.copy-block')) addCopyButton(block);
    }
  };
  onMounted(decorate);
  watch(html, decorate, { flush: 'post' });
}

function addCopyButton(block: HTMLElement) {
  // Read before appending: the button's own label and the status text would otherwise end up in the copied text.
  const text = block.textContent ?? '';
  const status = document.createElement('span');
  status.className = 'sr-only';
  status.setAttribute('aria-live', 'polite');
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'copy-block';
  button.textContent = translate('common.copy');
  button.setAttribute('aria-label', translate('problem.copySample'));
  const announceCopied = async () => {
    if (!(await copyText(text))) return;
    button.textContent = translate('common.copied');
    status.textContent = translate('common.copied');
    setTimeout(() => {
      button.textContent = translate('common.copy');
      status.textContent = '';
    }, COPIED_FEEDBACK_MS);
  };
  button.addEventListener('click', () => void announceCopied());
  block.append(button, status);
}
