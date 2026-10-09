import { onBeforeUnmount, onMounted, ref } from 'vue';
import { onBeforeRouteLeave, useRouter } from 'vue-router';
import type { RouteLocationNormalized } from 'vue-router';

/**
 * Leaving a problem tab (or the page) while its draft is unsaved asks first, in the shared dialog (the pattern of the
 * backup-codes panel). Leave repeats the navigation once; Stay keeps the draft. A reload or close gets the browser's own prompt.
 */
export function useDraftLeaveGuard(isDirty: () => boolean) {
  const router = useRouter();
  const isLeaveOpen = ref(false);
  let pendingLeave: RouteLocationNormalized | null = null;
  let isApproved = false;

  const keepUnsaved = (event: BeforeUnloadEvent) => {
    if (isDirty()) event.preventDefault();
  };
  onMounted(() => window.addEventListener('beforeunload', keepUnsaved));
  onBeforeUnmount(() => window.removeEventListener('beforeunload', keepUnsaved));

  onBeforeRouteLeave((to) => {
    if (isApproved) {
      isApproved = false;
      return true;
    }
    if (!isDirty()) return true;
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

  return { isLeaveOpen, leaveAnyway };
}
