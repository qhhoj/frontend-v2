/** True when the key goes to something that takes text (or a code editor), where `/` must type a slash. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  // `closest` too: an editor's inner node, and environments without `isContentEditable` (jsdom).
  if (
    target.isContentEditable ||
    target.closest('[contenteditable]:not([contenteditable="false"])')
  )
    return true;
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true;
  if (!(target instanceof HTMLInputElement)) return false;
  return !['checkbox', 'radio', 'button', 'submit', 'reset', 'range', 'color', 'file'].includes(
    target.type,
  );
}
