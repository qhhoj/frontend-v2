<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import type { BulkVisibilityResult } from '@/api/types/problems';
import EmptyState from '@/components/EmptyState.vue';
import NumberedPager from '@/components/NumberedPager.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { usePermissions } from '@/stores/use-permissions';
import { useProblemEditingMetaQuery } from '../problems/problem-editing.queries';
import { isNotFound } from '../ui/admin-errors';
import { ADMIN_BUTTON_CLASS } from '../ui/classes';
import IndexSearchBox from './IndexSearchBox.vue';
import ProblemBulkResult from './ProblemBulkResult.vue';
import ProblemBulkVisibilityDialog from './ProblemBulkVisibilityDialog.vue';
import ProblemListFilters from './ProblemListFilters.vue';
import ProblemListTable from './ProblemListTable.vue';
import { useAdminProblemSearchQuery, useAuthorIdQuery } from './index-search.queries';
import { filterQueryOf, filtersFromQuery, listQueryOf } from './problem-list-filters';
import type { FilterPatch } from './problem-list-filters';
import { useProblemSelection } from './use-problem-selection';

const route = useRoute();
const router = useRouter();
const locale = useLocaleStore();
const { t } = useI18n();
const { can } = usePermissions();
const filters = computed(() => filtersFromQuery(route.query));
const author = computed(() => filters.value.author);
const { data: meta } = useProblemEditingMetaQuery();
const authorLookup = useAuthorIdQuery(author);
const isAuthorUnknown = computed(() => author.value !== '' && isNotFound(authorLookup.error.value));
/** A lookup that failed for another reason (network, 5xx) shows as the list's error, with a retry. */
const lookupError = computed(() => (isAuthorUnknown.value ? null : authorLookup.error.value));
const listQuery = computed(() => listQueryOf(filters.value, authorLookup.data.value));
const isReady = computed(() => author.value === '' || authorLookup.isSuccess.value);
const { data, isPending, error, refetch } = useAdminProblemSearchQuery(listQuery, isReady);
const retry = () => void (lookupError.value ? authorLookup.refetch() : refetch());
const change = (patch: FilterPatch) =>
  void router.replace({ query: filterQueryOf(route.query, patch) });

const canBulk = computed(() => can('judge.change_public_visibility'));
const pageCodes = computed(() => (data.value?.items ?? []).map((item) => item.code));
const selection = useProblemSelection(pageCodes);
const lastResult = ref<BulkVisibilityResult | null>(null);
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
const isBulkPublic = ref(true);
function openBulk(isPublic: boolean) {
  isBulkPublic.value = isPublic;
  isBulkOpen.value = true;
}
function onBulkDone(result: BulkVisibilityResult) {
  lastResult.value = result;
  selection.clear();
}

const countText = computed(() => {
  const values = {
    shown: formatNumber(data.value?.items.length ?? 0, locale.locale),
    total: formatNumber(data.value?.meta.total ?? 0, locale.locale),
    q: filters.value.q,
  };
  return t(
    filters.value.q ? 'admin.search.problems.countFor' : 'admin.search.problems.count',
    values,
  );
});
</script>

<template>
  <section
    class="glass flex min-w-0 flex-col gap-4 rounded-panel p-5"
    aria-labelledby="problem-search-title"
  >
    <h2 id="problem-search-title" class="font-display text-xl font-semibold">
      {{ $t('admin.search.problems.title') }}
    </h2>
    <IndexSearchBox
      :value="filters.q"
      :label="$t('admin.search.problems.label')"
      :placeholder="$t('admin.search.problems.placeholder')"
      :clear-label="$t('admin.search.clear')"
      :hint="$t('admin.search.problems.hint')"
      :status="data ? countText : ''"
      @commit="(q: string) => change({ q })"
    />
    <ProblemListFilters
      :filters="filters"
      :meta="meta"
      :author-error="isAuthorUnknown ? $t('admin.ui.noSuchUser', { name: author }) : ''"
      @change="change"
    />
    <div
      v-if="canBulk && selection.selected.value.length > 0"
      class="sticky top-0 z-10 flex flex-wrap items-center gap-3 rounded-row border border-line-strong bg-surface-solid p-3"
    >
      <p class="text-sm font-semibold" role="status">
        {{ $t('admin.problemList.selected', { count: selection.selected.value.length }) }}
      </p>
      <button type="button" :class="ADMIN_BUTTON_CLASS" @click="openBulk(true)">
        {{ $t('admin.problemList.bulk.publish') }}
      </button>
      <button type="button" :class="ADMIN_BUTTON_CLASS" @click="openBulk(false)">
        {{ $t('admin.problemList.bulk.unpublish') }}
      </button>
      <button type="button" class="text-sm text-muted underline" @click="selection.clear">
        {{ $t('admin.problemList.clearSelection') }}
      </button>
    </div>
    <ProblemBulkResult v-if="lastResult" :result="lastResult" />
    <EmptyState v-if="isAuthorUnknown" compact>
      <strong>{{ $t('admin.ui.noSuchUser', { name: author }) }}</strong>
    </EmptyState>
    <QueryState
      v-else
      :loading="isPending && !lookupError"
      :error="error ?? lookupError"
      @retry="retry"
    >
      <template #skeleton>
        <SkeletonBlock
          data-skeleton-region="problem-search-table"
          class="h-[17.25rem] w-full rounded-row sm:h-[15rem]"
        />
      </template>
      <EmptyState v-if="data && data.items.length === 0" compact>
        <strong>
          {{
            filters.q
              ? $t('admin.search.problems.emptyFor', { q: filters.q })
              : $t('admin.search.problems.empty')
          }}
        </strong>
        <span>{{ $t('admin.search.problems.emptyAdvice') }}</span>
      </EmptyState>
      <div v-else-if="data" class="overflow-x-auto">
        <ProblemListTable
          :items="data.items"
          :search="filters.q"
          :selectable="canBulk"
          :is-selected="selection.isSelected"
          :is-all-selected="selection.isAllSelected.value"
          :is-some-selected="selection.isSomeSelected.value"
          @toggle="selection.toggle"
          @toggle-all="selection.toggleAll"
        />
        <div class="flex flex-wrap items-center justify-between gap-3 pt-3">
          <p class="text-sm text-muted">{{ countText }}</p>
          <NumberedPager :meta="data.meta" :label="$t('admin.search.pager')" />
        </div>
      </div>
    </QueryState>
    <ProblemBulkVisibilityDialog
      v-model:visible="isBulkOpen"
      :codes="selection.selected.value"
      :is-public="isBulkPublic"
      @done="onBulkDone"
    />
  </section>
</template>
