<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { UserPlus } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { fetchParticipations } from '@/api/contest-editing.api';
import type {
  BulkDisqualifyResult,
  EditableContest,
  Participation,
} from '@/api/types/contest-editing';
import { formatNumber } from '@/lib/format';
import { formatInZone } from '../../ui/form/site-time';
import { useLocaleStore } from '@/stores/locale.store';
import { useViewerId } from '@/stores/use-viewer-id';
import AdminChip from '../../ui/AdminChip.vue';
import AdminStatus from '../../ui/AdminStatus.vue';
import AdminUserLabel from '../../ui/AdminUserLabel.vue';
import { failureTextOf } from '../../ui/admin-errors';
import { buttonClass } from '../../ui/controls';
import AdminDataTable from '../../ui/table/AdminDataTable.vue';
import AdminFilterBar from '../../ui/table/AdminFilterBar.vue';
import AdminRowMenu from '../../ui/table/AdminRowMenu.vue';
import type { AdminColumn } from '../../ui/table/table-columns';
import ContestBulkResult from '../ContestBulkResult.vue';
import AddParticipationDialog from './AddParticipationDialog.vue';
import BulkDisqualifyDialog from './BulkDisqualifyDialog.vue';
import ParticipantsFilters from './ParticipantsFilters.vue';
import ParticipationDialogs from './ParticipationDialogs.vue';
import {
  SEARCH_MAX,
  activePanelFilters,
  participationQueryOf,
  participationQueryWith,
} from './participant-filters';
import type { PanelFilter } from './participant-filters';
import { formatPenalty, participationKindKey, rulesAcceptanceText } from './participations';
import { useParticipationActions } from './use-participation-actions';

/** The participations of one contest: search and filters in the URL, a table with bulk disqualify and a row menu. */
const props = defineProps<{ contest: EditableContest }>();
const route = useRoute();
const router = useRouter();
const viewer = useViewerId();
const locale = useLocaleStore();
const { t } = useI18n();
const query = computed(() => participationQueryOf(route.query));
const change = (patch: Record<string, string>) =>
  void router.replace({ query: participationQueryWith(route.query, patch) });

const { data, error, isPending, refetch } = useQuery({
  queryKey: computed(() => [
    'admin',
    'participations',
    props.contest.key,
    viewer.value,
    query.value,
  ]),
  queryFn: () => fetchParticipations(props.contest.key, query.value),
});
const rows = computed(() => data.value?.items ?? []);
const total = computed(() => data.value?.meta.total ?? 0);

const search = computed({
  get: () => query.value.search,
  set: (text: string) => change({ search: text.trim().slice(0, SEARCH_MAX) }),
});
const activeFilters = computed(() => activePanelFilters(route.query));
const chipValue = (key: PanelFilter) => {
  const value = String(route.query[key]);
  if (key === 'user') return value;
  return t(`admin.contestOps.participants.filters.${key}.${value}`);
};
const chips = computed(() =>
  activeFilters.value.map((key) => ({
    key,
    label: t(`admin.contestOps.participants.chips.${key}`, { value: chipValue(key) }),
  })),
);
const isFiltered = computed(() => query.value.search !== '' || activeFilters.value.length > 0);
/**
 * The result line. Unfiltered it also splits the total into the contest's own counts (live and virtual), the numbers the
 * header, the tab chip and the summary show, so the four places read as one.
 */
const resultText = computed(() => {
  const number = (value: number) => formatNumber(value, locale.locale);
  if (isFiltered.value)
    return t('admin.contests.participants.countLine', { total: number(total.value) });
  return t('admin.contests.participants.countSplit', {
    total: number(total.value),
    live: number(props.contest.userCount),
    virtual: number(props.contest.virtualCount),
  });
});
const clearAll = () => change({ search: '', kind: '', status: '', sort: '', user: '' });

const kindText = (row: Participation) => {
  const kind = participationKindKey(row.virtual);
  return t(kind.key, kind.params ?? {});
};
const columns = computed<AdminColumn[]>(() => [
  { key: 'user', label: t('admin.contests.participants.columns.user'), priority: 'primary' },
  { key: 'status', label: t('admin.contests.participants.columns.status'), priority: 'badge' },
  { key: 'kind', label: t('admin.contests.participants.columns.kind'), priority: 'secondary' },
  {
    key: 'score',
    label: t('admin.contests.participants.columns.score'),
    priority: 'secondary',
    align: 'end',
  },
  {
    key: 'penalty',
    label: t('admin.contests.participants.columns.penalty'),
    priority: 'secondary',
    align: 'end',
    cellClass: 'whitespace-nowrap',
  },
  {
    key: 'start',
    label: t('admin.contests.participants.columns.start'),
    priority: 'meta',
    cellClass: 'whitespace-nowrap',
  },
  {
    key: 'rules',
    label: t('admin.contestRules.column'),
    priority: 'meta',
    cellClass: 'whitespace-nowrap',
  },
]);
const actions = useParticipationActions(() => props.contest.key);
const directFailure = computed(() => actions.directFailure());

