<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { ApiError } from '@/api/client';
import BitLoop from '@/components/BitLoop.vue';
import Card from '@/components/ui/Card.vue';
import StatGrid from '@/components/ui/StatGrid.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { usePageTitle } from '@/router/page-title';
import { useLocaleStore } from '@/stores/locale.store';
import ContestCompactHeader from './ContestCompactHeader.vue';
import ContestNotFound from './ContestNotFound.vue';
import ContestTabs from './ContestTabs.vue';
import { useContestQuery, useContestStatsQuery } from './contests.queries';
import LanguageStatsTable from './LanguageStatsTable.vue';
import ProblemResultsTable from './ProblemResultsTable.vue';
import { statTiles } from './stats-summary';

const { t } = useI18n();
const route = useRoute();
const locale = useLocaleStore();
const key = computed(() => String(route.params.key));
const { data: contest, error: contestError } = useContestQuery(key);
const { data: stats, isPending, error, refetch } = useContestStatsQuery(key);
usePageTitle(() => contest.value?.name);
const isClosed = computed(() => error.value instanceof ApiError && error.value.status === 403);
const isMissing = computed(
  () => contestError.value instanceof ApiError && contestError.value.status === 404,
);
const solverCounts = computed(
  () =>
    new Map(
      (contest.value?.problems ?? []).map((problem) => [problem.problemId, problem.solverCount]),
    ),
);
const tiles = computed(() =>
  stats.value
    ? statTiles(stats.value, contest.value?.userCount ?? 0, locale.locale).map((tile) => ({
        label: t(tile.labelKey),
        value: tile.value,
      }))
    : [],
);
</script>

<template>
  <div class="page-column">
    <ContestNotFound v-if="isMissing" />
    <template v-else>
      <ContestTabs :contest-key="key" :phase="contest?.phase" />
      <ContestCompactHeader v-if="contest" :contest="contest" />
      <Card v-if="isClosed" as="div" class="flex flex-col items-center gap-2 px-6 py-8 text-center">
        <BitLoop kind="security" :label="$t('contests.stats.closedTitle')" class="[--bit-px:4px]" />
        <strong class="block text-content">{{ $t('contests.stats.closedTitle') }}</strong>
        <p class="text-muted">{{ $t('contests.stats.closedBody') }}</p>
        <RouterLink
          :to="{ name: 'contest-ranking', params: { key } }"
          class="mt-2 inline-flex min-h-11 items-center text-accent-text underline"
        >
          {{ $t('contests.stats.toRanking') }}
        </RouterLink>
      </Card>
      <QueryState v-else :loading="isPending" :error="error" @retry="refetch()">
        <template #skeleton>
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card
              v-for="tile in 4"
              :key="tile"
              as="div"
              variant="inset"
              padding="sm"
              data-skeleton-region="stats-tile"
            >
              <p class="text-meta leading-4.5"><SkeletonBlock text class="w-28" /></p>
              <p class="mt-1 text-stat leading-none"><SkeletonBlock text class="w-20" /></p>
            </Card>
          </div>
          <SkeletonBlock data-skeleton-region="problem-results" class="h-72 w-full rounded-card" />
        </template>
        <template v-if="stats">
          <StatGrid data-testid="stats-tiles" :items="tiles" :cols="4" mode="stat" />
          <ProblemResultsTable :problems="stats.problems" :solver-counts="solverCounts" />
          <LanguageStatsTable :languages="stats.languages" />
        </template>
      </QueryState>
    </template>
  </div>
</template>
