import { computed } from 'vue';
import { useSessionStore } from './session.store';

export const ANONYMOUS_VIEWER = 'anonymous';

/** The signed-in user's id, or `anonymous`: the part of an account-owned query key that keeps one account's answer from another's. */
export const useViewerId = () => {
  const session = useSessionStore();
  return computed(() => session.user?.id ?? ANONYMOUS_VIEWER);
};
