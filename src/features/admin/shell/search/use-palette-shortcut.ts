import { onBeforeUnmount, onMounted } from 'vue';
import { isTypingTarget } from '@/lib/typing-target';

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

/** The hint on the search button, shared with the public rail. */
export { shortcutHint } from '@/lib/shortcut-hint';
