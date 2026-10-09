import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { NotificationItem } from '@/api/types/notifications';
import { useSessionStore } from '@/stores/session.store';
import { useViewerId } from '@/stores/use-viewer-id';
import { isTargetGone } from './notification-target';
import { useMarkRead } from './notifications.queries';
import { useStaleNotificationsStore } from './stale-notifications';

export type OpenOutcome = 'opened' | 'stale' | 'busy';

/** Opening a row: probe its target, mark it read (never while viewing as someone else), then go there or keep it as old. */
export function useOpenNotification() {
  const router = useRouter();
  const session = useSessionStore();
  const viewer = useViewerId();
  const stale = useStaleNotificationsStore();
  const markReadMutation = useMarkRead();
  const isOpening = ref(false);
  const lastStaleId = ref<string | null>(null);
  /** The backend answers 204 and changes nothing under impersonation, so the SPA does not ask. */
  const canMarkRead = computed(() => session.impersonatorId === null);

  function markRead(item: NotificationItem) {
    if (canMarkRead.value && item.unread) markReadMutation.mutate(item.id);
  }

  async function open(item: NotificationItem): Promise<OpenOutcome> {
    if (isOpening.value) return 'busy';
    isOpening.value = true;
    try {
      const isGone = await isTargetGone(item.path);
      markRead(item);
      if (!isGone) {
        await router.push(item.path);
        return 'opened';
      }
      stale.markStale(viewer.value, item.id);
      lastStaleId.value = item.id;
      return 'stale';
    } finally {
      isOpening.value = false;
    }
  }

  const isStale = (id: string) => stale.isStale(viewer.value, id);
  return { open, markRead, isStale, canMarkRead, isOpening, lastStaleId };
}
