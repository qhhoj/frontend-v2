import { keepPreviousData, useQuery } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { fetchTicket, fetchTickets } from '@/api/tickets.api';
import type { TicketListQuery } from '@/api/types/tickets';
import { useViewerId } from '@/stores/use-viewer-id';

export const useTicketsQuery = (query: MaybeRefOrGetter<TicketListQuery>) => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => ['tickets', 'list', { ...toValue(query) }, viewer.value]),
    queryFn: () => fetchTickets(toValue(query)),
    placeholderData: keepPreviousData,
  });
};

export const useTicketQuery = (id: MaybeRefOrGetter<string>) => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => ['tickets', 'detail', toValue(id), viewer.value]),
    queryFn: () => fetchTicket(toValue(id)),
  });
};
