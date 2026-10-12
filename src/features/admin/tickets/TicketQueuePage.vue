<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import TicketAlertsStrip from '@/features/tickets/TicketAlertsStrip.vue';
import { ticketQueryFromRoute } from '@/features/tickets/ticket-filters';
import { useTicketsQuery } from '@/features/tickets/tickets.queries';
import { useTicketStream } from '@/features/tickets/use-ticket-stream';
import { adminRouteName } from '../admin-screens';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import { buttonClass } from '../ui/controls';
import TicketQueueDetail from './TicketQueueDetail.vue';
import TicketQueueFilters from './TicketQueueFilters.vue';
import TicketQueueTable from './TicketQueueTable.vue';
import { seedQueueQuery, ticketIdOf } from './ticket-queue';

const route = useRoute();
const router = useRouter();
// The first visit writes the queue's defaults into the URL once, and the first request already uses them.
const seeded = seedQueueQuery(route.query);
if (seeded !== route.query) void router.replace({ query: seeded });
const filters = shallowRef(ticketQueryFromRoute(seeded));
/** Follows the URL only while this screen is the current route: leaving it clears the query and must not refetch. */
watch(
  () => route.query,
  (query) => {
    if (route.name === adminRouteName('tickets')) filters.value = ticketQueryFromRoute(query);
  },
);
const ticketId = computed(() => ticketIdOf(route.query));
const { data, error, isPending, refetch } = useTicketsQuery(filters);
const { isLive, announcement } = useTicketStream(null);
const { t } = useI18n();
const resultText = computed(() => {
  const meta = data.value?.meta;
  return meta && 'total' in meta ? t('admin.tickets.total', { count: meta.total }) : undefined;
});
</script>

<template>
  <div class="flex w-full flex-col gap-4">
    <AdminPageHeader :title="$t('admin.tickets.title')" :lead="$t('admin.tickets.lead')">
      <template #actions>
        <RouterLink :to="{ name: adminRouteName('cannedReplies') }" :class="buttonClass()">
          {{ $t('admin.cannedReplies.openFromQueue') }}
        </RouterLink>
      </template>
    </AdminPageHeader>
    <TicketAlertsStrip />
    <p v-if="isLive" class="m-0 flex items-center gap-2 text-meta text-muted">
      <span aria-hidden="true" class="inline-block size-2 rounded-full bg-accent"></span>
      {{ $t('admin.tickets.live') }}
    </p>
    <p class="sr-only" aria-live="polite" data-testid="queue-live">{{ announcement }}</p>
    <TicketQueueFilters :filters="filters" :ticket-id="ticketId" :result-text="resultText" />
    <div
      class="grid items-start gap-4"
      :class="ticketId && 'xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]'"
    >
      <TicketQueueTable
        :items="data?.items ?? []"
        :meta="data?.meta"
        :loading="isPending"
        :error="error"
        :filters="filters"
        :ticket-id="ticketId"
        :narrow="ticketId !== null"
        @retry="refetch()"
      />
      <TicketQueueDetail v-if="ticketId" :key="ticketId" :ticket-id="ticketId" />
    </div>
  </div>
</template>
