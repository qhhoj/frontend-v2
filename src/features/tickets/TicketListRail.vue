<script setup lang="ts">
import { computed } from 'vue';
import QueryState from '@/components/QueryState.vue';
import Card from '@/components/ui/Card.vue';
import AppButton from '@/components/ui/AppButton.vue';
import TicketListPane from './TicketListPane.vue';
import TicketListSkeleton from './TicketListSkeleton.vue';
import { routeQueryFromFilters, ticketQueryFromRoute } from './ticket-filters';
import { lastTicketFilters } from './ticket-list-memory';
import { useTicketsQuery } from './tickets.queries';

/** The list beside an open ticket (from `xl`): the filters the list page last showed, scrolling on its own, the open ticket marked. */
defineProps<{ activeId: string }>();
const filters = computed(() => lastTicketFilters.value ?? ticketQueryFromRoute({}));
const { data, isPending } = useTicketsQuery(filters);
const tickets = computed(() => data.value?.items ?? []);
</script>

<template>
  <Card
    as="nav"
    :aria-label="$t('tickets.title')"
    class="overflow-hidden xl:sticky xl:top-4 xl:max-h-[calc(100dvh-2rem)] xl:overflow-y-auto"
  >
    <div class="flex items-center justify-between gap-2 border-b border-line px-4 py-2">
      <h2 class="text-meta font-semibold">{{ $t('tickets.title') }}</h2>
      <AppButton tone="link" class="text-meta" :to="{ name: 'tickets', query: routeQueryFromFilters(filters) }">
        {{ $t('common.viewAll') }}
      </AppButton>
    </div>
    <QueryState :loading="isPending" :error="null">
      <template #skeleton><TicketListSkeleton /></template>
      <TicketListPane :tickets="tickets" :active-id="activeId" />
    </QueryState>
  </Card>
</template>
