import { useRoute, useRouter } from 'vue-router';
import { preloadRoute } from '@/router/preload';
import { safeRedirect } from '@/router/safe-redirect';
import { useSessionStore } from '@/stores/session.store';
import { clearSocialReturn, takeSocialReturn } from './social-return';

/** Starts downloading the page after sign-in while the sign-in request is still on its way. */
export function usePreloadAfterSignIn() {
  const route = useRoute();
  const router = useRouter();
  return () => preloadRoute(router, safeRedirect(route.query.redirect));
}

/**
 * The step every sign-in ends with (password, social signup, second factor). It only routes: the shell's
 * `useAccountCacheSync` drops the previous account's data when the user id changes. Goes to the safe `redirect`
 * or, while a second factor is pending, to the 2FA page carrying it. `resumeSocial`: a page a social sign-in lands on,
 * which has no `redirect` of its own and takes the path kept before the provider round trip.
 */
export function useAfterSignIn(resumeSocial = false) {
  const session = useSessionStore();
  const route = useRoute();
  const router = useRouter();
  return async () => {
    if (!resumeSocial) clearSocialReturn(); // a password sign-in ends any social attempt left open
    const asked = safeRedirect(route.query.redirect);
    const redirect = asked === '/' && resumeSocial ? (takeSocialReturn() ?? '/') : asked;
    // `/` is the default, so it is not carried (the same rule as the guards' `loginQuery`).
    const query = redirect === '/' ? {} : { redirect };
    await router.push(session.status === 'partial' ? { name: 'login-2fa', query } : redirect);
  };
}
