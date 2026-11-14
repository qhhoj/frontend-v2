import { onBeforeUnmount, onMounted } from 'vue';
import { isTypingTarget } from '@/lib/typing-target';

export type ShellShortcut = 'palette' | 'page-search';

/**
 * The site's two search keys, outside text fields and editors (where Ctrl+K edits text on a Mac): Ctrl+K or ⌘K opens
 * the palette; a bare `/` goes to the page's own search. Null for any other key, a chord with Shift or Alt, an IME
 * composition, a key a widget handled, or a key typed into a field.
 */
export function shellShortcutOf(event: KeyboardEvent): ShellShortcut | null {
  if (event.defaultPrevented || event.isComposing || event.altKey) return null;
  if (isTypingTarget(event.target)) return null;
  if (event.ctrlKey || event.metaKey)
    return !event.shiftKey && event.key.toLowerCase() === 'k' ? 'palette' : null;
  return event.key === '/' ? 'page-search' : null;
}

/** A dialog, sheet, popup menu or popover is open: the keys belong to it. */
const OVERLAY = '[role="dialog"][aria-modal="true"], .p-menu-overlay, .p-popover';
const isOverlayOpen = () => document.querySelector(OVERLAY) !== null;

/** The page's own search box: the first search field in `main` (a list's `FilterBar`). */
const pageSearchField = () =>
  document.querySelector<HTMLInputElement>('#main input[type="search"]');

/**
 * Listens for the search keys while the public shell is mounted and no overlay is open. `/` focuses the page's search
 * box, or opens the palette on a page without one; Ctrl+K opens the palette.
 */
export function useShellShortcuts(openPalette: () => void) {
  const onKeydown = (event: KeyboardEvent) => {
    const shortcut = shellShortcutOf(event);
    if (!shortcut || isOverlayOpen()) return;
    event.preventDefault();
    const field = shortcut === 'page-search' ? pageSearchField() : null;
    if (field) field.focus();
    else openPalette();
  };
  onMounted(() => window.addEventListener('keydown', onKeydown));
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
}
