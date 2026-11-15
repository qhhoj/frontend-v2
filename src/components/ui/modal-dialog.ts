import { computed, onBeforeUnmount, onMounted, onUnmounted, shallowReactive, watch } from 'vue';
import type { Ref } from 'vue';

/**
 * The open modal dialogs (`Modal`, `Drawer`), oldest first. `showModal()` makes the rest of the page inert, so the last one
 * alone hears Escape, and toasts and popups opened meanwhile render inside it (`topDialog`), the one part that is not inert.
 */
const openDialogs = shallowReactive<HTMLDialogElement[]>([]);
export const topDialog = computed<HTMLDialogElement | null>(() => openDialogs.at(-1) ?? null);
/** Clicks that closed a popup (`popup.ts`): the dismissable dialog under it does not close on the same click. */
export const dismissingClicks = new WeakSet<Event>();

/** The page stops scrolling under a modal; `scrollbar-gutter: stable` on `<html>` keeps the layout still. */
let scrollLocks = 0;
function lockScroll() {
  if (scrollLocks++ === 0) document.documentElement.style.overflow = 'hidden';
}
function unlockScroll() {
  if (--scrollLocks === 0) document.documentElement.style.overflow = '';
}

const isEscape = (event: KeyboardEvent) => event.key === 'Escape' || event.code === 'Escape';
/** A click on the `::backdrop` lands on the dialog itself, outside its box. */
function isBackdropClick(event: MouseEvent, dialog: HTMLDialogElement) {
  if (event.target !== dialog) return false;
  const box = dialog.getBoundingClientRect();
  const { clientX, clientY } = event;
  return clientX < box.left || clientX > box.right || clientY < box.top || clientY > box.bottom;
}

export interface ModalDialogOptions {
  /** Escape, the back gesture and the close button may close it (false while a step is busy). */
  isClosable: () => boolean;
  /** A click on the backdrop closes it too. */
  isDismissable: () => boolean;
  /** Where focus starts; the dialog itself when it returns null. */
  initialFocus: (dialog: HTMLDialogElement) => HTMLElement | null;
}

/**
 * A native modal `<dialog>` (rendered while `visible`): `showModal()` puts it in the top layer and makes the page inert, so
 * focus stays inside. Escape (only the top dialog's), the back gesture and a backdrop click (`isDismissable`) set `visible`
 * false; a busy one (`isClosable` false) stays, and reopens if the browser forces it shut. Focus returns to the element that
 * had it when the dialog opened, unless the closing action sent it elsewhere. Bind the returned handlers on the `<dialog>`.
 */
export function useModalDialog(
  dialog: Readonly<Ref<HTMLDialogElement | null>>,
  visible: Ref<boolean>,
  options: ModalDialogOptions,
) {
  let opener: HTMLElement | null = null;
  let pressedOnBackdrop = false;

  function open(element: HTMLDialogElement) {
    opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (typeof element.showModal === 'function') element.showModal();
    else element.setAttribute('open', ''); // jsdom
    openDialogs.push(element);
    lockScroll();
    (options.initialFocus(element) ?? element).focus();
  }

  function release(element: HTMLDialogElement) {
    const index = openDialogs.indexOf(element);
    if (index < 0) return;
    openDialogs.splice(index, 1);
    unlockScroll();
    const active = document.activeElement;
    const isFocusLost = !active || active === document.body || element.contains(active);
    if (element.open && typeof element.close === 'function') element.close();
    else element.removeAttribute('open'); // jsdom
    if (isFocusLost && opener?.isConnected) opener.focus();
    opener = null;
  }

  watch(
    dialog,
    (element, previous) => {
      if (previous) release(previous);
      if (element) open(element);
    },
    { flush: 'post' },
  );

  /** Only the top open dialog takes Escape; a closed one leaves it to the page (a search box, a native sheet). */
  function onKeydown(event: KeyboardEvent) {
    const element = dialog.value;
    if (!element || topDialog.value !== element) return;
    if (event.defaultPrevented || !isEscape(event)) return;
    event.preventDefault();
    if (options.isClosable()) visible.value = false;
  }
  onMounted(() => document.addEventListener('keydown', onKeydown));
  onUnmounted(() => document.removeEventListener('keydown', onKeydown));
  onBeforeUnmount(() => dialog.value && release(dialog.value));

  return {
    /**
     * The back gesture (Escape is handled above, so the browser never closes it on its own). A `cancel` that bubbles from a
     * field inside (a file picker dismissed) is not the dialog's.
     */
    onCancel(event: Event) {
      if (event.target !== event.currentTarget) return;
      event.preventDefault();
      if (options.isClosable()) visible.value = false;
    },
    /**
     * Shut by the browser despite `cancel` being refused: a busy dialog opens again. The event is queued, so it may come from
     * a dialog already closed by `release` (removed, or replaced by a reopen): those are ignored.
     */
    onClose(event: Event) {
      const element = event.currentTarget as HTMLDialogElement;
      if (element !== dialog.value || !element.isConnected) return;
      if (!visible.value || element.open) return;
      if (options.isClosable()) visible.value = false;
      else element.showModal();
    },
    /** Where the press began: a text selection dragged out onto the backdrop is not a backdrop click. */
    onPointerdown(event: PointerEvent) {
      pressedOnBackdrop = isBackdropClick(event, event.currentTarget as HTMLDialogElement);
    },
    onClick(event: MouseEvent) {
      const element = event.currentTarget as HTMLDialogElement;
      const isDismissed =
        pressedOnBackdrop && isBackdropClick(event, element) && !dismissingClicks.has(event);
      pressedOnBackdrop = false;
      if (isDismissed && options.isDismissable() && options.isClosable()) visible.value = false;
    },
  };
}
