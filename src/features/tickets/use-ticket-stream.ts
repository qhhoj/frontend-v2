import { useQueryClient } from '@tanstack/vue-query';
import { onScopeDispose, ref } from 'vue';
import { openEventStream } from '@/api/events';
import { translate } from '@/i18n';
import { createSettleWindow } from './settle-window';

const SETTLE_MS = 1000;

/** Live ticket updates (E20): ids only, so each burst refetches the tickets once and is announced once. */
export function useTicketStream(ticketId: string | null) {
  const client = useQueryClient();
  const isLive = ref(true);
  const announcement = ref('');
  let lastStatus: boolean | null = null;
  const refetch = () => client.invalidateQueries({ queryKey: ['tickets'] });
  const describe = (count: number) =>
    lastStatus !== null
      ? translate(lastStatus ? 'ticket.live.reopened' : 'ticket.live.closed')
      : translate(ticketId ? 'ticket.live.messages' : 'ticket.live.updated', { count }, count);
  const burst = createSettleWindow(SETTLE_MS, (count) => {
    announcement.value = describe(count);
    lastStatus = null;
    void refetch();
  });
  const onEvent = (data: unknown) => {
    const open = (data as { open?: boolean | null }).open;
    if (typeof open === 'boolean') lastStatus = open;
    burst.add();
  };
  const stream = openEventStream(
    ticketId ? `/events/tickets/${encodeURIComponent(ticketId)}` : '/events/tickets',
    {
      'new-ticket': onEvent,
      'ticket-message': onEvent,
      'ticket-status': onEvent,
      resync: () => void refetch(),
    },
    () => (isLive.value = false),
  );
  onScopeDispose(() => {
    burst.cancel();
    stream.close();
  });
  return { isLive, announcement };
}
