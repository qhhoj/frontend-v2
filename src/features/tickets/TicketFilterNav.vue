<script setup lang="ts">
import type { TicketListQuery } from '@/api/types/tickets';
import { routeQueryFromFilters } from './ticket-filters';

/** Two tab rows: whose tickets (own or every one the viewer may see), and their state (all, open, closed). */
const props = defineProps<{ filters: TicketListQuery; total: number | undefined }>();

const STATUS_TABS = [
  { label: 'tickets.status.all', open: undefined },
  { label: 'tickets.status.open', open: true },
  { label: 'tickets.status.closed', open: false },
] as const;
const TAB =
  'inline-flex min-h-11 items-center gap-2 rounded-pill border px-4 font-semibold text-sm';
const tabClass = (isActive: boolean) =>
  isActive
    ? `${TAB} border-accent bg-accent-soft text-accent-soft-text`
    : `${TAB} border-line text-content hover:bg-surface-hover`;
const linkTo = (patch: Partial<TicketListQuery>) => ({
  name: 'tickets',
  query: routeQueryFromFilters({ ...props.filters, page: 1, ...patch }),
});
</script>

<template>
  <div class="flex flex-col gap-3">
    <nav :aria-label="$t('tickets.scopeLabel')" class="flex flex-wrap gap-2">
      <RouterLink
        :to="linkTo({ own: true })"
        :aria-current="filters.own ? 'page' : undefined"
        :class="tabClass(filters.own)"
      >
        {{ $t('tickets.scope.own') }}
        <span
          v-if="filters.own && total !== undefined"
          class="inline-flex min-w-5 items-center justify-center rounded-pill bg-accent px-1.5 text-tiny text-on-accent"
          >{{ total }}</span
        >
      </RouterLink>
      <RouterLink
        :to="linkTo({ own: false })"
        :aria-current="filters.own ? undefined : 'page'"
        :class="tabClass(!filters.own)"
      >
        {{ $t('tickets.scope.all') }}
      </RouterLink>
    </nav>
    <nav :aria-label="$t('tickets.statusLabel')" class="flex flex-wrap gap-2">
      <RouterLink
        v-for="tab in STATUS_TABS"
        :key="tab.label"
        :to="linkTo({ open: tab.open })"
        :aria-current="filters.open === tab.open ? 'page' : undefined"
        :class="tabClass(filters.open === tab.open)"
      >
        {{ $t(tab.label) }}
      </RouterLink>
    </nav>
  </div>
</template>
