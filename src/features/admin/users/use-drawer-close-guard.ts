import { ref, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { onBeforeRouteUpdate, useRouter } from 'vue-router';
import type { RouteLocationNormalized } from 'vue-router';

/**
 * Closing the drawer with unsaved changes asks first: the close button, Escape and the scrim (`requestClose`), and a
 * same-route navigation to another `?user=` (browser back). Leaving the route is `AdminLeaveGuard`'s job.
 */
export function useDrawerCloseGuard(
  username: () => string,
  dirtyCount: MaybeRefOrGetter<number>,
  close: () => void,
) {
  const router = useRouter();
  const isLeaveOpen = ref(false);
  let pending: RouteLocationNormalized | null = null;
  let isApproved = false;

  function requestClose() {
    if (toValue(dirtyCount) === 0) return close();
    pending = null;
    isLeaveOpen.value = true;
  }

  onBeforeRouteUpdate((to) => {
    if (isApproved || to.query.user === username() || toValue(dirtyCount) === 0) return true;
    pending = to;
    isLeaveOpen.value = true;
    return false;
  });

  function leaveAnyway() {
    isLeaveOpen.value = false;
    isApproved = true;
    const destination = pending;
    pending = null;
    if (destination) void router.push(destination.fullPath);
    else close();
  }

  return { isLeaveOpen, requestClose, leaveAnyway };
}
