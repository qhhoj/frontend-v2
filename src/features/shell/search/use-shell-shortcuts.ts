import { onBeforeUnmount, onMounted } from 'vue';
import { isTypingTarget } from '@/lib/typing-target';
import { RAIL_WIDE_QUERY, useRailCollapse } from '../use-rail-collapse';

export type ShellShortcut = 'palette' | 'page-search' | 'rail';

/**
 * The site's keys, outside text fields and editors (where Ctrl+K edits text on a Mac): Ctrl+K or ⌘K opens
 * the palette; a bare `/` goes to the page's own search; a bare `[` collapses or expands the rail. Null for any other key, a chord with Shift or Alt, an IME
 * composition, a key a widget handled, or a key typed into a field.
 */
export function shellShortcutOf(event: KeyboardEvent): ShellShortcut | null {
  if (event.defaultPrevented || event.isComposing || event.altKey) return null;
  if (isTypingTarget(event.target)) return null;
  if (event.ctrlKey || event.metaKey)
    return !event.shiftKey && event.key.toLowerCase() === 'k' ? 'palette' : null;
  if (event.key === '[') return 'rail';
  return event.key === '/' ? 'page-search' : null;
}

/** A dialog, sheet, popup menu or popover is open: the keys belong to it. */
const OVERLAY = '[role="dialog"][aria-modal="true"], [data-popup]';
const isOverlayOpen = () => document.querySelector(OVERLAY) !== null;

/** The page's own search box: the first search field in `main` (a list's `FilterBar`). */
const pageSearchField = () =>
  document.querySelector<HTMLInputElement>('#main input[type="search"]');

/**
 * Listens for the search keys while the public shell is mounted and no overlay is open. `/` focuses the page's search
 * box, or opens the palette on a page without one; Ctrl+K opens the palette.
 */
export function useShellShortcuts(openPalette: () => void) {
  const { toggle: toggleRail } = useRailCollapse();
  const onKeydown = (event: KeyboardEvent) => {
    const shortcut = shellShortcutOf(event);
    if (!shortcut || isOverlayOpen()) return;
    if (shortcut === 'rail') {
      // The rail is always icons below 1100 px: the key has nothing to toggle there.
      if (matchMedia(RAIL_WIDE_QUERY).matches) toggleRail();
      return;
    }
    event.preventDefault();
    const field = shortcut === 'page-search' ? pageSearchField() : null;
    if (field) field.focus();
    else openPalette();
  };
  onMounted(() => window.addEventListener('keydown', onKeydown));
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
}
