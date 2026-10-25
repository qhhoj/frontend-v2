import { useQuery } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { fetchCannedReplies } from '@/api/ticket-canned-replies.api';
import { fetchTicket, fetchTicketSummary, fetchTickets } from '@/api/tickets.api';
import type { TicketListQuery } from '@/api/types/tickets';
import { useSessionStore } from '@/stores/session.store';
import { useViewerId } from '@/stores/use-viewer-id';
import { keepPreviousForViewer } from '@/features/contests/keep-previous-for-viewer';

export const useTicketsQuery = (query: MaybeRefOrGetter<TicketListQuery>) => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => ['tickets', 'list', { ...toValue(query) }, viewer.value]),
    queryFn: () => fetchTickets(toValue(query)),
    placeholderData: computed(() => keepPreviousForViewer(viewer.value)),
  });
};

export const useTicketQuery = (id: MaybeRefOrGetter<string>) => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => ['tickets', 'detail', toValue(id), viewer.value]),
    queryFn: () => fetchTicket(toValue(id)),
  });
};

/** The alerts strip refreshes once a minute (no stream carries the counts). */
export const TICKET_SUMMARY_POLL_MS = 60_000;
/** Inside `['tickets']`, so the ticket stream's refetch also refreshes the counts. */
export const useTicketSummaryQuery = () => {
  const viewer = useViewerId();
  const session = useSessionStore();
  return useQuery({
    queryKey: computed(() => ['tickets', 'summary', viewer.value]),
    queryFn: fetchTicketSummary,
    enabled: computed(() => session.user !== null),
    refetchInterval: TICKET_SUMMARY_POLL_MS,
  });
};

export const cannedRepliesKey = (viewer: string) => ['tickets', 'canned', viewer] as const;
/** Staff only (`judge.change_ticket`): callers pass whether the viewer may read them. */
export const useCannedRepliesQuery = (isEnabled: MaybeRefOrGetter<boolean>) => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => cannedRepliesKey(viewer.value)),
    queryFn: fetchCannedReplies,
    enabled: computed(() => toValue(isEnabled)),
  });
};
