/** A held Ctrl Enter repeats the key: only the first press may submit, or each repeat would spend an attempt. */
export function isRepeatedSubmitKey(
  event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'repeat'>,
): boolean {
  return event.repeat && event.key === 'Enter' && (event.ctrlKey || event.metaKey);
}

/** Holding Enter on a focused button clicks it on every repeat; only the first press may click, so cancel the rest. */
export function blockHeldEnter(
  event: Pick<KeyboardEvent, 'key' | 'repeat' | 'preventDefault'>,
): void {
  if (event.repeat && event.key === 'Enter') event.preventDefault();
}
