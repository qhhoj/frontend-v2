import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { readStorage, removeStorage, writeStorage } from '@/lib/storage';
import { safeRedirect } from '@/router/safe-redirect';

const KEY = 'qhhoj.signup-return';
/** The activation mail may be opened in another tab or hours later, so the path is kept per browser, for a day. */
export const SIGNUP_RETURN_TTL_MS = 24 * 60 * 60_000;

/** `{ redirect }` for a link between the sign-in pages, or `{}`: only a same-origin path (`safeRedirect`) is carried on. */
export function useReturnQuery() {
  const route = useRoute();
  return computed(() => {
    const redirect = safeRedirect(route.query.redirect);
    return redirect === '/' ? {} : { redirect };
  });
}

/** Keeps the path a new user was sent from, for the sign-in that follows activation. `/` is the default and is not kept. */
export function rememberSignupReturn(redirect: unknown, now = Date.now()): void {
  const path = safeRedirect(redirect);
  if (path !== '/') writeStorage(KEY, JSON.stringify({ path, at: now }));
}

/** `{ redirect }` for the post-activation login, or `{}` when nothing fresh was kept. Taken once: the note is gone after the read, and the path is re-checked on the way out. */
export function takeSignupReturnQuery(now = Date.now()): { redirect?: string } {
  const raw = readStorage(KEY);
  removeStorage(KEY);
  if (raw === null) return {};
  try {
    const note = JSON.parse(raw) as { path?: unknown; at?: unknown };
    if (typeof note.at !== 'number' || now - note.at > SIGNUP_RETURN_TTL_MS) return {};
    const redirect = safeRedirect(note.path);
    return redirect === '/' ? {} : { redirect };
  } catch {
    return {};
  }
}
