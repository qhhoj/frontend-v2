import { onBeforeUnmount, onMounted, ref, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRouter } from 'vue-router';
import type { RouteLocationNormalized } from 'vue-router';

const isSameParams = (to: RouteLocationNormalized, from: RouteLocationNormalized) =>
  JSON.stringify(to.params) === JSON.stringify(from.params);

/**
 * Leaving the route (or closing the tab) with unsaved changes asks first. In the app the question is `AdminLeaveDialog`
 * (or `AdminLeaveGuard`, which wires both); a reload or close gets the browser's own prompt.
 * `isDirty` is read on every attempt. Leave repeats the navigation once; Stay keeps the changes.
 */
export function useLeaveGuard(isDirty: MaybeRefOrGetter<boolean>) {
  const router = useRouter();
  const isLeaveOpen = ref(false);
  let pendingLeave: RouteLocationNormalized | null = null;
  let isApproved = false;

  const keepUnsaved = (event: BeforeUnloadEvent) => {
    if (toValue(isDirty)) event.preventDefault();
  };
  onMounted(() => window.addEventListener('beforeunload', keepUnsaved));
  onBeforeUnmount(() => window.removeEventListener('beforeunload', keepUnsaved));

  function askBeforeLeaving(to: RouteLocationNormalized) {
    if (isApproved) {
      isApproved = false;
      return true;
    }
    if (!toValue(isDirty)) return true;
    pendingLeave = to;
    isLeaveOpen.value = true;
    return false;
  }

  onBeforeRouteLeave(askBeforeLeaving);
  // The same component shown for another entity (`:code`, `:key`) is an update, not a leave; a query-only change is not.
  onBeforeRouteUpdate((to, from) => (isSameParams(to, from) ? true : askBeforeLeaving(to)));

  function leaveAnyway() {
    isLeaveOpen.value = false;
    const destination = pendingLeave;
    pendingLeave = null;
    if (!destination) return;
    isApproved = true;
    void router.push(destination.fullPath);
  }

  function stay() {
    isLeaveOpen.value = false;
    pendingLeave = null;
  }

  return { isLeaveOpen, leaveAnyway, stay };
}
