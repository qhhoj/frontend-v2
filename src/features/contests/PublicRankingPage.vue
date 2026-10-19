<script setup lang="ts">
import PageHeader from '@/components/ui/PageHeader.vue';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import EmptyState from '@/components/EmptyState.vue';
import Card from '@/components/ui/Card.vue';
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
    <Card v-if="isMissing" as="div">
      <EmptyState data-testid="public-ranking-missing">
        <strong class="block text-content">{{ $t('ranking.public.notFoundTitle') }}</strong>
        {{ $t('ranking.public.notFoundBody') }}
      </EmptyState>
    </Card>
    <QueryState v-else :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton><RankingSkeleton :problem-count="4" :has-time-column="false" /></template>
      <template v-if="data && context">
        <PageHeader :title="data.contest.name">
          <template #above>
            <p class="text-muted">{{ $t('ranking.public.subtitle') }}</p>
          </template>
        </PageHeader>
        <Card v-if="!data.ranking.rows.length" as="div">
          <EmptyState>{{ $t('ranking.empty') }}</EmptyState>
        </Card>
        <Card v-else as="div" class="overflow-hidden">
          <RankingTable
            :ranking="data.ranking"
            :rows="data.ranking.rows"
            :context="context"
            :viewer-id="null"
          />
        </Card>
      </template>
    </QueryState>
  </div>
</template>
