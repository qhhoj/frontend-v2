<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { ApiError } from '@/api/client';
import EmptyState from '@/components/EmptyState.vue';
import GlassCard from '@/components/GlassCard.vue';
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
const tiles = computed(() =>
  stats.value ? statTiles(stats.value, contest.value?.userCount ?? 0, locale.locale) : [],
);
</script>

<template>
  <div class="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-8">
    <ContestNotFound v-if="isMissing" />
    <template v-else>
      <ContestCompactHeader v-if="contest" :contest="contest" />
      <ContestTabs :contest-key="key" />
      <GlassCard v-if="isClosed" as="div">
        <EmptyState>
          <strong class="block text-content">{{ $t('contests.stats.closedTitle') }}</strong>
          {{ $t('contests.stats.closedBody') }}
          <RouterLink
            :to="{ name: 'contest-ranking', params: { key } }"
            class="mt-2 inline-flex min-h-11 items-center text-accent-text underline"
          >
            {{ $t('contests.stats.toRanking') }}
          </RouterLink>
        </EmptyState>
      </GlassCard>
      <QueryState v-else :loading="isPending" :error="error" @retry="refetch()">
        <template #skeleton>
          <dl class="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div
              v-for="tile in 4"
              :key="tile"
              data-skeleton-region="stats-tile"
              class="glass rounded-card p-5"
            >
              <dd class="font-display text-3xl font-bold"><SkeletonBlock text class="w-20" /></dd>
              <dt class="text-sm"><SkeletonBlock text class="w-28" /></dt>
            </div>
          </dl>
          <SkeletonBlock data-skeleton-region="problem-results" class="h-72 w-full rounded-card" />
        </template>
        <template v-if="stats">
          <dl data-testid="stats-tiles" class="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div
              v-for="tile in tiles"
              :key="tile.id"
              class="glass flex flex-col-reverse rounded-card p-5"
            >
              <dt class="text-sm text-muted">{{ $t(tile.labelKey) }}</dt>
              <dd class="font-display text-3xl font-bold">{{ tile.value }}</dd>
            </div>
          </dl>
          <ProblemResultsTable :problems="stats.problems" />
          <LanguageStatsTable :languages="stats.languages" />
        </template>
      </QueryState>
    </template>
  </div>
</template>
