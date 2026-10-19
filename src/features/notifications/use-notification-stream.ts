import { useLiveStream } from '@/api/events';
import { createSettleWindow } from '@/lib/settle-window';
import { useSessionStore } from '@/stores/session.store';
import { useViewerId } from '@/stores/use-viewer-id';
import { notificationsKey } from './notifications.queries';

/** Nudges arriving within a second refresh the reads once. */
const SETTLE_MS = 1000;

/**
 * The tab's one `/events/user` stream (B1 C5, ids only). Opens for a signed-in viewer, reopens for the next account,
 * closes on sign-out and unmount. A refused stream stays closed: the 60 s poll carries on.
 */
export function useNotificationStream() {
  const session = useSessionStore();
  const viewer = useViewerId();
  const burst = createSettleWindow(SETTLE_MS, () => void live.refresh());
  // `session.refresh()` replaces `session.user`; the same viewer keeps its stream (per-user cap of 12).
  const live = useLiveStream(
    () => (session.user === null ? null : { route: '/events/user', viewer: viewer.value }),
    {
      frames: { notification: () => burst.add() },
      cacheKey: () => notificationsKey(viewer.value),
      onClose: () => burst.cancel(),
    },
  );
}
