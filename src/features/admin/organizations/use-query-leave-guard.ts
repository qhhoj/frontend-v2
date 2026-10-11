import { ref, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { onBeforeRouteUpdate, useRouter } from 'vue-router';
import type { RouteLocationNormalized } from 'vue-router';

/**
 * The query-string twin of `useDirtyGuard`: the organization editor lives on one route, and opening another organization or
 * another tab only changes the query, which `onBeforeRouteLeave` never sees. `leaves(to, from)` says whether that change
 * unmounts the form; a dirty form then asks first (`AdminLeaveDialog`), and Leave repeats the navigation once.
 */
export function useQueryLeaveGuard(
  isDirty: MaybeRefOrGetter<boolean>,
  leaves: (to: RouteLocationNormalized, from: RouteLocationNormalized) => boolean,
) {
  const router = useRouter();
  const isLeaveOpen = ref(false);
  let pending: RouteLocationNormalized | null = null;
  let isApproved = false;

  onBeforeRouteUpdate((to, from) => {
    if (isApproved || !toValue(isDirty) || !leaves(to, from)) return true;
    pending = to;
    isLeaveOpen.value = true;
    return false;
  });

  function leaveAnyway() {
    isLeaveOpen.value = false;
    const destination = pending;
    pending = null;
    if (!destination) return;
    isApproved = true;
    void router.push(destination.fullPath).finally(() => (isApproved = false));
  }

  return { isLeaveOpen, leaveAnyway };
}
