<script setup lang="ts">
import { computed } from 'vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import UserName from '@/components/UserName.vue';
import Card from '@/components/ui/Card.vue';
import SeeAllLink from '@/components/ui/SeeAllLink.vue';
import { useHomeQuery } from '@/features/community/community.queries';
import { formatNumber } from '@/lib/format';
import { medalClass } from '@/lib/medal';
import { useLocaleStore } from '@/stores/locale.store';

/**
 * The anonymous home's one leaderboard card: two short lists, the top performance points and the top contribution
 * points, each with the first few users. The full lists are on the users page.
 */
const ROWS = 3;
const locale = useLocaleStore();
const { data: home, isPending, error, refetch } = useHomeQuery();
const performers = computed(() => (home.value?.topPerformers ?? []).slice(0, ROWS));
const contributors = computed(() => (home.value?.topContributors ?? []).slice(0, ROWS));
const lists = computed(() => [
  {
    key: 'pp',
    title: 'home.anon.topPp',
    to: { name: 'users', query: { sort: 'performancePoints' } },
    rows: performers.value.map((user) => ({
      username: user.username,
      rating: user.rating,
      value: formatNumber(user.performancePoints, locale.locale),
    })),
  },
  {
    key: 'contribution',
    title: 'blog.topContributors',
    to: { name: 'users', query: { sort: 'contributionPoints' } },
    rows: contributors.value.map((user) => ({
      username: user.username,
      rating: user.rating,
      value: formatNumber(user.contributionPoints, locale.locale),
    })),
  },
]);
</script>

<template>
  <Card data-testid="leaderboard" padding="lg" :title="$t('home.anon.leaderboard')">
    <template #actions>
      <SeeAllLink :to="{ name: 'users' }">{{ $t('home.anon.allUsers') }}</SeeAllLink>
    </template>
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <SkeletonBlock v-for="row in 6" :key="row" pill class="mb-2 h-5 w-full" />
      </template>
      <div class="flex flex-col gap-4">
        <section v-for="list in lists" :key="list.key" :data-testid="`leaders-${list.key}`">
          <h3 class="mb-1.5 text-meta font-semibold text-muted">
            <RouterLink :to="list.to" class="hover:underline">{{ $t(list.title) }}</RouterLink>
          </h3>
          <p v-if="!list.rows.length" class="text-muted">{{ $t('home.anon.noPerformers') }}</p>
          <ol v-else class="flex flex-col divide-y divide-line">
            <li
              v-for="(row, index) in list.rows"
              :key="row.username"
              class="flex items-center gap-2.5 py-1.5 first:pt-0 last:pb-0"
            >
              <span
                class="w-5 shrink-0 text-right font-mono text-sm tabular-nums"
                :class="medalClass(index + 1) || 'text-muted'"
                >{{ index + 1 }}</span
              >
              <UserName
                :username="row.username"
                :rating="row.rating"
                class="min-w-0 flex-1 truncate"
              />
              <span class="shrink-0 font-mono text-sm tabular-nums">{{ row.value }}</span>
            </li>
          </ol>
        </section>
      </div>
    </QueryState>
  </Card>
</template>
