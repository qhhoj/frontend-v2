import { useRoute, useRouter } from 'vue-router';
import { safeRedirect } from '@/router/safe-redirect';
import { useSessionStore } from '@/stores/session.store';

/**
 * The step every sign-in ends with (password, social signup, second factor). It only routes: the shell's
 * `useAccountCacheSync` drops the previous account's data when the user id changes. Goes to the safe `redirect`
 * or, while a second factor is pending, to the 2FA page carrying it.
 */
export function useAfterSignIn() {
  const session = useSessionStore();
  const route = useRoute();
  const router = useRouter();
  return async () => {
    const redirect = safeRedirect(route.query.redirect);
    // `/` is the default, so it is not carried (the same rule as the guards' `loginQuery`).
    const query = redirect === '/' ? {} : { redirect };
    await router.push(session.status === 'partial' ? { name: 'login-2fa', query } : redirect);
  };
}
