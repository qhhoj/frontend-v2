<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { BOARD_SORTS } from '@/api/types/users';
import GlassCard from '@/components/GlassCard.vue';
import NumberedPager from '@/components/NumberedPager.vue';
import QueryState from '@/components/QueryState.vue';
import StatePanel from '@/components/StatePanel.vue';
import { useLeaderboardQuery } from '@/features/users/users.queries';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import LeaderboardTable from './LeaderboardTable.vue';
import LeaderboardTableSkeleton from './LeaderboardTableSkeleton.vue';
import MyRankCard from './MyRankCard.vue';
import TierLegend from './TierLegend.vue';
import UsernameJump from './UsernameJump.vue';
import { useLeaderboardRoute } from './use-leaderboard-route';

const { sort, page } = useLeaderboardRoute();
const { data, isPending, error, refetch } = useLeaderboardQuery(sort, page);
const session = useSessionStore();
const locale = useLocaleStore();
const listTop = ref<HTMLElement | null>(null);
watch(page, () => listTop.value?.scrollIntoView({ block: 'start' }));
const sortLink = (key: string) => ({ query: key === 'rating' ? {} : { sort: key } });
const total = computed(() => formatNumber(data.value?.meta.total ?? 0, locale.locale));
</script>

<template>
  <div class="page-column">
    <header class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="page-title">{{ $t('leaderboard.title') }}</h1>
        <p class="text-muted">{{ $t('leaderboard.lead', { total }) }}</p>
      </div>
      <UsernameJump />
    </header>
    <nav :aria-label="$t('leaderboard.sortNav')" class="flex flex-wrap gap-2">
      <RouterLink
        v-for="key in BOARD_SORTS"
        :key="key"
        :to="sortLink(key)"
        :aria-current="key === sort ? 'page' : undefined"
        class="inline-flex min-h-11 items-center rounded-pill border border-transparent px-4 font-medium text-muted hover:bg-surface-hover aria-[current=page]:border-line-accent aria-[current=page]:bg-accent-soft aria-[current=page]:text-accent-soft-text"
      >
        {{ $t(`leaderboard.sorts.${key}`) }}
      </RouterLink>
    </nav>
    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_var(--qh-sidebar-width)]">
      <div ref="listTop" class="min-w-0">
        <GlassCard class="flex min-w-0 flex-col gap-4 p-4 sm:p-6">
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
        </GlassCard>
      </div>
      <aside class="flex flex-col gap-6">
        <MyRankCard v-if="session.user" :sort="sort" />
        <TierLegend />
      </aside>
    </div>
  </div>
</template>
