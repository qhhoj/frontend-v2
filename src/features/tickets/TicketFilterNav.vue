<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { TicketListQuery } from '@/api/types/tickets';
import Tabs from '@/components/ui/Tabs.vue';
import type { TabItem } from '@/components/ui/Tabs.vue';
import { routeQueryFromFilters } from './ticket-filters';

/** Two tab rows: whose tickets (own or every one the viewer may see), and their state (all, open, closed). */
const props = defineProps<{ filters: TicketListQuery; total: number | undefined }>();
const { t } = useI18n();

const STATUS_TABS = [
  { key: 'all', label: 'tickets.status.all', open: undefined },
  { key: 'open', label: 'tickets.status.open', open: true },
  { key: 'closed', label: 'tickets.status.closed', open: false },
] as const;
const linkTo = (patch: Partial<TicketListQuery>) => ({
  name: 'tickets',
  query: routeQueryFromFilters({ ...props.filters, page: 1, ...patch }),
});
const scopeTabs = computed<TabItem[]>(() => [
  {
    key: 'own',
    label: t('tickets.scope.own'),
    to: linkTo({ own: true }),
    count: props.filters.own ? props.total : undefined,
    countTone: 'accent',
  },
  { key: 'all', label: t('tickets.scope.all'), to: linkTo({ own: false }) },
]);
const statusTabs = computed<TabItem[]>(() =>
  STATUS_TABS.map((tab) => ({ key: tab.key, label: t(tab.label), to: linkTo({ open: tab.open }) })),
);
const currentStatus = computed(
  () => STATUS_TABS.find((tab) => tab.open === props.filters.open)?.key ?? 'all',
);
</script>

<template>
  <div class="flex flex-col gap-3">
    <Tabs
      :model-value="filters.own ? 'own' : 'all'"
      :items="scopeTabs"
      :label="$t('tickets.scopeLabel')"
      overflow="scroll"
    />
    <Tabs
      :model-value="currentStatus"
      :items="statusTabs"
      :label="$t('tickets.statusLabel')"
      overflow="scroll"
    />
  </div>
</template>
