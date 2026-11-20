<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { SubmissionListItem } from '@/api/types/submissions';
import { IN_PROGRESS_STATUSES } from '@/api/types/submissions';
import InlineBit from '@/components/InlineBit.vue';
import Card from '@/components/ui/Card.vue';
import AppButton from '@/components/ui/AppButton.vue';
import StretchedLink from '@/components/ui/StretchedLink.vue';
import QueryState from '@/components/QueryState.vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import StatusStepper from '@/components/ui/StatusStepper.vue';
import VerdictChip from '@/components/ui/VerdictChip.vue';
import { GLOBAL_SCOPE } from '@/features/submissions/list/submission-scope';
import { useScopedSubmissionListQuery } from '@/features/submissions/submissions.queries';
import type { SubmissionFilters } from '@/features/submissions/use-submission-filters';
import { CUE_TEXT } from '@/components/ui/cue-tones';
import type { CueTone } from '@/components/ui/cue-tones';
import { formatPoints, scoreBelowFull } from '@/lib/format';
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
 * The signed-in viewer's last three submissions to this problem, a card of the side panel: per row the verdict (lamp and
 * code), the score and when; the whole row opens the submission. Each scores on its own submission's scale: the contest's
 * points, labelled like the submission page, when it was made in a contest, else the problem's, labelled too. `scale` is
 * the viewer's contest, which alone says what a contest row is out of.
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
/** The cue of a judged score: full at the maximum, zero at nothing, partial between; none while unjudged or when the maximum is unknown. */
function scoreTone(points: number | null, max: number | null): CueTone | null {
  if (points === null) return null;
  if (points <= 0) return 'zero';
  if (max === null) return null;
  return points >= max ? 'full' : 'partial';
}
/** The score's value, and what it is out of with the scale's name: "250", "/ 250 điểm kỳ thi". */
function scoreParts(submission: SubmissionListItem) {
  const { scale, points, max, digits } = railScore(submission, props.scale);
  const format = (value: number) => formatPoints(value, locale.locale, digits);
  const maxText = max === null ? '' : format(max);
  const outOf =
    scale === 'site'
      ? t('problem.rail.mine.siteOutOf', { max: maxText })
      : max === null
        ? t('problem.rail.mine.contestUnit')
        : t('submission.contest.outOf', { max: maxText });
  const value = points === null ? NO_SCORE : format(scoreBelowFull(points, max, digits));
  return { value, outOf, scale, tone: scoreTone(points, max) };
}
const rows = computed(() =>
  latest.value.map((submission) => ({ submission, score: scoreParts(submission) })),
);
</script>

<template>
  <Card padding="md" :title="$t('problem.rail.mine.title')" data-testid="rail-my-submissions">
    <template #actions>
      <AppButton
        tone="link"
        class="text-meta"
        :to="{ name: 'submissions', query: { problem: code, user: session.user?.username } }"
        >{{ $t('common.viewAll') }}</AppButton
      >
    </template>
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton>
        <SkeletonBlock v-for="row in SHOWN" :key="row" class="h-(--qh-row)" />
      </template>
      <p v-if="!latest.length" class="flex items-center gap-2 text-meta text-muted">
        <InlineBit kind="asleep" />{{ $t('problem.noSubmissions') }}
      </p>
      <ol v-else class="-mx-(--qh-pad-surface) -mb-(--qh-pad-surface) flex flex-col">
        <li
          v-for="{ submission, score } in rows"
          :key="submission.id"
          class="box-link flex min-h-(--qh-row) items-center gap-2 border-t border-line px-(--qh-pad-surface) last:rounded-b-card"
        >
          <StretchedLink :to="{ name: 'submission', params: { id: submission.id } }">
            <StatusStepper
              v-if="IN_PROGRESS_STATUSES.includes(submission.status)"
              :status="submission.status"
              compact
            />
            <VerdictChip v-else :verdict="submissionVerdictOf(submission)" />
          </StretchedLink>
          <p :data-scale="score.scale" :title="submission.contest?.name" class="min-w-0 truncate">
            <span
              :class="['font-mono font-bold tabular-nums', score.tone && CUE_TEXT[score.tone]]"
              >{{ score.value }}</span
            >{{ ' ' }}<span class="text-small whitespace-nowrap text-muted">{{ score.outOf }}</span>
          </p>
          <time :datetime="submission.date" class="ml-auto shrink-0 text-small text-muted">{{
            formatAgoCompact(submission.date, now, locale.locale)
          }}</time>
        </li>
      </ol>
    </QueryState>
  </Card>
</template>