/** A selection belongs to its page and filters: any change of either clears it, and the last result with it. */
const selected = ref(new Set<string>());
const lastResult = ref<BulkDisqualifyResult | null>(null);
watch(query, () => {
  selected.value = new Set();
  lastResult.value = null;
});
const selectedIds = computed(() => [...selected.value]);
const isBulkOpen = ref(false);
const isBulkDisqualify = ref(true);
const openBulk = (disqualified: boolean) => {
  isBulkDisqualify.value = disqualified;
  isBulkOpen.value = true;
};
const usernameOf = (id: string) => rows.value.find((row) => row.id === id)?.user.username ?? id;
const selectedNames = computed(() => selectedIds.value.map(usernameOf));
const resultRows = computed(() =>
  (lastResult.value?.results ?? []).map((item) => ({ ...item, name: usernameOf(item.id) })),
);
function onBulkDone(result: BulkDisqualifyResult) {
  lastResult.value = result;
  selected.value = new Set();
}

const isAddOpen = ref(false);
/** After an add, the list shows every row of that user, whatever kind or status was filtered. */
const showUser = (username: string) => change({ user: username, search: '', kind: '', status: '' });
</script>

<template>
  <div class="flex min-w-0 flex-col gap-3">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <p class="m-0 max-w-prose text-sm text-muted">
        {{ $t('admin.contests.participants.footnote') }}
      </p>
      <button type="button" :class="buttonClass('primary')" @click="isAddOpen = true">
        <UserPlus aria-hidden="true" class="size-4" :stroke-width="1.75" />
        {{ $t('admin.contestOps.participants.add') }}
      </button>
    </div>
    <AdminFilterBar
      v-model:search="search"
      :search-label="$t('admin.contests.participants.userLabel')"
      :result-text="resultText"
      :chips="chips"
      :filter-count="activeFilters.filter((key) => key !== 'user').length"
      @remove="(key: string) => change({ [key]: '' })"
      @clear-all="change({ kind: '', status: '', sort: '', user: '' })"
    >
      <template #filters><ParticipantsFilters /></template>
    </AdminFilterBar>
    <ContestBulkResult
      v-if="lastResult"
      :results="resultRows"
      reason-prefix="admin.contests.bulk.reasons"
    />
    <AdminStatus v-if="directFailure" kind="refused" :text="failureTextOf(directFailure)" />
    <AdminDataTable
      v-model:selected="selected"
      :pager="
        data?.meta
          ? { meta: data.meta, label: $t('admin.contests.participants.pagerLabel') }
          : undefined
      "
      :columns="columns"
      :rows="rows"
      :row-key="(row: Participation) => row.id"
      :row-label="(row: Participation) => row.user.username"
      :label="$t('admin.contests.participants.tableLabel')"
      selectable
      :loading="isPending"
      :error="error"
      :skeleton-rows="6"
      :filtered="isFiltered"
      :empty-text="$t('admin.contests.participants.empty')"
      @retry="refetch()"
      @clear-filters="clearAll"
    >
      <template #bulk>
        <button type="button" :class="buttonClass('secondary', 'sm')" @click="openBulk(false)">
          {{ $t('admin.contests.participants.bulk.reinstate') }}
        </button>
        <button type="button" :class="buttonClass('danger', 'sm')" @click="openBulk(true)">
          {{ $t('admin.contests.participants.bulk.disqualify') }}
        </button>
      </template>
      <template #cell-user="{ row }">
        <AdminUserLabel :username="row.user.username" :rating="row.user.rating" :size="24" />
      </template>
      <template #cell-status="{ row }">
        <span :id="`participation-status-${row.id}`" tabindex="-1" class="rounded-pill">
          <AdminChip :tone="row.isDisqualified ? 'negative' : 'positive'">
            {{
              row.isDisqualified
                ? $t('admin.contests.participants.disqualified')
                : $t('admin.contests.participants.valid')
            }}
          </AdminChip>
        </span>
      </template>
      <template #cell-kind="{ row }">{{ kindText(row) }}</template>
      <template #cell-score="{ row }">
        <!-- The tiebreaker rarely matters: it rides on the score as a tooltip instead of a column. -->
        <span
          :title="
            $t('admin.contestOps.participants.tiebreakerOf', {
              value: formatNumber(row.tiebreaker, locale.locale),
            })
          "
          >{{ formatNumber(row.score, locale.locale) }}</span
        >
      </template>
      <template #cell-penalty="{ row }">{{
        formatPenalty(row.cumtime, contest.formatName, locale.locale)
      }}</template>
      <template #cell-start="{ row }">
        <span class="font-mono text-meta tabular-nums">{{ formatInZone(row.realStart) }}</span>
      </template>
      <template #cell-rules="{ row }">{{ rulesAcceptanceText(row, locale.locale) }}</template>
      <template #actions="{ row }">
        <AdminRowMenu
          :items="actions.menuOf(row)"
          :label="$t('admin.contestOps.participants.more', { username: row.user.username })"
        />
      </template>
    </AdminDataTable>
    <ParticipationDialogs :actions="actions" />
    <BulkDisqualifyDialog
      v-model:visible="isBulkOpen"
      :contest-key="contest.key"
      :ids="selectedIds"
      :usernames="selectedNames"
      :disqualified="isBulkDisqualify"
      @done="onBulkDone"
    />
    <AddParticipationDialog
      v-model:visible="isAddOpen"
      :contest-key="contest.key"
      @added="showUser"
    />
  </div>
</template>
