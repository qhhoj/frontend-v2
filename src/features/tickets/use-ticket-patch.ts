import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { computed } from 'vue';
import { ApiError } from '@/api/client';
import { updateTicket } from '@/api/tickets.api';
import type { TicketPatch } from '@/api/types/tickets';
import { errorMessageKey } from '@/i18n/error-message';

/** One PATCH of a ticket by its viewer (status, notes, good contribution, assignees); the tickets refetch once it lands. */
export function useTicketPatch(ticketId: string) {
  const client = useQueryClient();
  const { isPending, error, mutate } = useMutation({
    mutationFn: (patch: TicketPatch) => updateTicket(ticketId, patch),
    onSuccess: () => client.invalidateQueries({ queryKey: ['tickets'] }),
    /** 409 `conflict`: the ticket changed after it was read, so show what is stored now beside the message. */
    onError: (failure) => {
      if (failure instanceof ApiError && failure.code === 'conflict')
        return client.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
  const failureKey = computed(() => (error.value ? errorMessageKey(error.value) : null));
  /** `onSaved` runs only when the server accepted the change, so a refused draft is never reset. */
  const patch = (value: TicketPatch, onSaved?: () => void) =>
    mutate(value, { onSuccess: () => onSaved?.() });
  return { isPending, failureKey, patch };
}
