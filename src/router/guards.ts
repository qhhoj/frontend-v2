import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router';
import type { useSessionStore } from '@/stores/session.store';
import { safeRedirect } from './safe-redirect';

type SessionStore = ReturnType<typeof useSessionStore>;

/**
 * Only page navigations are routed here. API-level gates (`csrf_failed`, `two_factor_required`,
 * `password_change_required` answered to a request) are not turned into redirects; that is sub-project 8b.
 * `redirect` is always an in-app path (`safeRedirect`), never a URL typed into the query.
 */
const withRedirect = (to: RouteLocationNormalized) => ({ redirect: safeRedirect(to.fullPath) });
const toLogin = (to: RouteLocationNormalized): RouteLocationRaw => ({
  name: 'login',
  query: withRedirect(to),
});

/** `to.path` is percent-encoded and the router encodes params again, so decode first. */
const decodeSegment = (segment: string) => {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
};

/** Renders not-found at the same URL. */
const notFound = (to: RouteLocationNormalized): RouteLocationRaw => ({
  name: 'not-found',
  params: { pathMatch: to.path.slice(1).split('/').map(decodeSegment) },
  query: to.query,
  hash: to.hash,
});

/** Session-dependent routing rules, in order; spec "Routing". */
export async function resolveNavigation(
  to: RouteLocationNormalized,
  session: SessionStore,
): Promise<true | RouteLocationRaw> {
  try {
    await session.ensureLoaded();
  } catch {
    return to.meta.requiresAuth ? toLogin(to) : true;
  }
  if (session.status === 'partial')
    return to.meta.allowPartial ? true : { name: 'login-2fa', query: withRedirect(to) };
  // The 2FA step exists only for a pending second factor; anyone else is sent on (the redirect is re-guarded).
  if (to.name === 'login-2fa')
    return session.status === 'authenticated'
      ? safeRedirect(to.query.redirect)
      : { name: 'login', query: { redirect: safeRedirect(to.query.redirect) } };
  if (session.passwordChangeRequired && to.name !== 'account-password')
    return { name: 'account-password' };
  if (to.meta.requiresAuth && session.status !== 'authenticated') return toLogin(to);
  if (to.meta.guestOnly && session.status === 'authenticated') return { name: 'home' };
  if (to.meta.staffOnly && !session.isStaff) return notFound(to);
  return true;
}
