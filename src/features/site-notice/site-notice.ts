/** The misc config key whose text the site shows to every visitor above the page (legacy `top_notification`), as plain text. */
export const SITE_NOTICE_KEY = 'top_notification';
const DISMISSED_KEY = 'qhhoj.site-notice.dismissed';

/** A short, stable fingerprint of the notice: a new text shows again even after the old one was dismissed. */
export function noticeFingerprint(text: string): string {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1)
    hash = (Math.imul(hash, 31) + text.charCodeAt(index)) | 0;
  return `${text.length}:${hash >>> 0}`;
}

/** Storage can be missing or refuse (private mode): the notice then simply shows again. */
export function readDismissed(): string | null {
  try {
    return localStorage.getItem(DISMISSED_KEY);
  } catch {
    return null;
  }
}

export function writeDismissed(fingerprint: string): void {
  try {
    localStorage.setItem(DISMISSED_KEY, fingerprint);
  } catch {
    // Not remembered: it shows again on the next visit.
  }
}
