/** Chromium and Safari report key code 229 for a key that an input method takes (Vietnamese Telex, for one). */
const IME_KEY_CODE = 229;

/** The key belongs to an input method composing text, not to the page. */
export const isComposing = (event: KeyboardEvent) =>
  event.isComposing || event.keyCode === IME_KEY_CODE;

/**
 * Leaves a key to the input method composing with it: true when the page must ignore it. An Escape is also cancelled, since
 * the browser would otherwise close the dialog around the field on its own (`cancel`) and lose the typed text.
 */
export function yieldsToComposition(event: KeyboardEvent) {
  if (!isComposing(event)) return false;
  if (event.key === 'Escape') event.preventDefault();
  return true;
}
