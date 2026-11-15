import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import type { Ref } from 'vue';
import { topDialog } from './modal-dialog';

/** The gap between the opener and the panel, and the panel's least distance from the viewport edge. */
const GAP_PX = 8;
const hasPopoverApi = () => typeof HTMLElement.prototype.showPopover === 'function';
const hasAnchorPositioning = () => globalThis.CSS?.supports?.('anchor-name', '--qh-popup') ?? false;
let popupCount = 0;

/**
 * The fallback positioner (no CSS anchor positioning): under the opener, left-aligned, kept on screen, flipped above it when
 * it does not fit below. Fixed viewport coordinates, like the top layer.
 */
export function placeBesideOpener(panel: HTMLElement, opener: HTMLElement) {
  const anchor = opener.getBoundingClientRect();
  const { width, height } = panel.getBoundingClientRect();
  const { clientWidth, clientHeight } = document.documentElement;
  const below = anchor.bottom + GAP_PX;
  const above = anchor.top - GAP_PX - height;
  const top = below + height > clientHeight && above >= 0 ? above : below;
  const left = Math.max(GAP_PX, Math.min(anchor.left, clientWidth - width - GAP_PX));
  panel.style.top = `${top}px`;
  panel.style.left = `${left}px`;
}

/**
 * One popup panel (`Popover`, `Menu`, the `ComboBox` list), shown while `isOpen` (`open(opener)`, `close()`). The panel renders
 * in `host` (inside the open modal dialog when there is one, since the rest of the page is inert, else `<body>`), carries
 * `data-popup` (`styles.css`), and is shown in the top layer as a manual popover: over every z-index, never clipped.
 * It sits beside its opener by CSS anchor positioning, else by `placeBesideOpener` on open, scroll and resize.
 * A click outside the panel and its opener calls `onOutsideClick`; each part handles its own keys.
 */
export function usePopup(panel: Readonly<Ref<HTMLElement | null>>, onOutsideClick: () => void) {
  const isOpen = ref(false);
  const opener = shallowRef<HTMLElement | null>(null);
  const anchorName = `--qh-popup-${++popupCount}`;
  const host = computed(() => topDialog.value ?? 'body');

  const reposition = () =>
    panel.value && opener.value && placeBesideOpener(panel.value, opener.value);
  function onDocumentClick(event: MouseEvent) {
    const target = event.target as Node;
    if (panel.value?.contains(target) || opener.value?.contains(target)) return;
    onOutsideClick();
  }

  function show(element: HTMLElement, from: HTMLElement) {
    if (hasPopoverApi()) element.showPopover();
    if (hasAnchorPositioning()) {
      from.style.setProperty('anchor-name', anchorName);
      element.style.setProperty('position-anchor', anchorName);
    } else {
      reposition();
      addEventListener('scroll', reposition, { capture: true, passive: true });
      addEventListener('resize', reposition, { passive: true });
    }
    document.addEventListener('click', onDocumentClick, true);
  }
  function stopListening() {
    removeEventListener('scroll', reposition, { capture: true });
    removeEventListener('resize', reposition);
    document.removeEventListener('click', onDocumentClick, true);
    opener.value?.style.removeProperty('anchor-name');
  }
  watch(
    panel,
    (element) => {
      if (element && opener.value) show(element, opener.value);
      else stopListening();
    },
    { flush: 'post' },
  );
  onBeforeUnmount(stopListening);

  return {
    isOpen,
    opener,
    host,
    open(from: HTMLElement | null) {
      opener.value = from;
      isOpen.value = true;
    },
    close() {
      isOpen.value = false;
    },
  };
}
