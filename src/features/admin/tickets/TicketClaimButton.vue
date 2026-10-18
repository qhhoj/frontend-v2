<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query';
import { computed } from 'vue';
import { ApiError } from '@/api/client';
import { claimTicket, releaseTicket } from '@/api/tickets.api';
import type { TicketDetail } from '@/api/types/tickets';
import { useViewerId } from '@/stores/use-viewer-id';
import AdminStatus from '../ui/AdminStatus.vue';
import { failureTextOf } from '../ui/admin-errors';
import { buttonClass } from '../ui/controls';
import { useAdminMutation } from '../ui/use-admin-mutation';

/**
 * "Nhận phiếu" / "Trả phiếu" (P-31): one click makes the viewer the ticket's handler, so two people never answer the same
 * ticket. A ticket someone else handles names them instead; reassigning it is the "Xử lý" section's job. A 409 (someone
 * claimed first, or the ticket closed) reloads the ticket beside its message.
 */
const props = defineProps<{ ticket: TicketDetail }>();
const queryClient = useQueryClient();
const viewer = useViewerId();
const isMine = computed(() =>
  props.ticket.assignees.some((assignee) => assignee.id === viewer.value),
);
const others = computed(() =>
  props.ticket.assignees.map((assignee) => assignee.username).join(', '),
);
const canClaim = computed(() => props.ticket.isOpen && props.ticket.assignees.length === 0);
const reload = () => queryClient.invalidateQueries({ queryKey: ['tickets'] });
const take = useAdminMutation({
  mutate: (isClaim: boolean) =>
    isClaim ? claimTicket(props.ticket.id) : releaseTicket(props.ticket.id),
  onDone: () => void reload(),
});
async function toggle(isClaim: boolean) {
  await take.run(isClaim);
  if (take.failure.value instanceof ApiError && take.failure.value.status === 409) void reload();
}
</script>

<template>
  <template v-if="ticket.can.claim">
    <button
      v-if="isMine"
      type="button"
      data-testid="ticket-release"
      :class="buttonClass()"
      :aria-busy="take.isPending.value || undefined"
      @click="toggle(false)"
    >
      {{ $t('admin.tickets.detail.release') }}
    </button>
    <button
      v-else-if="canClaim"
      type="button"
      data-testid="ticket-claim"
      :class="buttonClass()"
      :aria-busy="take.isPending.value || undefined"
      @click="toggle(true)"
    >
      {{ $t('admin.tickets.detail.claim') }}
    </button>
    <span v-else-if="others" class="text-meta text-muted" data-testid="ticket-handled-by">
      {{ $t('admin.tickets.detail.handledBy', { names: others }) }}
    </span>
  </template>
  <AdminStatus
    v-if="take.failure.value"
    kind="refused"
    class="basis-full"
    :text="failureTextOf(take.failure.value)"
  />
</template>
