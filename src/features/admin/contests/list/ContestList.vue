<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import type { ContestListItem } from '@/api/types/contests';
import type { BulkContestResult } from '@/api/types/contest-editing';
import { useContestTagsQuery } from '@/features/contests/contest-extras.queries';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import AdminFilterTabs from '../../ui/AdminFilterTabs.vue';
import type { AdminFilterTab } from '../../ui/AdminFilterTabs.vue';
import { buttonClass } from '../../ui/controls';
import AdminDataTable from '../../ui/table/AdminDataTable.vue';
import AdminFilterBar from '../../ui/table/AdminFilterBar.vue';
import AdminRowMenu from '../../ui/table/AdminRowMenu.vue';
import type { AdminColumn } from '../../ui/table/table-columns';
import HighlightedText from '../../search/HighlightedText.vue';
import { CONTEST_PHASE_FILTERS } from '../../search/index-search';
import { useAdminContestSearchQuery } from '../../search/index-search.queries';
import ContestBulkResult from '../ContestBulkResult.vue';
import ContestCloneDialog from '../lifecycle/ContestCloneDialog.vue';
import ContestDeleteDialog from '../lifecycle/ContestDeleteDialog.vue';
import ContestBulkVisibilityDialog from './ContestBulkVisibilityDialog.vue';
import ContestFlagChips from './ContestFlagChips.vue';
import ContestListFilters from './ContestListFilters.vue';
import ContestPhaseChip from './ContestPhaseChip.vue';
import ContestWindowText from './ContestWindowText.vue';
import {
  activePanelFilters,
  clearedPanelFilters,
  contestFilterQueryOf,
  contestListQueryOf,
  filtersFromQuery,
} from './contest-list-filters';
import type { ContestFilterPatch, PanelFilter } from './contest-list-filters';
import { useContestRowMenu } from './use-contest-row-menu';

/** The staff contest list: one filter row (search, phase, "Bộ lọc"), then the table with show/hide in bulk. Everything lives in the address. */
const route = useRoute();
const router = useRouter();
const locale = useLocaleStore();
const { t } = useI18n();
const filters = computed(() => filtersFromQuery(route.query));
const listQuery = computed(() => contestListQueryOf(filters.value));
const { data, isPending, error, refetch } = useAdminContestSearchQuery(listQuery);
const rows = computed(() => data.value?.items ?? []);
const change = (patch: ContestFilterPatch) =>
  void router.replace({ query: contestFilterQueryOf(route.query, patch) });

const search = computed({ get: () => filters.value.q, set: (text: string) => change({ q: text }) });
const sort = computed({
  get: () => filters.value.sort || undefined,
  set: (value: string | undefined) => change({ sort: (value ?? '') as ContestFilterPatch['sort'] }),
});
const phaseTabs = computed<AdminFilterTab[]>(() =>
  CONTEST_PHASE_FILTERS.map((phase) => ({
    key: phase,
    label: phase === 'all' ? t('admin.contests.list.all') : t(`contests.phase.${phase}`),
    to: { query: contestFilterQueryOf(route.query, { phase }) },
  })),
);

const activeFilters = computed(() => activePanelFilters(filters.value));
const { data: tags } = useContestTagsQuery();
const tagName = (slug: string) => tags.value?.find((tag) => tag.slug === slug)?.name ?? slug;
const chipValue = (key: PanelFilter) => {
  const value = filters.value[key];
  if (key === 'scope') return t(`admin.contests.list.scopes.${value}`);
  if (key === 'rated') return t(`admin.contests.list.rated.${value}`);
  if (key === 'tag') return tagName(value);
  return value;
};
const chips = computed(() =>
  activeFilters.value.map((key) => ({
    key,
    label: t(`admin.contests.list.chips.${key}`, { value: chipValue(key) }),
  })),
);
const isFiltered = computed(
  () => filters.value.q !== '' || filters.value.phase !== 'all' || activeFilters.value.length > 0,
);
const clearAll = () => change({ q: '', phase: 'all', ...clearedPanelFilters() });

/** Enter in the search box opens the contest whose key is exactly the text typed. */
const exact = computed(() => {
  const typed = filters.value.q.trim().toLowerCase();
  const match = typed ? rows.value.find((row) => row.key.toLowerCase() === typed) : undefined;
  return match
    ? {
        label: t('admin.contests.list.open', { key: match.key }),
        to: { name: 'admin-contestGeneral', params: { key: match.key } },
      }
    : null;
});

const resultText = computed(() =>
  data.value
    ? t('admin.contests.list.count', {
        total: formatNumber(data.value.meta.total, locale.locale),
      })
    : undefined,
);

