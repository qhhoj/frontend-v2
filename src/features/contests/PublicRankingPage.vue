<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import EmptyState from '@/components/EmptyState.vue';
import GlassCard from '@/components/GlassCard.vue';
import QueryState from '@/components/QueryState.vue';
import { ApiError } from '@/api/client';
import { showsCellTime } from '@/lib/ranking-cells';
import type { RankingContext } from '@/lib/ranking-cells';
import { useLocaleStore } from '@/stores/locale.store';
import RankingSkeleton from './RankingSkeleton.vue';
import RankingTable from './RankingTable.vue';
import { usePublicRankingQuery } from './contests.queries';

const route = useRoute();
const locale = useLocaleStore();
const { data, isPending, error, refetch } = usePublicRankingQuery(() => String(route.params.token));
const isMissing = computed(() => error.value instanceof ApiError && error.value.status === 404);
const context = computed<RankingContext | null>(() => {
  const contest = data.value?.contest;
  if (!contest) return null;
  return {
    formatName: contest.formatName,
    pointsPrecision: contest.pointsPrecision,
    locale: locale.locale,
    showsTime: showsCellTime(contest.formatName, contest.formatConfig),
  };
});
</script>

<template>
  <div class="page-column">
    <EmptyState v-if="isMissing" class="glass rounded-card" data-testid="public-ranking-missing">
      <strong class="block text-content">{{ $t('ranking.public.notFoundTitle') }}</strong>
      {{ $t('ranking.public.notFoundBody') }}
    </EmptyState>
    <QueryState v-else :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton><RankingSkeleton :problem-count="4" :has-time-column="false" /></template>
      <template v-if="data && context">
        <div>
          <p class="text-muted">{{ $t('ranking.public.subtitle') }}</p>
          <h1 class="mt-1 page-title">{{ data.contest.name }}</h1>
        </div>
        <EmptyState v-if="!data.ranking.rows.length" class="glass rounded-card">{{
          $t('ranking.empty')
        }}</EmptyState>
        <GlassCard v-else as="div" class="overflow-hidden">
          <RankingTable
            :ranking="data.ranking"
            :rows="data.ranking.rows"
            :context="context"
            :viewer-id="null"
          />
        </GlassCard>
      </template>
    </QueryState>
  </div>
</template>
