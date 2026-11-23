import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useSessionStore } from '@/stores/session.store';
import { canUseAdmin } from '../admin-access';
import { useRecentScreens } from './recent/recent-screens';

/**
 * The check both shells run above an admin-area page: whether the viewer may open the screen on the route (its
 * `permission` or `capability`). The caller renders `AdminForbidden` instead of the page, so a forbidden screen never
 * asks for its data. Each screen the viewer may open joins the dashboard's recent list.
 */
export function useScreenAccess() {
  const route = useRoute();
  const session = useSessionStore();
  const isAllowed = computed(() =>
    canUseAdmin(session.user, {
      permission: route.meta.permission ?? null,
      capability: route.meta.capability,
    }),
  );
  const { remember } = useRecentScreens();
  watch(
    () => route.fullPath,
    () => {
      // The site shell keeps its gate's scope alive until the next page renders: a public page is never remembered.
      if (route.meta.adminArea && isAllowed.value) remember(route);
    },
    { immediate: true },
  );
  return isAllowed;
}
