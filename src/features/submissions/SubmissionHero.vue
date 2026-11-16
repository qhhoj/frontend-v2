<script setup lang="ts">
import { Send } from 'lucide-vue-next';
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import { FINISHED_STATUSES, IN_PROGRESS_STATUSES } from '@/api/types/submissions';
import type { SubmissionDetail } from '@/api/types/submissions';
import AppButton from '@/components/ui/AppButton.vue';
import BitLoop from '@/components/BitLoop.vue';
import BitMascot from '@/components/BitMascot.vue';
import LanguageLabel from '@/components/language/LanguageLabel.vue';
import Card from '@/components/ui/Card.vue';
import UserLink from '@/components/UserLink.vue';
import type { SubmissionInContest } from '@/features/contests/submission/submission-contest';
import { formatClock, formatDate, formatRelative } from '@/lib/format-date';
import { useNow } from '@/lib/use-now';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { translate } from '@/i18n';
import { NO_VALUE, formatPoints, scoreBelowFull } from '@/lib/format';
import { CUE_CHIP } from '@/components/ui/cue-tones';
import { scoreTone } from './submission-row';
import { provisionalPoints, ringProgress } from '@/lib/grading';
import { PARTIAL_CODE, VERDICT_TONE_VARS, verdictOfCode, type Verdict } from '@/lib/verdicts';
import { BIT_MOODS } from '@/mascot/bit-moods';
import { verdictBitMood } from '@/mascot/verdict-bit';
import { useLocaleStore } from '@/stores/locale.store';
import ShareButton from '@/features/shares/ShareButton.vue';
import TestStrip from './list/TestStrip.vue';
import DeletedProblemChip from './DeletedProblemChip.vue';
import { heroParts } from './hero-line';
import VerdictRing from './VerdictRing.vue';

/** Two decimals like the problem header; no digit grouping, scores are read as plain numbers. */
const SCORE_FRACTION_DIGITS = 2;

/** "3 minutes ago" only needs a fresh clock once a minute. */
const CLOCK_REFRESH_MS = 60_000;

/**
 * The verdict strip: the ring, the verdict, the score and the Bit mascot, then one meta line with the problem, author,
 * date, passed count, time, memory, language and judge (the old facts card), and what to do now: "Nộp lại" for the
 * author, "Về đề bài" for everyone (the primary action when there is nothing to resubmit). The default slot is the
 * footer of the same card (staff actions). Keep `SubmissionHeroSkeleton.vue` in step.
 */
const props = defineProps<{
  submission: SubmissionDetail;
  verdict: Verdict;
  /** The problem's name when it is readable; the row's own name is the fallback. */
  problemName: string | null;
  /** In the viewer's contest: the contest link, the contest letter, and the minute of the run. */
  inContest?: SubmissionInContest | null;
  /** The problem's points when it is readable. */
  problemPoints: number | null;
  /** The problem is still loading: only the score waits for it. */
  isProblemLoading: boolean;
  /** The stream is open and the grading is going on. */
  isLive: boolean;
  /** Only the author resubmits; never to a deleted problem. */
  canResubmit: boolean;
  /** A judged contest submission: the contest points lead, the problem's score moves to the line below. */
  contestScore?: { points: string; max: string } | null;
  /** The submission's id when the viewer may share it (`viewer.canShare`): adds "Chia sẻ" to the actions. */
  shareId?: string | null;
  /** Where "Bài tiếp theo" leads: set only for the author's own accepted submission outside a contest. */
  nextTo?: RouteLocationRaw | null;
}>();
const locale = useLocaleStore();
const now = useNow(CLOCK_REFRESH_MS);
const format = (points: number) => formatPoints(points, locale.locale, SCORE_FRACTION_DIGITS);

/** A row still in progress has no final points: the share of the case points stands in for them. */
const isProvisional = computed(() => IN_PROGRESS_STATUSES.includes(props.submission.status));
const score = computed(() => {
  if (isProvisional.value)
    return props.problemPoints === null
      ? NO_VALUE
      : format(provisionalPoints(props.problemPoints, props.submission));
  return props.submission.points === null
    ? NO_VALUE
    : format(scoreBelowFull(props.submission.points, props.problemPoints, SCORE_FRACTION_DIGITS));
});
const maxScore = computed(() =>
  !isProvisional.value && props.submission.points !== null && props.problemPoints !== null
    ? format(props.problemPoints)
    : null,
);
/** A contest submission opens the problem inside its contest (`?contest=`); a practice one opens the plain problem. */
const contestQuery = computed(() =>
  props.submission.contest ? { contest: props.submission.contest.key } : {},
);
const isFinished = computed(() => FINISHED_STATUSES.includes(props.submission.status));
/** A partially correct score fills the ring by its share of the problem's points. */
const partialShare = computed(() => {
  const max = props.submission.problem?.points;
  if (props.verdict.code !== PARTIAL_CODE || !max || props.submission.points === null) return null;
  return props.submission.points / max;
});
/** Only a finished submission has a final verdict worth a crown or a sweat drop; until then the hourglass Bit judges. */
const bit = computed(() => {
  const mood = isFinished.value ? verdictBitMood(props.verdict) : null;
  return mood ? BIT_MOODS[mood] : null;
});
const contestOutOf = computed(() =>
  props.contestScore ? translate('submission.contest.outOf', { max: props.contestScore.max }) : '',
);
/**
 * The score card's headline and its muted "out of": the contest's points in a contest, else the problem's. The "out of"
 * is one unbreakable piece: it stays on the headline's line while there is room and wraps whole when there is not.
 */
