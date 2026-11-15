import { isTypingTarget } from '@/lib/typing-target';

/** A bare `s` outside a field or the editor: puts the caret in the submit pane's editor. */
export function isFocusEditorShortcut(event: KeyboardEvent): boolean {
  if (event.defaultPrevented || event.isComposing || event.repeat) return false;
  if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return false;
  return event.key === 's' && !isTypingTarget(event.target);
}

/** The hint on the submit button: ⌘ Enter on Apple systems, Ctrl Enter elsewhere (both work everywhere). */
export const submitShortcutHint = (platform = navigator.platform): string =>
  /Mac|iPhone|iPad/.test(platform) ? '⌘ Enter' : 'Ctrl Enter';
