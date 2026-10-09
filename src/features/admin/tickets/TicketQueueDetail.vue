<script setup lang="ts">
import { ref } from 'vue';
import GlassCard from '@/components/GlassCard.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import TicketLinkChip from '@/features/tickets/TicketLinkChip.vue';
import TicketMessages from '@/features/tickets/TicketMessages.vue';
import TicketNotes from '@/features/tickets/TicketNotes.vue';
import TicketReply from '@/features/tickets/TicketReply.vue';
import TicketStaffActions from '@/features/tickets/TicketStaffActions.vue';
import TicketStatusPill from '@/features/tickets/TicketStatusPill.vue';
import { useTicketPatch } from '@/features/tickets/use-ticket-patch';
import { useTicketQuery } from '@/features/tickets/tickets.queries';
import { useTicketStream } from '@/features/tickets/use-ticket-stream';
import { formatDateTime } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';

/** The open ticket beside the list. Mounted only while a ticket is open, so its live feed closes with it. */
const props = defineProps<{ ticketId: string }>();
const locale = useLocaleStore();
const { data: ticket, error, isPending, refetch } = useTicketQuery(props.ticketId);
const { isLive, announcement } = useTicketStream(props.ticketId);
const { isPending: isSaving, failureKey, patch } = useTicketPatch(props.ticketId);
const closeAfterReply = ref(false);
const BUTTON =
  'inline-flex min-h-11 items-center rounded-pill border border-line px-4 font-semibold';

/** The reply went through; with the box checked, the ticket closes too, one PATCH after the message. */
const onSent = () => {
  if (closeAfterReply.value) patch({ isOpen: false }, () => (closeAfterReply.value = false));
};
const toggleOpen = () => {
  if (ticket.value) patch({ isOpen: !ticket.value.isOpen });
};
</script>

<template>
  <GlassCard as="section" data-testid="queue-detail" class="flex min-w-0 flex-col gap-5 p-5">
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton><SkeletonBlock class="h-96 w-full" /></template>
      <template v-if="ticket">
        <header class="flex flex-col gap-2">
          <div class="flex flex-wrap items-center gap-2">
            <TicketStatusPill :is-open="ticket.isOpen" :is-contributive="ticket.isContributive" />
            <TicketLinkChip :link="ticket.link" />
          </div>
          <h2 class="font-display text-xl font-semibold">{{ ticket.title }}</h2>
          <p class="text-[13px] text-muted">
            {{
              $t('admin.tickets.detail.byline', {
                creator: ticket.creator.username,
                date: formatDateTime(ticket.createdAt, locale.locale),
              })
            }}
          </p>
          <div>
            <button
              type="button"
              data-testid="toggle-status"
              :class="BUTTON"
              :aria-busy="isSaving ? 'true' : undefined"
              @click="toggleOpen"
            >
              {{
                ticket.isOpen ? $t('admin.tickets.detail.close') : $t('admin.tickets.detail.reopen')
              }}
            </button>
          </div>
        </header>
        <p v-if="failureKey" role="alert" class="text-[13px] text-negative">
          {{ $t(failureKey) }}
        </p>
        <TicketMessages :ticket="ticket" :is-live="isLive" />
        <label class="flex min-h-11 items-center gap-2 text-sm font-medium">
          <input id="close-after-reply" v-model="closeAfterReply" type="checkbox" class="size-5" />
          {{ $t('admin.tickets.detail.closeAfterReply') }}
        </label>
        <TicketReply :ticket-id="ticket.id" @sent="onSent" />
        <TicketStaffActions v-if="ticket.can.markGood || ticket.can.assign" :ticket="ticket" />
        <TicketNotes :ticket="ticket" />
        <p class="sr-only" aria-live="polite">{{ announcement }}</p>
      </template>
    </QueryState>
  </GlassCard>
</template>
