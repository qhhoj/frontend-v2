import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import type { Ref } from 'vue';
import { dismissingClicks, topDialog } from './modal-dialog';

/** The gap between the opener and the panel, and the panel's least distance from the viewport edge. */
const GAP_PX = 8;
const hasPopoverApi = () => typeof HTMLElement.prototype.showPopover === 'function';
const hasAnchorPositioning = () => globalThis.CSS?.supports?.('anchor-name', '--qh-popup') ?? false;
let popupCount = 0;

/** `value` kept between `GAP_PX` and `room - size - GAP_PX` (at `GAP_PX` when the panel is larger than the room). */
const clampInto = (value: number, size: number, room: number) =>
  Math.max(GAP_PX, Math.min(value, room - size - GAP_PX));

/**
 * The fallback positioner (no CSS anchor positioning): under the opener, left-aligned, flipped above it when it does not fit
 * below, and kept on screen both ways (`styles.css` caps the panel at the viewport less the gaps). Fixed viewport coordinates.
 */
export function placeBesideOpener(panel: HTMLElement, opener: HTMLElement) {
  const anchor = opener.getBoundingClientRect();
  const { width, height } = panel.getBoundingClientRect();
  const { clientWidth, clientHeight } = document.documentElement;
  const below = anchor.bottom + GAP_PX;
  const above = anchor.top - GAP_PX - height;
  const top = below + height > clientHeight && above >= 0 ? above : below;
  panel.style.top = `${clampInto(top, height, clientHeight)}px`;
  panel.style.left = `${clampInto(anchor.left, width, clientWidth)}px`;
}

/**
 * One popup panel (`Popover`, `Menu`, the `ComboBox` list), shown while `isOpen` (`open(opener)`, `close()`). The panel renders
 * in `host` (inside the open modal dialog when there is one, since the rest of the page is inert, else `<body>`), carries
 * `data-popup` (`styles.css`), and is shown in the top layer as a manual popover: over every z-index, never clipped.
 * It sits beside its opener by CSS anchor positioning, else by `placeBesideOpener` on open, scroll, resize and any size change
 * of the opener or the panel. It closes when its opener leaves the page. A click outside the panel and its opener calls
 * `onOutsideClick` and is marked (`dismissingClicks`), so a dismissable dialog under it stays open; each part handles its keys.
 */
export function usePopup(panel: Readonly<Ref<HTMLElement | null>>, onOutsideClick: () => void) {
  const isOpen = ref(false);
  const opener = shallowRef<HTMLElement | null>(null);
  const anchorName = `--qh-popup-${++popupCount}`;
  const host = computed(() => topDialog.value ?? 'body');

  let isAnchored = false;
  /** Both paths: a removed opener closes the panel; without anchors, the panel follows it. */
  function follow() {
    if (!opener.value?.isConnected) {
      isOpen.value = false;
      return;
    }
    if (!isAnchored && panel.value) placeBesideOpener(panel.value, opener.value);
  }
  const sizes = typeof ResizeObserver === 'function' ? new ResizeObserver(follow) : null;
  function onDocumentClick(event: MouseEvent) {
    const target = event.target as Node;
    if (panel.value?.contains(target) || opener.value?.contains(target)) return;
    dismissingClicks.add(event);
    onOutsideClick();
  }

  function show(element: HTMLElement, from: HTMLElement) {
    if (hasPopoverApi()) element.showPopover();
    isAnchored = hasAnchorPositioning();
    if (isAnchored) {
      from.style.setProperty('anchor-name', anchorName);
      element.style.setProperty('position-anchor', anchorName);
    }
    follow();
    sizes?.observe(from);
    sizes?.observe(element);
    addEventListener('scroll', follow, { capture: true, passive: true });
    addEventListener('resize', follow, { passive: true });
    document.addEventListener('click', onDocumentClick, true);
  }
  function stopListening() {
    sizes?.disconnect();
    removeEventListener('scroll', follow, { capture: true });
    removeEventListener('resize', follow);
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
