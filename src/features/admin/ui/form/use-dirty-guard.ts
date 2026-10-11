import { onBeforeUnmount, onMounted, ref, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { onBeforeRouteLeave, useRouter } from 'vue-router';
import type { RouteLocationNormalized } from 'vue-router';

/**
 * Leaving the route (or closing the tab) with unsaved changes asks first. In the app the question is `AdminLeaveDialog`
 * (or `AdminLeaveGuard`, which wires both); a reload or close gets the browser's own prompt.
 * `isDirty` is read on every attempt. Leave repeats the navigation once; Stay keeps the changes.
 */
export function useDirtyGuard(isDirty: MaybeRefOrGetter<boolean>) {
  const router = useRouter();
  const isLeaveOpen = ref(false);
  let pendingLeave: RouteLocationNormalized | null = null;
  let isApproved = false;

  const keepUnsaved = (event: BeforeUnloadEvent) => {
    if (toValue(isDirty)) event.preventDefault();
  };
  onMounted(() => window.addEventListener('beforeunload', keepUnsaved));
  onBeforeUnmount(() => window.removeEventListener('beforeunload', keepUnsaved));

  onBeforeRouteLeave((to) => {
    if (isApproved) {
      isApproved = false;
      return true;
    }
    if (!toValue(isDirty)) return true;
    pendingLeave = to;
    isLeaveOpen.value = true;
    return false;
  });

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
