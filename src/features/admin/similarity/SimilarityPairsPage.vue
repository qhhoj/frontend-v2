<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { RouteLocationRaw } from 'vue-router';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { translate } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import { buttonClass } from '../ui/controls';
import { shortId } from '../ui/short-id';
import PairFilters from './PairFilters.vue';
import PairsTable from './PairsTable.vue';
import {
  languagesOf,
  pairFilterFromQuery,
  pairFilterQuery,
  problemOptionsOf,
} from './similarity-pairs';
import type { PairFilter } from './similarity-pairs';
import { useSimilarityPairsQuery, useSimilarityRunQuery } from './similarity.queries';

const route = useRoute();
const router = useRouter();
const locale = useLocaleStore();
const runId = computed(() => String(route.params.runId));
const filter = computed(() => pairFilterFromQuery(route.query));
const run = useSimilarityRunQuery(runId);
const pairs = useSimilarityPairsQuery(runId, filter);

const groups = computed(() => run.data.value?.groups ?? []);
const problems = computed(() => problemOptionsOf(groups.value));
const languages = computed(() => languagesOf(groups.value));
const runMinPercent = computed(() => run.data.value?.limits.minPercent ?? 0);
/** A problem run goes back to its own problem's list; a contest run has no key in the run, so it has no link back. */
const problemCode = computed(() =>
  run.data.value?.scope === 'problem' ? groups.value[0]?.problemCode : undefined,
);
const summaryTo = computed<RouteLocationRaw | null>(() =>
  problemCode.value
    ? { name: 'admin-similarity', query: { problem: problemCode.value, run: runId.value } }
    : null,
);
const trail = computed(() => [
  problemCode.value
    ? {
        label: problemCode.value,
        to: { name: 'admin-similarity', query: { problem: problemCode.value } },
        mono: true,
      }
    : { label: translate('admin.similarity.pairs.contestCrumb') },
  { label: shortId(runId.value), mono: true },
]);
const lead = computed(() => {
  const finishedAt = run.data.value?.finishedAt;
  return finishedAt
    ? translate('admin.similarity.pairs.lead', {
        id: shortId(runId.value),
        finishedAt: formatDate(finishedAt, 'datetime', locale.locale),
      })
    : shortId(runId.value);
});

const countLine = computed(() => {
  const total = formatNumber(pairs.data.value?.meta.total ?? 0, locale.locale);
  const minPercent = filter.value.minPercent;
  return minPercent === null
    ? translate('admin.similarity.pairs.count', { count: total })
    : translate('admin.similarity.pairs.countAbove', { count: total, percent: minPercent });
});

/** Moves to the list for `next`; `null` clears every filter. */
const showFilter = (next: PairFilter | null) =>
  router.replace({
    name: 'admin-similarityPairs',
    params: { runId: runId.value },
    query: next ? pairFilterQuery(next) : {},
  });
</script>

<template>
  <AdminPageHeader :trail="trail" :title="$t('admin.similarity.pairs.title')" :lead="lead">
    <template #actions>
      <RouterLink v-if="summaryTo" :to="summaryTo" :class="buttonClass('secondary')">
        {{ $t('admin.similarity.pairs.backToSummary') }}
      </RouterLink>
    </template>
  </AdminPageHeader>
  <PairFilters
    :filter="filter"
    :problems="problems"
    :languages="languages"
    :run-min-percent="runMinPercent"
    @change="showFilter"
    @reset="showFilter(null)"
  />
  <QueryState :loading="pairs.isPending.value" :error="pairs.error.value" @retry="pairs.refetch()">
    <template #skeleton><SkeletonBlock class="h-60 w-full" /></template>
    <p class="m-0 text-sm font-semibold" aria-live="polite">{{ countLine }}</p>
    <PairsTable
      :pairs="pairs.data.value?.items ?? []"
      :total="pairs.data.value?.meta.total ?? 0"
      :filter="filter"
      @reset="showFilter(null)"
    />
  </QueryState>
</template>
