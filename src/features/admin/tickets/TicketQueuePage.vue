<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { ticketQueryFromRoute } from '@/features/tickets/ticket-filters';
import { useTicketsQuery } from '@/features/tickets/tickets.queries';
import { useTicketStream } from '@/features/tickets/use-ticket-stream';
import AdminBit from '../shell/AdminBit.vue';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
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
watch(
  () => route.query,
  (query) => (filters.value = ticketQueryFromRoute(query)),
);
const ticketId = computed(() => ticketIdOf(route.query));
const { data, error, isPending, refetch } = useTicketsQuery(filters);
const { isLive, announcement } = useTicketStream(null);
</script>

<template>
  <div class="flex flex-col gap-5">
    <AdminPageHeader
      :crumbs="[
        { label: $t('admin.shell.screens.users'), to: { name: 'admin-users' } },
        { label: $t('admin.shell.screens.tickets') },
      ]"
      :title="$t('admin.tickets.title')"
      :lead="$t('admin.tickets.lead')"
    >
      <template #actions><AdminBit placement="people" /></template>
    </AdminPageHeader>
    <p v-if="isLive" class="flex items-center gap-2 text-[13px] text-muted">
      <span aria-hidden="true" class="inline-block size-2 rounded-full bg-accent"></span>
      {{ $t('admin.tickets.live') }}
    </p>
    <p class="sr-only" aria-live="polite" data-testid="queue-live">{{ announcement }}</p>
    <div class="grid gap-5 xl:grid-cols-[18rem_minmax(0,1fr)_minmax(0,1.2fr)]">
      <TicketQueueFilters :key="route.fullPath" :filters="filters" :ticket-id="ticketId" />
      <QueryState :loading="isPending" :error="error" @retry="refetch()">
        <template #skeleton><SkeletonBlock class="h-80 w-full" /></template>
        <TicketQueueTable
          v-if="data"
          :items="data.items"
          :meta="data.meta"
          :filters="filters"
          :ticket-id="ticketId"
        />
      </QueryState>
      <TicketQueueDetail v-if="ticketId" :key="ticketId" :ticket-id="ticketId" />
    </div>
  </div>
</template>
