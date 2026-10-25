import { readStorage, removeStorage, writeStorage } from '@/lib/storage';
import { safeRedirect } from '@/router/safe-redirect';

const KEY = 'qhhoj.social-return';
/** A sign-in at the provider takes seconds; an older note belongs to an abandoned attempt. */
export const SOCIAL_RETURN_TTL_MS = 10 * 60_000;

/**
 * The backend's social callback always lands on `/` (or the 2FA / signup page) and carries no return path, so the page
 * the viewer came from is kept here for the round trip. Only a same-origin path passes (`safeRedirect`, the rule the
 * password login uses); `/` is the default and is not kept.
 */
export function rememberSocialReturn(redirect: unknown, now = Date.now()): void {
  const path = safeRedirect(redirect);
  if (path === '/') removeStorage(KEY, 'session');
  else writeStorage(KEY, JSON.stringify({ path, at: now }), 'session');
}

/** The remembered path once, or `null`; the note is gone after the first read. The path is re-checked on the way out. */
export function takeSocialReturn(now = Date.now()): string | null {
  const raw = readStorage(KEY, 'session');
  removeStorage(KEY, 'session');
  if (raw === null) return null;
  try {
    const note = JSON.parse(raw) as { path?: unknown; at?: unknown };
    if (typeof note.at !== 'number' || now - note.at > SOCIAL_RETURN_TTL_MS) return null;
    const path = safeRedirect(note.path);
    return path === '/' ? null : path;
  } catch {
    return null;
  }
}
