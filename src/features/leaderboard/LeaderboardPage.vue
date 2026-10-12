<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import Card from '@/components/ui/Card.vue';
import NumberedPager from '@/components/NumberedPager.vue';
import QueryState from '@/components/QueryState.vue';
import StatePanel from '@/components/StatePanel.vue';
import { useLeaderboardQuery } from '@/features/users/users.queries';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import LeaderboardTable from './LeaderboardTable.vue';
import LeaderboardTableSkeleton from './LeaderboardTableSkeleton.vue';
import MyRankLine from './MyRankLine.vue';
import UsernameJump from './UsernameJump.vue';
import { useLeaderboardRoute } from './use-leaderboard-route';

const { sort, page } = useLeaderboardRoute();
const { data, isPending, error, refetch } = useLeaderboardQuery(sort, page);
const session = useSessionStore();
const locale = useLocaleStore();
const listTop = ref<HTMLElement | null>(null);
watch(page, () => listTop.value?.scrollIntoView({ block: 'start' }));
const total = computed(() => formatNumber(data.value?.meta.total ?? 0, locale.locale));
</script>

<template>
  <div class="page-column">
    <header class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="page-title">{{ $t('leaderboard.title') }}</h1>
        <p class="text-muted">
          {{ $t('leaderboard.lead', { total }) }}
          <MyRankLine v-if="session.user" :sort="sort" />
        </p>
      </div>
      <UsernameJump />
    </header>
    <div ref="listTop" class="min-w-0">
      <Card class="flex min-w-0 flex-col gap-4 p-4 sm:p-6">
        <QueryState :loading="isPending" :error="error" @retry="refetch()">
          <template #skeleton><LeaderboardTableSkeleton :sort="sort" /></template>
          <StatePanel
            v-if="!data?.items.length"
            kind="communityEmpty"
            :title="$t('leaderboard.empty')"
          />
          <template v-else>
            <LeaderboardTable
              :entries="data.items"
              :sort="sort"
              :viewer-name="session.user?.username ?? null"
            />
            <NumberedPager :meta="data.meta" :label="$t('leaderboard.pagerLabel')" />
          </template>
        </QueryState>
      </Card>
    </div>
  </div>
</template>
