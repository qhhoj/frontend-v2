<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ContestListItem, ContestListQuery } from '@/api/types/contests';
import EmptyState from '@/components/EmptyState.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import Chip from '@/components/ui/Chip.vue';
import { CUE_ROW } from '@/components/ui/cue-tones';
import PageSection from '@/components/ui/PageSection.vue';
import SeeAllLink from '@/components/ui/SeeAllLink.vue';
import { useRunningContestsQuery } from '@/features/community/community.queries';
import { useSpanText } from '@/features/contests/use-span-text';
import { useContestListQuery } from '@/features/contests/contests.queries';
import { spanMessage } from '@/lib/contest-time';
import { useNow } from '@/lib/use-now';

/**
 * The home's contests (both homes): the running ones, then the next ones that have not started, one clickable row each (the name and the cue chip: the home puts it in the narrow column, and the date and the contestants are on the contest page).
 * With none running it is one inline line above the upcoming rows (with none of either, the line carries the way to the list). `excludeKey` leaves out the contest the viewer is in (it has its own card);
 * one more running contest is asked so the list still fills.
 */
const CONTESTS = { name: 'contests' };
const MAX_RUNNING = 3;
const MAX_UPCOMING = 3;
const props = defineProps<{ excludeKey?: string }>();
const running = useRunningContestsQuery(MAX_RUNNING + 1);
const upcoming = useContestListQuery(
  ref<ContestListQuery>({ phase: 'upcoming', pageSize: MAX_UPCOMING }),
);
const runningItems = computed(() =>
  (running.data.value?.items ?? [])
    .filter((contest) => contest.key !== props.excludeKey)
    .slice(0, MAX_RUNNING),
);
const upcomingItems = computed(() => (upcoming.data.value?.items ?? []).slice(0, MAX_UPCOMING));
const isPending = computed(() => running.isPending.value || upcoming.isPending.value);
const error = computed(() => running.error.value || upcoming.error.value);
const isEmpty = computed(() => !runningItems.value.length && !upcomingItems.value.length);
const now = useNow(30_000);
const spanText = useSpanText();
const timeLeftOf = (contest: ContestListItem) =>
  spanText(spanMessage((Date.parse(contest.endTime) - now.value) / 1000));
const timeToStartOf = (contest: ContestListItem) =>
  spanText(spanMessage((Date.parse(contest.startTime) - now.value) / 1000));
const retry = () => {
  void running.refetch();
  void upcoming.refetch();
};
const ROW =
  'flex min-h-(--qh-row) items-center gap-3 pr-2 pl-3 text-content hover:bg-surface-hover';
</script>

<template>
  <PageSection
    data-testid="contests-card"
    :title="$t('nav.contests')"
    :see-all="{ to: { name: 'contests' }, label: $t('common.viewAll') }"
  >
    <QueryState :loading="isPending" :error="error" @retry="retry()">
      <template #skeleton>
        <ul class="flex flex-col divide-y divide-line">
          <li v-for="row in 3" :key="row" class="flex min-h-(--qh-row) items-center gap-3">
            <span class="min-w-0 flex-1"><SkeletonBlock text class="w-2/3" /></span>
            <SkeletonBlock text class="w-20" />
          </li>
        </ul>
      </template>
      <!-- Nothing running: one line, then the upcoming rows. Nothing scheduled either: the same line with the way to the list. -->
      <EmptyState v-if="!runningItems.length" inline data-testid="contests-empty">
        {{ $t('home.noLiveContest') }}
        <template #action>
          <SeeAllLink v-if="isEmpty" :to="CONTESTS">{{ $t('home.browseContests') }}</SeeAllLink>
        </template>
      </EmptyState>
      <ul class="flex flex-col divide-y divide-line">
        <li
          v-for="contest in runningItems"
          :key="contest.key"
          data-testid="running-row"
          :class="CUE_ROW.live"
        >
          <RouterLink :to="{ name: 'contest', params: { key: contest.key } }" :class="ROW">
            <span class="min-w-0 flex-1 truncate font-semibold">{{ contest.name }}</span>
            <Chip tone="live" dot>{{
              $t('contests.list.timeLeft', { span: timeLeftOf(contest) })
            }}</Chip>
          </RouterLink>
        </li>
        <li
          v-for="contest in upcomingItems"
          :key="contest.key"
          data-testid="upcoming-row"
          :class="CUE_ROW.upcoming"
        >
          <RouterLink :to="{ name: 'contest', params: { key: contest.key } }" :class="ROW">
            <span class="min-w-0 flex-1 truncate font-semibold">{{ contest.name }}</span>
            <Chip tone="upcoming" dot>{{
              $t('contests.list.timeLeft', { span: timeToStartOf(contest) })
            }}</Chip>
          </RouterLink>
        </li>
      </ul>
    </QueryState>
  </PageSection>
</template>
