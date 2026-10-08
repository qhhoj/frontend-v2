/** How long the "copied" confirmation stays visible. */
export const COPIED_FEEDBACK_MS = 2000;

/** Plain-http pages and some browsers have no Clipboard API; copy buttons are then not shown. */
export const clipboardAvailable = () =>
  typeof navigator !== 'undefined' && typeof navigator.clipboard?.writeText === 'function';

/** Copies plain text. False when there is no Clipboard API or the browser refuses the write. */
export async function copyText(text: string): Promise<boolean> {
  if (!clipboardAvailable()) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