const columns = computed<AdminColumn[]>(() => [
  {
    key: 'contest',
    label: t('admin.contests.list.columns.contest'),
    priority: 'primary',
    cellClass: 'min-w-48',
  },
  { key: 'phase', label: t('admin.contests.list.columns.phase'), priority: 'badge' },
  {
    key: 'time',
    label: t('admin.contests.list.columns.time'),
    priority: 'secondary',
    sort: { asc: 'oldest', desc: 'newest', first: 'desc' },
  },
  {
    key: 'users',
    label: t('admin.contests.list.columns.users'),
    priority: 'secondary',
    align: 'end',
  },
  { key: 'flags', label: t('admin.contests.list.columns.flags'), priority: 'meta' },
]);
const editTo = (contest: ContestListItem) => ({
  name: 'admin-contestGeneral',
  params: { key: contest.key },
});
/** The row whose clone or delete dialog is open; kept after closing so the dialog's text does not change while it fades. */
const target = ref<ContestListItem | null>(null);
const isCloneOpen = ref(false);
const isDeleteOpen = ref(false);
/** A deleted contest leaves the bulk selection too, so a later bulk run does not name it. */
function forget(key: string) {
  selected.value = new Set([...selected.value].filter((picked) => picked !== key));
}
const menuOf = useContestRowMenu({
  clone: (contest) => {
    target.value = contest;
    isCloneOpen.value = true;
  },
  remove: (contest) => {
    target.value = contest;
    isDeleteOpen.value = true;
  },
});

const selected = ref(new Set<string>());
const lastResult = ref<BulkContestResult | null>(null);
watch(
  listQuery,
  () => {
    selected.value = new Set();
    lastResult.value = null;
  },
  { deep: true },
);
const selectedKeys = computed(() => [...selected.value]);
const isBulkOpen = ref(false);
/** Kept after the dialog closes, so its wording does not flip while it fades out. */
const isBulkVisible = ref(true);
function openBulk(isVisible: boolean) {
  isBulkVisible.value = isVisible;
  isBulkOpen.value = true;
}
function onBulkDone(result: BulkContestResult) {
  lastResult.value = result.failed > 0 ? result : null;
  selected.value = new Set();
}
const resultRows = computed(() =>
  (lastResult.value?.results ?? []).map((item) => ({ ...item, name: item.key })),
);
</script>

<template>
  <div class="flex min-w-0 flex-col gap-3">
    <AdminFilterBar
      v-model:search="search"
      :search-label="$t('admin.contests.list.searchLabel')"
      :result-text="resultText"
      :exact="exact"
      :chips="chips"
      :filter-count="activeFilters.length"
      @remove="(key: string) => change({ [key]: '' })"
      @clear-all="change(clearedPanelFilters())"
    >
      <template #view>
        <AdminFilterTabs
          :tabs="phaseTabs"
          :current="filters.phase"
          :label="$t('admin.contests.list.phaseLabel')"
        />
      </template>
      <template #filters>
        <ContestListFilters :filters="filters" @change="change" />
      </template>
    </AdminFilterBar>
    <ContestBulkResult
      v-if="lastResult"
      :results="resultRows"
      reason-prefix="admin.contests.bulk.reasons"
    />
    <AdminDataTable
      v-model:sort="sort"
      v-model:selected="selected"
      :pager="data?.meta ? { meta: data.meta, label: $t('admin.contests.list.pager') } : undefined"
      :columns="columns"
      :rows="rows"
      :row-key="(contest: ContestListItem) => contest.key"
      :row-label="(contest: ContestListItem) => contest.name"
      :row-attrs="(contest: ContestListItem) => ({ 'data-key': contest.key })"
      :label="$t('admin.contests.list.tableLabel')"
      selectable
      :loading="isPending"
      :error="error"
      :skeleton-rows="6"
      :filtered="isFiltered"
      :empty-text="$t('admin.contests.list.empty')"
      @retry="refetch()"
      @clear-filters="clearAll"
    >
      <template #bulk>
        <button type="button" :class="buttonClass('secondary', 'sm')" @click="openBulk(true)">
          {{ $t('admin.contests.list.bulk.show') }}
        </button>
        <button type="button" :class="buttonClass('secondary', 'sm')" @click="openBulk(false)">
          {{ $t('admin.contests.list.bulk.hide') }}
        </button>
      </template>
      <template #cell-contest="{ row }">
        <RouterLink :to="editTo(row)" class="block font-semibold text-accent-text hover:underline"
          ><HighlightedText :text="row.name" :query="filters.q"
        /></RouterLink>
        <span class="block font-mono text-xs text-muted"
          ><HighlightedText :text="row.key" :query="filters.q"
        /></span>
      </template>
      <template #cell-phase="{ row }"><ContestPhaseChip :phase="row.phase" /></template>
      <template #cell-time="{ row }">
        <ContestWindowText :start-time="row.startTime" :end-time="row.endTime" />
      </template>
      <template #cell-users="{ row }">{{ formatNumber(row.userCount, locale.locale) }}</template>
      <template #cell-flags="{ row }"><ContestFlagChips :contest="row" /></template>
      <template #actions="{ row }">
        <AdminRowMenu
          :items="menuOf(row)"
          :label="$t('admin.contests.list.more', { name: row.name })"
        />
      </template>
    </AdminDataTable>
    <ContestBulkVisibilityDialog
      v-model:visible="isBulkOpen"
      :keys="selectedKeys"
      :is-visible="isBulkVisible"
      @done="onBulkDone"
    />
    <template v-if="target">
      <ContestCloneDialog v-model:visible="isCloneOpen" :source="target" />
      <ContestDeleteDialog
        v-model:visible="isDeleteOpen"
        :contest-key="target.key"
        @deleted="forget(target.key)"
      />
    </template>
  </div>
</template>
