<script setup lang="ts">
import BulkSelectionBar from '../ui/BulkSelectionBar.vue';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import type { BulkContestResult } from '@/api/types/contest-editing';
import EmptyState from '@/components/EmptyState.vue';
import NumberedPager from '@/components/NumberedPager.vue';
import QueryState from '@/components/QueryState.vue';
import ScrollRegion from '@/components/ScrollRegion.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import ContestBulkResult from '../contests/ContestBulkResult.vue';
import { ADMIN_BUTTON_CLASS } from '../ui/classes';
import { useRowSelection } from '../ui/use-row-selection';
import ContestBulkVisibilityDialog from './ContestBulkVisibilityDialog.vue';
import ContestListFilters from './ContestListFilters.vue';
import ContestListTable from './ContestListTable.vue';
import IndexSearchBox from './IndexSearchBox.vue';
import { contestFilterQueryOf, contestListQueryOf, filtersFromQuery } from './contest-list-filters';
import type { ContestFilterPatch } from './contest-list-filters';
import { useAdminContestSearchQuery } from './index-search.queries';

const route = useRoute();
const router = useRouter();
const locale = useLocaleStore();
const { t } = useI18n();
const filters = computed(() => filtersFromQuery(route.query));
const listQuery = computed(() => contestListQueryOf(filters.value));
const { data, isPending, error, refetch } = useAdminContestSearchQuery(listQuery);
const change = (patch: ContestFilterPatch) =>
  void router.replace({ query: contestFilterQueryOf(route.query, patch) });

/** Every listed row is editable (`editable: true`), so each one may be ticked; the backend still checks per contest. */
const selection = useRowSelection(
  computed(() => (data.value?.items ?? []).map((item) => item.key)),
);
const lastResult = ref<BulkContestResult | null>(null);
watch(
  listQuery,
  () => {
    selection.clear();
    lastResult.value = null;
  },
  { deep: true },
);
const isBulkOpen = ref(false);
/** Kept after the dialog closes, so its wording does not flip while it fades out. */
const isBulkVisible = ref(true);
function openBulk(isVisible: boolean) {
  isBulkVisible.value = isVisible;
  isBulkOpen.value = true;
}
function onBulkDone(result: BulkContestResult) {
  lastResult.value = result;
  selection.clear();
}
const resultRows = computed(() =>
  (lastResult.value?.results ?? []).map((item) => ({ ...item, name: item.key })),
);

const countText = computed(() => {
  const values = {
    shown: formatNumber(data.value?.items.length ?? 0, locale.locale),
    total: formatNumber(data.value?.meta.total ?? 0, locale.locale),
    q: filters.value.q,
  };
  return t(
    filters.value.q ? 'admin.search.contests.countFor' : 'admin.search.contests.count',
    values,
  );
});
</script>

<template>
  <section
    class="glass flex min-w-0 flex-col gap-4 rounded-panel p-5"
    aria-labelledby="contest-search-title"
  >
    <h2 id="contest-search-title" class="font-display text-xl font-semibold">
      {{ $t('admin.search.contests.title') }}
    </h2>
    <IndexSearchBox
      :value="filters.q"
      :label="$t('admin.search.contests.label')"
      :placeholder="$t('admin.search.contests.placeholder')"
      :clear-label="$t('admin.search.clear')"
      :hint="$t('admin.search.contests.hint')"
      :status="data ? countText : ''"
      @commit="(q: string) => change({ q })"
    />
    <ContestListFilters :filters="filters" @change="change" />
    <BulkSelectionBar :count="selection.selected.value.length" @clear="selection.clear">
      <button type="button" :class="ADMIN_BUTTON_CLASS" @click="openBulk(true)">
        {{ $t('admin.search.contests.bulk.show') }}
      </button>
      <button type="button" :class="ADMIN_BUTTON_CLASS" @click="openBulk(false)">
        {{ $t('admin.search.contests.bulk.hide') }}
      </button>
    </BulkSelectionBar>
    <ContestBulkResult
      v-if="lastResult"
      :results="resultRows"
      reason-prefix="admin.contests.bulk.reasons"
    />
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <SkeletonBlock
          data-skeleton-region="contest-search-table"
          class="h-64 w-full rounded-row"
        />
      </template>
      <EmptyState v-if="data && data.items.length === 0" compact>
        <strong>
          {{
            filters.q
              ? $t('admin.search.contests.emptyFor', { q: filters.q })
              : $t('admin.search.contests.empty')
          }}
        </strong>
        <span>{{ $t('admin.search.contests.emptyAdvice') }}</span>
      </EmptyState>
      <div v-else-if="data">
        <ScrollRegion :label="$t('admin.search.contests.title')">
          <ContestListTable
            :items="data.items"
            :search="filters.q"
            :is-selected="selection.isSelected"
            :is-all-selected="selection.isAllSelected.value"
            :is-some-selected="selection.isSomeSelected.value"
            @toggle="selection.toggle"
            @toggle-all="selection.toggleAll"
          />
        </ScrollRegion>
        <div class="flex flex-wrap items-center justify-between gap-3 pt-3">
          <p class="text-sm text-muted">{{ countText }}</p>
          <NumberedPager :meta="data.meta" :label="$t('admin.search.pager')" />
        </div>
      </div>
    </QueryState>
    <ContestBulkVisibilityDialog
      v-model:visible="isBulkOpen"
      :keys="selection.selected.value"
      :is-visible="isBulkVisible"
      @done="onBulkDone"
    />
  </section>
</template>
