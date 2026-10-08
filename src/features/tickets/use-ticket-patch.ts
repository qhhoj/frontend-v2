import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { computed } from 'vue';
import { updateTicket } from '@/api/tickets.api';
import type { TicketPatch } from '@/api/types/tickets';
import { errorMessageKey } from '@/i18n/error-message';

/** One PATCH of a ticket by its viewer (status, notes, good contribution, assignees); the tickets refetch once it lands. */
export function useTicketPatch(ticketId: string) {
  const client = useQueryClient();
  const { isPending, error, mutate } = useMutation({
    mutationFn: (patch: TicketPatch) => updateTicket(ticketId, patch),
    onSuccess: () => client.invalidateQueries({ queryKey: ['tickets'] }),
  });
  const failureKey = computed(() => (error.value ? errorMessageKey(error.value) : null));
  return { isPending, failureKey, patch: (patch: TicketPatch) => mutate(patch) };
}
