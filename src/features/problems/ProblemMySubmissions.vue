<script setup lang="ts">
import { computed } from 'vue';
import { IN_PROGRESS_STATUSES } from '@/api/types/submissions';
import InlineBit from '@/components/InlineBit.vue';
import GlassCard from '@/components/GlassCard.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import StateBit from '@/components/StateBit.vue';
import VerdictBadge from '@/components/VerdictBadge.vue';
import { GLOBAL_SCOPE } from '@/features/submissions/list/submission-scope';
import { useScopedSubmissionListQuery } from '@/features/submissions/submissions.queries';
import type { SubmissionFilters } from '@/features/submissions/use-submission-filters';
import { formatAgoCompact, formatNumber } from '@/lib/format';
import { useNow } from '@/lib/use-now';
import { verdictOf } from '@/lib/verdicts';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';

const SHOWN = 3;
const CLOCK_TICK_MS = 60_000;
/** The signed-in viewer's last three submissions to this problem. */
const props = defineProps<{ code: string; points: number }>();
const session = useSessionStore();
const locale = useLocaleStore();
const now = useNow(CLOCK_TICK_MS);
const filters = computed<SubmissionFilters>(() => ({
  problem: props.code,
  user: session.user?.username ?? '',
  results: [],
  languageIds: [],
  statusGroups: [],
  page: 1,
  live: false,
}));
const {
  data: list,
  isPending,
  error,
  refetch,
} = useScopedSubmissionListQuery(GLOBAL_SCOPE, filters);
const latest = computed(() => list.value?.items.slice(0, SHOWN) ?? []);
const isJudging = computed(() => {
  const first = latest.value[0];
  return first !== undefined && IN_PROGRESS_STATUSES.includes(first.status);
});
const score = (points: number | null) =>
  `${points === null ? '–' : formatNumber(points, locale.locale, 2)} / ${formatNumber(props.points, locale.locale, 2)}`;
</script>

<template>
  <GlassCard class="flex flex-col gap-2 rounded-panel p-4" data-testid="rail-my-submissions">
    <div class="flex items-center justify-between gap-2">
      <h2 class="flex items-center gap-2 font-display text-title font-bold">
        {{ $t('problem.rail.mine.title') }}
        <StateBit v-if="isJudging" variant="judging" size="tiny" />
      </h2>
      <RouterLink
        :to="{ name: 'submissions', query: { problem: code, user: session.user?.username } }"
        class="inline-flex min-h-8 items-center text-meta font-bold text-accent-text hover:underline"
        >{{ $t('common.viewAll') }}</RouterLink
      >
    </div>
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <SkeletonBlock v-for="row in SHOWN" :key="row" class="h-11" />
      </template>
      <p v-if="!latest.length" class="flex items-center gap-2 text-sm text-muted">
        <InlineBit kind="asleep" />{{ $t('problem.noSubmissions') }}
      </p>
      <ol v-else class="flex flex-col">
        <li
          v-for="submission in latest"
          :key="submission.id"
          class="flex min-h-11 items-center gap-2.5 border-t border-line"
        >
          <RouterLink :to="{ name: 'submission', params: { id: submission.id } }">
            <VerdictBadge :verdict="verdictOf(submission)" size="sm" />
          </RouterLink>
          <span class="font-mono font-bold tabular-nums">{{ score(submission.points) }}</span>
          <time :datetime="submission.date" class="ml-auto text-meta text-muted">{{
            formatAgoCompact(submission.date, now, locale.locale)
          }}</time>
        </li>
      </ol>
    </QueryState>
  </GlassCard>
</template>
