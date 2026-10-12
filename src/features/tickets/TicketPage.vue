<script setup lang="ts">
import { computed } from 'vue';
import type { Router } from 'vue-router';
import { useRoute, useRouter } from 'vue-router';
import { ApiError } from '@/api/client';
import QueryState from '@/components/QueryState.vue';
import StatePanel from '@/components/StatePanel.vue';
import AppButton from '@/components/ui/AppButton.vue';
import { usePageTitle } from '@/router/page-title';
import TicketHeader from './TicketHeader.vue';
import TicketMessages from './TicketMessages.vue';
import TicketNotes from './TicketNotes.vue';
import TicketPageSkeleton from './TicketPageSkeleton.vue';
import TicketReply from './TicketReply.vue';
import { cannedContextOf } from './canned/canned-text';
import TicketSidePanel from './TicketSidePanel.vue';
import TicketStaffActions from './TicketStaffActions.vue';
import { useTicketQuery } from './tickets.queries';
import { useTicketStream } from './use-ticket-stream';

const route = useRoute();
const router = useRouter();
/** Follows the route: a jump to another ticket reloads the page's data and moves the live feed. */
const id = computed(() => String(route.params.id));
const { data: ticket, error, isPending, refetch } = useTicketQuery(id);
const { isLive, announcement } = useTicketStream(id);
const justSent = takeSentFlag(router);
const status = computed(() => (error.value instanceof ApiError ? error.value.status : null));
usePageTitle(() => ticket.value?.title);
/** Handlers (`can.assign`, the backend's `judge.change_ticket` answer) get the canned-reply picker. */
const cannedContext = computed(() =>
  ticket.value?.can.assign ? cannedContextOf(ticket.value) : null,
);

/** The new-ticket page opens this ticket with `ticketSent`. The flag is read once and cleared, so a reload does not greet again. */
function takeSentFlag(current: Router): boolean {
  const sent = current.options.history.state.ticketSent === true;
  if (sent) window.history.replaceState({ ...window.history.state, ticketSent: false }, '');
  return sent;
}
</script>

<template>
  <div class="page-column">
    <StatePanel
      v-if="status === 404"
      kind="notFound"
      :title="$t('ticket.notFoundTitle')"
      is-page-heading
    />
    <StatePanel
      v-else-if="status === 403"
      kind="forbidden"
      :title="$t('ticket.forbiddenTitle')"
      :body="$t('ticket.forbiddenBody')"
      is-page-heading
    >
      <AppButton :to="{ name: 'tickets' }">{{ $t('ticket.backToList') }}</AppButton>
    </StatePanel>
    <QueryState v-else :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton><TicketPageSkeleton /></template>
      <template v-if="ticket">
        <StatePanel
          v-if="justSent"
          kind="sent"
          :title="$t('ticket.sentTitle')"
          :body="$t('ticket.sentBody')"
        />
        <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_var(--qh-sidebar-width)]">
          <div class="flex min-w-0 flex-col gap-5">
            <TicketHeader :ticket="ticket" />
            <TicketMessages :ticket="ticket" :is-live="isLive" />
            <TicketReply :ticket-id="ticket.id" :canned-context="cannedContext" />
          </div>
          <div class="flex min-w-0 flex-col gap-5">
            <TicketSidePanel :ticket="ticket" />
            <TicketNotes :ticket="ticket" />
            <TicketStaffActions v-if="ticket.can.markGood || ticket.can.assign" :ticket="ticket" />
          </div>
        </div>
      </template>
    </QueryState>
    <!-- Live announcements: one line per settled burst, read by screen readers without moving focus. -->
    <p class="sr-only" aria-live="polite" data-testid="ticket-live">{{ announcement }}</p>
  </div>
</template>
