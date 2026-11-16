<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ContestListItem, ContestListQuery } from '@/api/types/contests';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import StatusDot from '@/components/ui/StatusDot.vue';
import PageSection from '@/components/ui/PageSection.vue';
import SeeAllLink from '@/components/ui/SeeAllLink.vue';
import { useRunningContestsQuery } from '@/features/community/community.queries';
import { useSpanText } from '@/features/contests/use-span-text';
import { useContestListQuery } from '@/features/contests/contests.queries';
import { spanMessage } from '@/lib/contest-time';
import { formatNumber } from '@/lib/format';
import { formatDate } from '@/lib/format-date';
import { useNow } from '@/lib/use-now';
import { useLocaleStore } from '@/stores/locale.store';

/**
 * The home's contests (both homes): the running ones, then the next ones that have not started, one clickable row each.
 * With none of either it is one line, not a section. `excludeKey` leaves out the contest the viewer is in (it has its own card);
 * one more running contest is asked so the list still fills.
 */
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
const locale = useLocaleStore();
const spanText = useSpanText();
const timeLeftOf = (contest: ContestListItem) =>
  spanText(spanMessage((Date.parse(contest.endTime) - now.value) / 1000));
const retry = () => {
  void running.refetch();
  void upcoming.refetch();
};
const ROW = 'flex min-h-9 items-center gap-3 py-1.5 text-content hover:bg-surface-hover touch:py-3';
</script>

<template>
  <!-- Nothing running or scheduled: one line instead of a section. -->
  <p
    v-if="!isPending && !error && isEmpty"
    data-testid="contests-card"
    class="flex flex-wrap items-center gap-x-2 text-muted"
  >
    {{ $t('home.noLiveContest') }}
    <SeeAllLink :to="{ name: 'contests' }">{{ $t('home.browseContests') }}</SeeAllLink>
  </p>
  <PageSection
    v-else
    data-testid="contests-card"
    :title="$t('nav.contests')"
    :see-all="{ to: { name: 'contests' }, label: $t('common.viewAll') }"
  >
    <QueryState :loading="isPending" :error="error" @retry="retry()">
      <template #skeleton>
        <ul class="flex flex-col divide-y divide-line">
          <li v-for="row in 3" :key="row" class="flex items-center gap-3 py-2">
            <span class="min-w-0 flex-1"><SkeletonBlock text class="w-2/3" /></span>
            <SkeletonBlock text class="w-20" />
          </li>
        </ul>
      </template>
      <ul class="flex flex-col divide-y divide-line">
        <li v-for="contest in runningItems" :key="contest.key" data-testid="running-row">
          <RouterLink :to="{ name: 'contest', params: { key: contest.key } }" :class="ROW">
            <StatusDot tone="live" />
            <span class="min-w-0 flex-1 truncate font-semibold">{{ contest.name }}</span>
            <span class="hidden shrink-0 font-mono text-meta text-muted sm:inline">{{
              $t('home.contestants', { count: formatNumber(contest.userCount, locale.locale) })
            }}</span>
            <span class="shrink-0 text-meta font-semibold text-cue-live">{{
              $t('contests.list.timeLeft', { span: timeLeftOf(contest) })
            }}</span>
          </RouterLink>
        </li>
        <li v-for="contest in upcomingItems" :key="contest.key" data-testid="upcoming-row">
          <RouterLink :to="{ name: 'contest', params: { key: contest.key } }" :class="ROW">
            <StatusDot tone="upcoming" />
            <span class="min-w-0 flex-1 truncate font-semibold">{{ contest.name }}</span>
            <span class="shrink-0 font-mono text-meta text-cue-upcoming">{{
              formatDate(contest.startTime, 'datetime', locale.locale)
            }}</span>
          </RouterLink>
        </li>
      </ul>
    </QueryState>
  </PageSection>
</template>