const scoreText = computed(() =>
  props.contestScore
    ? { value: props.contestScore.points, outOf: contestOutOf.value }
    : { value: score.value, outOf: maxScore.value ? `/ ${maxScore.value}` : '' },
);
/** The score's pill once judged: the share of the problem's points (a contest score is the same share) as a tinted pill. */
const scoreCue = computed(() => {
  const tone = isFinished.value ? scoreTone(props.submission.points, props.problemPoints) : null;
  return tone ? `w-fit rounded-pill border px-3 py-1.5 ${CUE_CHIP[tone]}` : '';
});
/** In a contest the problem's own score is the line's first part. */
const problemScore = computed(() =>
  props.contestScore && maxScore.value
    ? translate('submission.contest.problemScore', { score: score.value, max: maxScore.value })
    : null,
);
const parts = computed(() => [
  ...(problemScore.value ? [{ text: problemScore.value }] : []),
  ...heroParts(props.submission),
]);
/** The first failing test gets its own line under the score; the rest (tests passed, time, memory) stays in the small line. */
const failingTest = computed(() => {
  const failed = parts.value.find((part) => 'key' in part && part.key === 'failed');
  if (!failed || !('values' in failed) || !('status' in failed.values)) return null;
  const verdict = translate(verdictOfCode(failed.values.status).labelKey);
  return translate('submission.overview.failed', {
    number: failed.values.number,
    verdict: verdict.toLocaleLowerCase(locale.locale),
  });
});
const line = computed(() =>
  parts.value
    .map((part) => {
      if ('text' in part) return part.text;
      if (part.key === 'passed') return translate('submission.overview.allPassed', part.values);
      return null;
    })
    .filter((text) => text !== null)
    .join(' · '),
);
/** The verdict name takes its tone's colour; AC pops once and WA nudges once (see the style block). */
const nameColour = computed(() => `var(${VERDICT_TONE_VARS[props.verdict.tone]})`);
const motion = computed(() => {
  if (!isFinished.value) return null;
  if (props.verdict.code === 'AC') return 'verdict-pop';
  return props.verdict.code === 'WA' ? 'verdict-nudge' : null;
});
/** Failed: fix first. Accepted by the author: the next problem is the primary and resubmitting steps back. */
const resubmitIsPrimary = computed(() => props.canResubmit && !props.nextTo);
const resubmitLabel = computed(() =>
  props.verdict.code === 'AC' ? 'submission.actions.resubmit' : 'submission.actions.resubmitFix',
);
const problem = computed(() => {
  const row = props.submission.problem;
  return row && !row.isDeleted ? row.code : null;
});
</script>

