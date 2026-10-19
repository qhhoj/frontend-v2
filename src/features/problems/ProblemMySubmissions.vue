<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { SubmissionListItem } from '@/api/types/submissions';
import { IN_PROGRESS_STATUSES } from '@/api/types/submissions';
import InlineBit from '@/components/InlineBit.vue';
import Card from '@/components/ui/Card.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import StateBit from '@/components/StateBit.vue';
import VerdictBadge from '@/components/VerdictBadge.vue';
import { GLOBAL_SCOPE } from '@/features/submissions/list/submission-scope';
import { useScopedSubmissionListQuery } from '@/features/submissions/submissions.queries';
import type { SubmissionFilters } from '@/features/submissions/use-submission-filters';
import { formatNumber } from '@/lib/format';
import { formatAgoCompact } from '@/lib/format-date';
import { useNow } from '@/lib/use-now';
import { submissionVerdictOf } from '@/lib/verdicts';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import { railScore } from './rail-score';
import type { ScoreScale } from './submit-result';

const SHOWN = 3;
const CLOCK_TICK_MS = 60_000;
const NO_SCORE = '–';
/**
 * The signed-in viewer's last three submissions to this problem. Each scores on its own submission's scale (Q-10 A): the
 * contest's points, labelled like the submission page, when it was made in a contest, else the problem's, labelled too.
 * `scale` is the viewer's contest, which alone says what a contest row is out of.
 */
const props = defineProps<{ code: string; scale: ScoreScale }>();
const { t } = useI18n();
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
/** The score's value, and what it is out of with the scale's name: "250", "/ 250 điểm kỳ thi". */
function scoreParts(submission: SubmissionListItem) {
  const { scale, points, max, digits } = railScore(submission, props.scale);
  const format = (value: number) => formatNumber(value, locale.locale, digits, false);
  const maxText = max === null ? '' : format(max);
  const outOf =
    scale === 'site'
      ? t('problem.rail.mine.siteOutOf', { max: maxText })
      : max === null
        ? t('problem.rail.mine.contestUnit')
        : t('submission.contest.outOf', { max: maxText });
  return { value: points === null ? NO_SCORE : format(points), outOf, scale };
}
const rows = computed(() =>
  latest.value.map((submission) => ({ submission, score: scoreParts(submission) })),
);
</script>

<template>
  <Card class="flex flex-col gap-2 p-4" data-testid="rail-my-submissions">
    <div class="flex items-center justify-between gap-2">
      <h2 class="flex items-center gap-2 section-title">
        {{ $t('problem.rail.mine.title') }}
        <StateBit v-if="isJudging" variant="judging" size="tiny" />
      </h2>
      <RouterLink
        :to="{ name: 'submissions', query: { problem: code, user: session.user?.username } }"
        class="inline-flex min-h-8 items-center text-meta font-bold text-accent-text hover:underline pointer-coarse:min-h-11"
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
          v-for="{ submission, score } in rows"
          :key="submission.id"
          class="flex min-h-11 items-center gap-2.5 border-t border-line"
        >
          <RouterLink :to="{ name: 'submission', params: { id: submission.id } }">
            <VerdictBadge :verdict="submissionVerdictOf(submission)" size="sm" />
          </RouterLink>
          <p :data-scale="score.scale" :title="submission.contest?.name" class="min-w-0">
            <span class="font-mono font-bold tabular-nums">{{ score.value }}</span
            >{{ ' ' }}<span class="text-meta whitespace-nowrap text-muted">{{ score.outOf }}</span>
          </p>
          <time :datetime="submission.date" class="ml-auto text-meta text-muted">{{
            formatAgoCompact(submission.date, now, locale.locale)
          }}</time>
        </li>
      </ol>
    </QueryState>
  </Card>
</template>
