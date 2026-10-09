import { onScopeDispose, watch } from 'vue';
import { openEventStream } from '@/api/events';
import type { EventStream } from '@/api/events';
import { createSettleWindow } from '@/features/tickets/settle-window';
import { useSessionStore } from '@/stores/session.store';
import { useViewerId } from '@/stores/use-viewer-id';
import { useInvalidateNotifications } from './notifications.queries';

export const USER_STREAM_PATH = '/events/user';
/** Nudges arriving within a second refresh the reads once. */
const SETTLE_MS = 1000;

/**
 * The tab's one `/events/user` stream (B1 C5, ids only). Opens for a signed-in viewer, reopens for the next account,
 * closes on sign-out and unmount. A refused stream stays closed: the 60 s poll carries on.
 */
export function useNotificationStream() {
  const session = useSessionStore();
  const viewer = useViewerId();
  const invalidate = useInvalidateNotifications();
  let stream: EventStream | null = null;
  const burst = createSettleWindow(SETTLE_MS, () => void invalidate());
  const stop = () => {
    burst.cancel();
    stream?.close();
    stream = null;
  };
  const follow = () => {
    stop();
    if (session.user === null) return;
    stream = openEventStream(USER_STREAM_PATH, {
      notification: () => burst.add(),
      resync: () => void invalidate(),
    });
  };
  // A primitive source: `session.refresh()` replaces `session.user` and must not reopen the stream (per-user cap of 12).
  watch(() => (session.user === null ? null : viewer.value), follow, { immediate: true });
  onScopeDispose(stop);
}
