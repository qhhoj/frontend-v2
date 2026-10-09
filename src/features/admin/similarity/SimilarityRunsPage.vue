<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { RouteLocationRaw } from 'vue-router';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import type { SimilarityScope } from '@/api/types/similarity';
import AdminPageHeader from '../ui/AdminPageHeader.vue';
import SimilarityNotFoundCard from './SimilarityNotFoundCard.vue';
import SimilarityRunSummary from './SimilarityRunSummary.vue';
import SimilarityRunsTable from './SimilarityRunsTable.vue';
import SimilarityScopeForm from './SimilarityScopeForm.vue';
import SimilarityStartResult from './SimilarityStartResult.vue';
import { useStartSimilarityRun } from './similarity.mutations';
import { useSimilarityRunQuery, useSimilarityRunsQuery } from './similarity.queries';
import {
  activeRunOf,
  isNotFound,
  runIdFromQuery,
  scopeFromQuery,
  scopeQuery,
} from './similarity-runs';

const route = useRoute();
const router = useRouter();
const scope = computed(() => scopeFromQuery(route.query));
const runId = computed(() => runIdFromQuery(route.query));
const runs = useSimilarityRunsQuery(scope);
const selectedRun = useSimilarityRunQuery(runId);
const { isPending, isDone, failure, startRun } = useStartSimilarityRun(scope);

const runList = computed(() => runs.data.value ?? []);
/** A 404 names no reason (unknown or not editable), so the page shows one plain card for it. */
const isMissing = computed(() => isNotFound(runs.error.value) || isNotFound(failure.value));
const runningTo = computed<RouteLocationRaw | null>(() => {
  const active = activeRunOf(runList.value);
  return scope.value && active
    ? { name: 'admin-similarity', query: { ...scopeQuery(scope.value), run: active.id } }
    : null;
});

const viewScope = (next: SimilarityScope) =>
  router.push({ name: 'admin-similarity', query: scopeQuery(next) });
</script>

<template>
  <AdminPageHeader
    :crumbs="[{ label: $t('admin.similarity.title') }]"
    :title="$t('admin.similarity.title')"
    :lead="$t('admin.similarity.lead')"
  />
  <SimilarityScopeForm :scope="scope" :is-pending="isPending" @view="viewScope" @start="startRun" />
  <SimilarityNotFoundCard v-if="scope && isMissing" />
  <template v-else-if="scope">
    <SimilarityStartResult :is-done="isDone" :failure="failure" :running-to="runningTo" />
    <QueryState :loading="runs.isPending.value" :error="runs.error.value" @retry="runs.refetch()">
      <template #skeleton
        ><SkeletonBlock data-skeleton-region="similarity-runs" class="h-24 w-full"
      /></template>
      <SimilarityRunsTable :runs="runList" :scope="scope" />
    </QueryState>
    <QueryState
      v-if="runId"
      :loading="selectedRun.isPending.value"
      :error="selectedRun.error.value"
      @retry="selectedRun.refetch()"
    >
      <template #skeleton><SkeletonBlock class="h-60 w-full" /></template>
      <SimilarityRunSummary v-if="selectedRun.data.value" :run="selectedRun.data.value" />
    </QueryState>
  </template>
</template>
