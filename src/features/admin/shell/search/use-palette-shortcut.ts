import { onBeforeUnmount, onMounted } from 'vue';

/** True when the key goes to something that takes text (or a code editor), where `/` must type a slash. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true;
  if (!(target instanceof HTMLInputElement)) return false;
  return !['checkbox', 'radio', 'button', 'submit', 'reset', 'range', 'color', 'file'].includes(
    target.type,
  );
}

/** Ctrl+K or ⌘K anywhere, or a bare `/` outside a text field: the keys that open the admin search. */
export function isPaletteShortcut(event: KeyboardEvent): boolean {
  if (event.defaultPrevented || event.isComposing || event.altKey) return false;
  const withModifier = event.ctrlKey || event.metaKey;
  if (withModifier) return !event.shiftKey && event.key.toLowerCase() === 'k';
  return event.key === '/' && !isTypingTarget(event.target);
}

/** Opens the palette on its shortcut for as long as the calling component is mounted. */
export function usePaletteShortcut(open: () => void) {
  const onKeydown = (event: KeyboardEvent) => {
    if (!isPaletteShortcut(event)) return;
    event.preventDefault();
    open();
  };
  onMounted(() => window.addEventListener('keydown', onKeydown));
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
}
