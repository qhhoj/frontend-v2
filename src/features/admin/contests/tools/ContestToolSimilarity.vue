<script setup lang="ts">
import { computed, ref } from 'vue';
import type { EditableContest } from '@/api/types/contest-editing';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import AppButton from '@/components/ui/AppButton.vue';
import PageSection from '@/components/ui/PageSection.vue';
import { usePermissions } from '@/stores/use-permissions';
import PairsTable from '../../similarity/PairsTable.vue';
import SimilarityRunsTable from '../../similarity/SimilarityRunsTable.vue';
import SimilarityStartResult from '../../similarity/SimilarityStartResult.vue';
import type { PairFilter } from '../../similarity/similarity-pairs';
import { activeRunOf } from '../../similarity/similarity-runs';
import { useStartSimilarityRun } from '../../similarity/similarity.mutations';
import {
  useSimilarityPairsQuery,
  useSimilarityRunsQuery,
} from '../../similarity/similarity.queries';
import { needsPermissionText } from '../../ui/permission-text';

/**
 * Similarity for this contest, on the contest's own page: start a run (the hourly limit is said before the click), this
 * contest's runs with their state (the list refreshes itself while one is queued or running), and a finished run's most
 * similar pairs right under the list. A pair's row opens the two sources; the full, filterable list is one link away.
 */
const props = defineProps<{ contest: EditableContest }>();
const KEY = 'admin.contests.workbench.tools.similarity';
const PREVIEW_PAIRS = 10;
const FIRST_PAGE: PairFilter = { problemId: '', language: '', minPercent: null, page: 1 };
const { can } = usePermissions();
const scope = computed(() => ({ contest: props.contest.key }));
const runs = useSimilarityRunsQuery(scope);
const { isPending, isDone, failure, startRun } = useStartSimilarityRun(scope);
const runList = computed(() => runs.data.value ?? []);
const hasActiveRun = computed(() => activeRunOf(runList.value) !== null);

const openRunId = ref<string | null>(null);
const toggleRun = (runId: string) => (openRunId.value = openRunId.value === runId ? null : runId);
/** Asked only once a run is opened; the id it is asked for is never empty then. */
const pairs = useSimilarityPairsQuery(() => openRunId.value ?? '', FIRST_PAGE, {
  enabled: () => openRunId.value !== null,
});
const topPairs = computed(() => (pairs.data.value?.items ?? []).slice(0, PREVIEW_PAIRS));
const pairTotal = computed(() => pairs.data.value?.meta.total ?? 0);
</script>

<template>
  <PageSection :title="$t(`${KEY}.title`)" data-testid="contest-tool-similarity">
    <p v-if="!can('judge.moss_contest')" class="m-0 text-meta text-muted">
      {{ needsPermissionText('judge.moss_contest') }}
    </p>
    <div v-else class="flex flex-col gap-3">
      <div class="flex flex-wrap items-center gap-3">
        <AppButton
          data-testid="similarity-start"
          :loading="isPending"
          :disabled="hasActiveRun"
          :disabled-reason="$t(`${KEY}.running`)"
          @click="startRun"
        >
          {{ $t('admin.similarity.scope.start') }}
        </AppButton>
        <p class="m-0 text-meta text-muted">{{ $t('admin.similarity.scope.startHint') }}</p>
      </div>
      <SimilarityStartResult :is-done="isDone" :failure="failure" :running-to="null" />
      <QueryState :loading="runs.isPending.value" :error="runs.error.value" @retry="runs.refetch()">
        <template #skeleton><SkeletonBlock class="h-(--qh-row) w-full" /></template>
        <SimilarityRunsTable
          :runs="runList"
          :scope="scope"
          in-place
          :open-id="openRunId"
          @open="toggleRun"
        />
      </QueryState>
      <section
        v-if="openRunId"
        class="flex flex-col gap-2"
        :aria-label="$t(`${KEY}.pairsTitle`)"
        data-testid="similarity-pairs"
      >
        <QueryState
          :loading="pairs.isPending.value"
          :error="pairs.error.value"
          @retry="pairs.refetch()"
        >
          <template #skeleton><SkeletonBlock class="h-(--qh-row) w-full" /></template>
          <div class="flex flex-wrap items-center justify-between gap-2 text-meta">
            <p class="m-0 font-semibold" aria-live="polite">
              {{ $t(`${KEY}.pairsShown`, { shown: topPairs.length, total: pairTotal }) }}
            </p>
            <AppButton
              tone="link"
              class="text-meta"
              :to="{ name: 'admin-similarityPairs', params: { runId: openRunId } }"
            >
              {{ $t(`${KEY}.allPairs`) }}
            </AppButton>
          </div>
          <PairsTable :pairs="topPairs" :total="pairTotal" :filter="FIRST_PAGE" preview />
        </QueryState>
      </section>
    </div>
  </PageSection>
</template>
