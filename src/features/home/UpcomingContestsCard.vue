<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ContestListQuery } from '@/api/types/contests';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import Card from '@/components/ui/Card.vue';
import SeeAllLink from '@/components/ui/SeeAllLink.vue';
import { useContestListQuery } from '@/features/contests/contests.queries';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';

/** The next three contests that have not started, soonest first (the API sorts them so). */
const UPCOMING_COUNT = 3;
const locale = useLocaleStore();
const { data, isPending, error, refetch } = useContestListQuery(
  ref<ContestListQuery>({ phase: 'upcoming', pageSize: UPCOMING_COUNT }),
);
const contests = computed(() => (data.value?.items ?? []).slice(0, UPCOMING_COUNT));
</script>

<template>
  <!-- Nothing scheduled: one line instead of a card. -->
  <p
    v-if="!isPending && !error && !contests.length"
    data-testid="upcoming-contests"
    class="text-muted"
  >
    {{ $t('home.noUpcoming') }}
  </p>
  <Card v-else data-testid="upcoming-contests" padding="lg" :title="$t('home.upcoming')">
    <template #actions>
      <SeeAllLink :to="{ name: 'contests' }">{{ $t('home.anon.allContests') }}</SeeAllLink>
    </template>
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <div class="flex flex-col gap-3">
          <div v-for="row in 2" :key="row" class="flex flex-col gap-1.5">
            <SkeletonBlock pill class="h-4 w-3/4" />
            <SkeletonBlock pill class="h-3 w-1/2" />
          </div>
        </div>
      </template>
      <ul class="flex flex-col gap-3">
        <li v-for="contest in contests" :key="contest.key" class="flex flex-col">
          <RouterLink
            :to="{ name: 'contest', params: { key: contest.key } }"
            class="font-semibold hover:underline"
            >{{ contest.name }}</RouterLink
          >
          <span class="text-caption leading-4 text-muted">{{
            formatDate(contest.startTime, 'datetime', locale.locale)
          }}</span>
        </li>
      </ul>
    </QueryState>
  </Card>
</template>
