<script setup lang="ts">
import { EyeOff } from 'lucide-vue-next';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import type { NumberedPageMeta } from '@/api/client';
import type { OrganizationListFilters } from '@/api/organizations-admin.api';
import type { OrganizationListItem } from '@/api/types/organizations';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import HighlightedText from '../search/HighlightedText.vue';
import AdminChip from '../ui/AdminChip.vue';
import AdminField from '../ui/AdminField.vue';
import { INPUT } from '../ui/controls';
import AdminDataTable from '../ui/table/AdminDataTable.vue';
import AdminFilterBar from '../ui/table/AdminFilterBar.vue';
import type { ActiveFilter } from '../ui/table/AdminFilterBar.vue';
import type { AdminColumn } from '../ui/table/table-columns';
import { seatsText } from './org-seats';
import { PER_ORGANIZATION_RESET } from './organization-search';

/**
 * The organization list: search, the open / listed filters, and a table whose name links to `?org=<slug>`. `compact` (an
 * organization is open beside the list) keeps the name and state columns only.
 */
const props = defineProps<{
  items: OrganizationListItem[];
  meta?: NumberedPageMeta;
  loading: boolean;
  error: unknown;
  selected: string | null;
  search: string;
  filters: OrganizationListFilters;
  compact: boolean;
}>();
const emit = defineEmits<{ search: [text: string]; retry: [] }>();

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const locale = useLocaleStore();

const searchText = computed({ get: () => props.search, set: (text) => emit('search', text) });
const total = computed(() =>
  props.meta && 'total' in props.meta ? props.meta.total : props.items.length,
);
const resultText = computed(() =>
  props.search
    ? t('admin.organizations.list.countMatchShort', { total: total.value })
    : t('admin.organizations.list.count', { total: total.value }),
);
const columns = computed<AdminColumn[]>(() => [
  { key: 'name', label: t('admin.organizations.list.name'), priority: 'primary' },
  { key: 'state', label: t('admin.organizations.list.state'), priority: 'badge' },
  ...(props.compact
    ? []
    : [
        { key: 'seats', label: t('admin.organizations.list.seats'), align: 'end' as const },
        { key: 'points', label: t('admin.organizations.list.points'), align: 'end' as const },
      ]),
]);

/** The member search and the members, requests and history pages belong to the organization being left. */
const linkTo = (slug: string) => ({
  query: { ...route.query, org: slug, ...PER_ORGANIZATION_RESET },
});
const exact = computed(() => {
  const hit = props.items.find((item) => item.slug === props.search.trim().toLowerCase());
  return hit
    ? { label: t('admin.table.openExact', { code: hit.slug }), to: linkTo(hit.slug) }
    : null;
});

type FilterKey = keyof OrganizationListFilters;
const FILTERS: { key: FilterKey; labelKey: string; yesKey: string; noKey: string }[] = [
  {
    key: 'open',
    labelKey: 'admin.organizations.filters.open',
    yesKey: 'admin.organizations.list.open',
    noKey: 'admin.organizations.list.closed',
  },
  {
    key: 'unlisted',
    labelKey: 'admin.organizations.filters.unlisted',
    yesKey: 'admin.organizations.list.hidden',
    noKey: 'admin.organizations.filters.listed',
  },
];
const flagText = (value: boolean | undefined) => (value === undefined ? '' : value ? '1' : '0');
const chips = computed<ActiveFilter[]>(() =>
  FILTERS.filter((filter) => props.filters[filter.key] !== undefined).map((filter) => ({
    key: filter.key,
    label: t(props.filters[filter.key] ? filter.yesKey : filter.noKey),
  })),
);

/** A filter change starts again from page 1. */
function setFilters(patch: Partial<Record<FilterKey | 'q', string | undefined>>) {
  void router.replace({ query: { ...route.query, ...patch, page: undefined } });
}
const setFilter = (key: FilterKey, text: string) => setFilters({ [key]: text || undefined });
const clearFilters = () => setFilters({ open: undefined, unlisted: undefined });
const clearAll = () => setFilters({ open: undefined, unlisted: undefined, q: undefined });

const number = (value: number) => formatNumber(value, locale.locale);
</script>

<template>
  <section :aria-label="$t('admin.organizations.list.label')" class="flex min-w-0 flex-col gap-3">
    <AdminFilterBar
      v-model:search="searchText"
      :search-label="$t('admin.organizations.search.label')"
      :result-text="resultText"
      :exact="exact"
      :chips="chips"
      :filter-count="chips.length"
      @remove="setFilter($event as FilterKey, '')"
      @clear-all="clearFilters"
    >
      <template #filters>
        <AdminField
          v-for="filter in FILTERS"
          :key="filter.key"
          v-slot="{ id }"
          :input-id="`org-filter-${filter.key}`"
          :label="$t(filter.labelKey)"
        >
          <select
            :id="id"
            :data-testid="`filter-${filter.key}`"
            :class="INPUT"
            :value="flagText(filters[filter.key])"
            @change="setFilter(filter.key, ($event.target as HTMLSelectElement).value)"
          >
            <option value="">{{ $t('admin.organizations.filters.any') }}</option>
            <option value="1">{{ $t(filter.yesKey) }}</option>
            <option value="0">{{ $t(filter.noKey) }}</option>
          </select>
        </AdminField>
      </template>
    </AdminFilterBar>
    <AdminDataTable
      :pager="meta ? { meta, label: $t('admin.organizations.list.pager') } : undefined"
      data-testid="org-list"
      :columns="columns"
      :rows="items"
      :row-key="(item: OrganizationListItem) => item.slug"
      :row-attrs="
        (item: OrganizationListItem) => ({
          'aria-current': item.slug === selected ? 'true' : undefined,
        })
      "
      :label="$t('admin.organizations.list.label')"
      :loading="loading"
      :error="error"
      :filtered="search !== '' || chips.length > 0"
      :empty-text="$t('admin.organizations.list.empty')"
      :skeleton-rows="8"
      @retry="emit('retry')"
      @clear-filters="clearAll"
    >
      <template #cell-name="{ row }">
        <RouterLink
          :to="linkTo(row.slug)"
          class="flex min-w-0 flex-col py-1"
          :class="row.slug === selected ? 'text-accent-text' : 'hover:text-accent-text'"
        >
          <span class="font-semibold"><HighlightedText :text="row.name" :query="search" /></span>
          <span class="font-mono text-caption leading-4 text-muted"
            ><HighlightedText :text="`${row.slug} · ${row.shortName}`" :query="search"
          /></span>
        </RouterLink>
      </template>
      <template #cell-state="{ row }">
        <span class="inline-flex flex-wrap gap-1">
          <AdminChip :tone="row.isOpen ? 'positive' : 'neutral'">{{
            $t(row.isOpen ? 'admin.organizations.list.open' : 'admin.organizations.list.closed')
          }}</AdminChip>
          <AdminChip v-if="row.isUnlisted" :icon="EyeOff">{{
            $t('admin.organizations.list.hidden')
          }}</AdminChip>
        </span>
      </template>
      <template #cell-seats="{ row }">{{ seatsText(row, number) }}</template>
      <template #cell-points="{ row }">{{ number(row.performancePoints) }}</template>
    </AdminDataTable>
  </section>
</template>
