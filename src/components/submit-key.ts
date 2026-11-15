/** A held Ctrl Enter repeats the key: only the first press may submit, or each repeat would spend an attempt. */
export function isRepeatedSubmitKey(
  event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'repeat'>,
): boolean {
  return event.repeat && event.key === 'Enter' && (event.ctrlKey || event.metaKey);
}