<template>
  <Card
    as="div"
    data-testid="submission-hero"
    class="@container min-w-0 overflow-hidden rounded-card"
  >
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
      <div :class="motion" class="shrink-0">
        <VerdictRing
          size="sm"
          :progress="isFinished ? null : ringProgress(submission)"
          :verdict="verdict"
          :share="partialShare"
          :is-empty="submission.status === 'PD'"
        />
      </div>
      <div class="min-w-0 flex-1 @xl:flex-none">
        <p
          v-if="isLive"
          data-testid="grading-line"
          class="flex items-center gap-2 text-title leading-6 font-semibold"
          :style="{ color: nameColour }"
        >
          <span
            aria-hidden="true"
            class="size-2.5 rounded-full bg-cue-live motion-safe:animate-pulse"
          />
          {{ $t(verdict.labelKey) }}
        </p>
        <p
          v-else
          data-testid="verdict-name"
          :class="motion"
          class="text-title leading-6 font-semibold"
          :style="{ color: nameColour }"
        >
          {{ $t(verdict.labelKey) }}
        </p>
        <p
          data-testid="score"
          class="font-mono text-stat leading-none font-semibold tabular-nums"
          :class="scoreCue"
        >
          <span class="text-stat">
            <SkeletonBlock v-if="isProblemLoading" text class="w-24" />
            <template v-else>{{ scoreText.value }}</template>
          </span>
          <template v-if="!isProblemLoading && scoreText.outOf"
            >{{ ' '
            }}<span class="text-section whitespace-nowrap text-muted">{{
              scoreText.outOf
            }}</span></template
          >
        </p>
      </div>
      <div class="order-1 min-w-0 basis-full @xl:order-none @xl:flex-1 @xl:basis-60">
        <p v-if="failingTest" data-testid="failing-test" class="text-meta font-semibold">
          {{ failingTest }}
        </p>
        <p
          data-testid="hero-line"
          class="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-meta text-muted"
        >
          <RouterLink
            v-if="inContest"
            :to="{ name: 'contest', params: { key: inContest.contest.key } }"
            class="font-semibold text-accent-text hover:underline"
            >{{ inContest.contest.name }}</RouterLink
          >
          <span v-if="submission.problem?.isDeleted" class="font-semibold text-content"
            >{{ submission.problem.name }} <DeletedProblemChip
          /></span>
          <RouterLink
            v-else-if="submission.problem"
            :to="{
              name: 'problem',
              params: { code: submission.problem.code },
              query: contestQuery,
            }"
            class="font-semibold text-content hover:underline"
            ><template v-if="inContest">{{ inContest.problem.label }}. </template
            >{{ problemName ?? submission.problem.name }}</RouterLink
          >
          <UserLink
            v-if="submission.user"
            :username="submission.user.username"
            :rating="submission.user.rating"
            size="sm"
          />
          <time
            :datetime="submission.date"
            :title="formatDate(submission.date, 'datetime', locale.locale)"
            >{{
              inContest?.minute != null
                ? $t('submission.contest.minute', {
                    time: formatClock(submission.date),
                    minute: inContest.minute,
                  })
                : formatRelative(submission.date, now, locale.locale)
            }}</time
          >
          <span v-if="line">{{ line }}</span>
          <LanguageLabel v-if="submission.language" :language="submission.language" />
          <span v-if="submission.judgedOn" class="font-mono">{{ submission.judgedOn }}</span>
          <span v-if="isProvisional" data-testid="provisional">{{
            $t('submission.provisional')
          }}</span>
          <span v-if="submission.isPretested">{{ $t('submission.pretest') }}</span>
        </p>
      </div>
      <BitLoop
        v-if="!isFinished"
        data-testid="judging-bit"
        kind="judging"
        class="ml-auto [--bit-px:3px]"
      />
      <BitMascot
        v-else-if="bit"
        :look="bit.look"
        :label="$t(bit.labelKey)"
        :closed-eyes="bit.eyesShut"
        class="ml-auto [--bit-px:3px]"
      />
      <div v-if="submission.testSummary" class="order-2 w-full @xl:order-none">
        <TestStrip :summary="submission.testSummary" :is-grading="!isFinished" />
      </div>
      <div
        v-if="problem || shareId"
        class="order-3 flex w-full flex-wrap gap-2 @xl:order-none @xl:w-auto"
      >
        <AppButton v-if="nextTo" tone="primary" :to="nextTo">
          {{ $t('submission.actions.next') }}
        </AppButton>
        <AppButton
          v-if="canResubmit"
          :tone="resubmitIsPrimary ? 'primary' : 'secondary'"
          :to="{
            name: 'problem',
            params: { code: problem },
            query: { ...contestQuery, resubmit: submission.id },
          }"
        >
          <template #icon><Send aria-hidden="true" class="size-4" /></template>
          {{ $t(resubmitLabel) }}
        </AppButton>
        <AppButton
          v-if="problem"
          :tone="canResubmit || nextTo ? 'secondary' : 'primary'"
          :to="{ name: 'problem', params: { code: problem }, query: contestQuery }"
        >
          {{ $t('submission.actions.problem') }}
        </AppButton>
        <ShareButton v-if="shareId" :submission-id="shareId" />
      </div>
    </div>
    <slot />
  </Card>
</template>

<style scoped>
/* AC: one pop (1 to 1.12 and back); WA: one 3 px nudge. Transform only; reduced motion shows none. */
@keyframes verdict-pop {
  50% {
    transform: scale(1.12);
  }
}
@keyframes verdict-nudge {
  50% {
    transform: translateX(-3px);
  }
}
@media (prefers-reduced-motion: no-preference) {
  .verdict-pop {
    animation: verdict-pop 320ms var(--qh-ease-spring);
  }
  .verdict-nudge {
    animation: verdict-nudge var(--qh-duration) var(--qh-ease);
  }
}
</style>
