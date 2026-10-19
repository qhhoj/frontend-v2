import { computed, ref, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { useLiveStream } from '@/api/events';
import type { LiveTarget } from '@/api/events';
import { translate } from '@/i18n';
import { createSettleWindow } from '@/lib/settle-window';
import { useViewerId } from '@/stores/use-viewer-id';

const SETTLE_MS = 1000;
type TicketRoute = '/events/tickets' | '/events/tickets/{id}';

/** What one settled burst says: the status change when there was one, else the number of events. */
function describeBurst(ticketId: string | null, lastStatus: boolean | null, count: number) {
  if (lastStatus !== null)
    return translate(lastStatus ? 'ticket.live.reopened' : 'ticket.live.closed');
  return translate(ticketId ? 'ticket.live.messages' : 'ticket.live.updated', { count }, count);
}

/**
 * Live ticket updates (E20): ids only, so each burst refetches the tickets once and is announced once.
 * The feed follows the ticket id (null: the list) and the viewer: a change closes the old stream and opens a new one.
 */
export function useTicketStream(ticketId: MaybeRefOrGetter<string | null>) {
  const viewer = useViewerId();
  const announcement = ref('');
  let lastStatus: boolean | null = null;
  const burst = createSettleWindow(SETTLE_MS, (count) => {
    announcement.value = describeBurst(toValue(ticketId), lastStatus, count);
    lastStatus = null;
    void live.refresh();
  });
  const onEvent = (frame: { open?: boolean | null }) => {
    if (typeof frame.open === 'boolean') lastStatus = frame.open;
    burst.add();
  };
  const target = (): LiveTarget<TicketRoute> => {
    const id = toValue(ticketId);
    return id
      ? { route: '/events/tickets/{id}', params: { id }, viewer: viewer.value }
      : { route: '/events/tickets', viewer: viewer.value };
  };
  const live = useLiveStream(target, {
    frames: { 'new-ticket': onEvent, 'ticket-message': onEvent, 'ticket-status': onEvent },
    cacheKey: () => ['tickets'],
    /** Nothing of the closed feed reaches the page afterwards. */
    onClose: () => {
      burst.cancel();
      lastStatus = null;
      announcement.value = '';
    },
  });
  return { isLive: computed(() => !live.paused.value), announcement };
}
