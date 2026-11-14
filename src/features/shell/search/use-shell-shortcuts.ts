import { onBeforeUnmount, onMounted } from 'vue';
import { isTypingTarget } from '@/lib/typing-target';

export type ShellShortcut = 'palette' | 'page-search';

/**
 * The site's two search keys: Ctrl+K or ⌘K anywhere opens the palette; a bare `/` outside a text field goes to the
 * page's own search. Null for any other key, a chord with Shift or Alt, an IME composition or a key a widget handled.
 */
export function shellShortcutOf(event: KeyboardEvent): ShellShortcut | null {
  if (event.defaultPrevented || event.isComposing || event.altKey) return null;
  if (event.ctrlKey || event.metaKey)
    return !event.shiftKey && event.key.toLowerCase() === 'k' ? 'palette' : null;
  return event.key === '/' && !isTypingTarget(event.target) ? 'page-search' : null;
}

/** The page's own search box: the first search field in `main` (a list's `FilterBar`). */
const pageSearchField = () =>
  document.querySelector<HTMLInputElement>('#main input[type="search"]');

/**
 * Listens for the search keys while the public shell is mounted. `/` focuses the page's search box, or opens the
 * palette on a page without one; Ctrl+K always opens the palette.
 */
export function useShellShortcuts(openPalette: () => void) {
  const onKeydown = (event: KeyboardEvent) => {
    const shortcut = shellShortcutOf(event);
    if (!shortcut) return;
    event.preventDefault();
    const field = shortcut === 'page-search' ? pageSearchField() : null;
    if (field) field.focus();
    else openPalette();
  };
  onMounted(() => window.addEventListener('keydown', onKeydown));
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
}
