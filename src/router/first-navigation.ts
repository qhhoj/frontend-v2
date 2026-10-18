import { computed } from 'vue';
import { useRoute } from 'vue-router';

/**
 * True until the app's first navigation lands. That navigation waits for the session (`resolveNavigation`), so meanwhile
 * the shell draws an optimistic frame (D-08): the header with a neutral placeholder for the account controls, no current
 * nav item, and a page skeleton in `main`. Nothing in it guesses who is signed in, and no page (nor its data) loads yet.
 */
export function useIsFirstNavigationPending() {
  const route = useRoute();
  return computed(() => route.matched.length === 0);
}
