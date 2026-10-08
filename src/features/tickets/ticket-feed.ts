import { openEventStream } from '@/api/events';
import type { EventStream } from '@/api/events';
import { translate } from '@/i18n';
import { createSettleWindow } from './settle-window';

const SETTLE_MS = 1000;

export interface TicketFeedOptions {
  /** Refetches the tickets once per settled burst (and at once on `resync`). */
  refetch: () => void;
  announce: (text: string) => void;
  /** A feed is about to open: the page clears its live state. */
  onOpened: () => void;
  /** The browser gave up on the feed for good. */
  onGaveUp: () => void;
}

/** What one settled burst says: the status change when there was one, else the number of events. */
export function describeBurst(ticketId: string | null, lastStatus: boolean | null, count: number) {
  if (lastStatus !== null)
    return translate(lastStatus ? 'ticket.live.reopened' : 'ticket.live.closed');
  return translate(ticketId ? 'ticket.live.messages' : 'ticket.live.updated', { count }, count);
}

const feedPath = (ticketId: string | null) =>
  ticketId ? `/events/tickets/${encodeURIComponent(ticketId)}` : '/events/tickets';

/** One feed at a time: `follow` closes the current feed and opens the one for `ticketId` (null: the list). */
export function createTicketFeed(options: TicketFeedOptions) {
  let stream: EventStream | null = null;
  let lastStatus: boolean | null = null;
  let currentId: string | null = null;
  const burst = createSettleWindow(SETTLE_MS, (count) => {
    options.announce(describeBurst(currentId, lastStatus, count));
    lastStatus = null;
    options.refetch();
  });
  const onEvent = (data: unknown) => {
    const open = (data as { open?: boolean | null }).open;
    if (typeof open === 'boolean') lastStatus = open;
    burst.add();
  };
  /** Closes the feed and forgets its pending burst: nothing from it reaches the page afterwards. */
  const stop = () => {
    burst.cancel();
    stream?.close();
    stream = null;
    lastStatus = null;
  };
  const follow = (ticketId: string | null) => {
    stop();
    currentId = ticketId;
    options.onOpened();
    stream = openEventStream(
      feedPath(ticketId),
      {
        'new-ticket': onEvent,
        'ticket-message': onEvent,
        'ticket-status': onEvent,
        resync: () => options.refetch(),
      },
      options.onGaveUp,
    );
  };
  return { follow, stop };
}
