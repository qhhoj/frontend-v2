import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router';
import type { useSessionStore } from '@/stores/session.store';
import { safeRedirect } from './safe-redirect';

type SessionStore = ReturnType<typeof useSessionStore>;

/**
 * `redirect` is always an in-app path (`safeRedirect`), never a URL typed into the query. API-level gates
 * (`two_factor_required`, `password_change_required` answered to a request) re-run these rules through
 * `onGateRequired` (`router/index.ts`).
 */
/**
 * A link credential (`/activate/:key`, `/reset-password/:token`, and the social signup page whose `?token=` is the
 * credential) is never copied into `redirect`: the gate is reached without it, so the key stays out of query strings,
 * history entries and any page without `no-referrer`.
 */
const LINK_CREDENTIAL_PATH = /^\/(activate\/|reset-password\/|register\/social$)/;
const withRedirect = (to: RouteLocationNormalized) =>
  LINK_CREDENTIAL_PATH.test(to.path) ? {} : { redirect: safeRedirect(to.fullPath) };
const toLogin = (to: RouteLocationNormalized): RouteLocationRaw => ({
  name: 'login',
  query: withRedirect(to),
});

/** A `redirect` of `/` is the default, so it is not carried. */
const loginQuery = (redirect: unknown) => {
  const safe = safeRedirect(redirect);
  return safe === '/' ? {} : { redirect: safe };
};

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
      : { name: 'login', query: loginQuery(to.query.redirect) };
  if (session.passwordChangeRequired && to.name !== 'account-password')
    return {
      name: 'account-password',
      query: LINK_CREDENTIAL_PATH.test(to.path) ? {} : loginQuery(to.fullPath),
    };
  if (to.meta.requiresAuth && session.status !== 'authenticated') return toLogin(to);
  if (to.meta.guestOnly && session.status === 'authenticated') return { name: 'home' };
  if (to.meta.staffOnly && !session.isStaff) return notFound(to);
  return true;
}
