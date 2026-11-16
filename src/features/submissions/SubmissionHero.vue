<script setup lang="ts">
import { computed } from 'vue';
import { FINISHED_STATUSES, IN_PROGRESS_STATUSES } from '@/api/types/submissions';
import type { SubmissionDetail } from '@/api/types/submissions';
import SkeletonBlock from '@/components/SkeletonBlock.vue';
import { CUE_ROW } from '@/components/ui/cue-tones';
import { translate } from '@/i18n';
import { NO_VALUE, formatPoints, scoreBelowFull } from '@/lib/format';
import { provisionalPoints } from '@/lib/grading';
import { VERDICT_TONE_VARS, verdictOfCode } from '@/lib/verdicts';
import type { Verdict } from '@/lib/verdicts';
import { useLocaleStore } from '@/stores/locale.store';
import TestStrip from './list/TestStrip.vue';
import { heroParts } from './hero-line';
import { scoreTone } from './submission-row';

/** Two decimals like the problem header; no digit grouping, scores are read as plain numbers. */
const SCORE_FRACTION_DIGITS = 2;

/**
 * The verdict strip: one band tinted by the result (full green, partial amber, zero red; none while grading) with the
 * verdict word, the score over its maximum, and one line "5/5 test · time · memory". Who, when, language and judge are the
 * page header's meta line; the buttons are its actions. The default slot is the strip's footer (staff actions).
 * Keep `SubmissionHeroSkeleton.vue` in step.
 */
const props = defineProps<{
  submission: SubmissionDetail;
  verdict: Verdict;
  /** The problem's points when it is readable. */
  problemPoints: number | null;
  /** The problem is still loading: only the score waits for it. */
  isProblemLoading: boolean;
  /** The stream is open and the grading is going on. */
  isLive: boolean;
  /** A judged contest submission: the contest points lead, the problem's score moves into the line. */
  contestScore?: { points: string; max: string } | null;
}>();
const locale = useLocaleStore();
const format = (points: number) => formatPoints(points, locale.locale, SCORE_FRACTION_DIGITS);

/** A row still in progress has no final points: the share of the case points stands in for them. */
const isProvisional = computed(() => IN_PROGRESS_STATUSES.includes(props.submission.status));
const isFinished = computed(() => FINISHED_STATUSES.includes(props.submission.status));
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
/**
 * The score's headline and its muted "out of": the contest's points in a contest, else the problem's. The "out of"
 * is one unbreakable piece: it stays on the headline's line while there is room and wraps whole when there is not.
 */
const scoreText = computed(() =>
  props.contestScore
    ? {
        value: props.contestScore.points,
        outOf: translate('submission.contest.outOf', { max: props.contestScore.max }),
      }
    : { value: score.value, outOf: maxScore.value ? `/ ${maxScore.value}` : '' },
);
/** The strip's tint once judged: the share of the problem's points; an accepted verdict with no known maximum is full. */
const stripTone = computed(() => {
  if (!isFinished.value) return null;
  const tone = scoreTone(props.submission.points, props.problemPoints);
  return tone ?? (props.verdict.code === 'AC' ? 'full' : null);
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
/** The first failing test gets its own words in the line; the rest (tests passed, time, memory) follows. */
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
/** The verdict name takes its tone's colour. */
const nameColour = computed(() => `var(${VERDICT_TONE_VARS[props.verdict.tone]})`);
</script>

<template>
  <div
    data-testid="submission-hero"
    :class="['min-w-0 rounded-card', stripTone ? CUE_ROW[stripTone] : 'bg-surface-strong']"
  >
    <div class="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-4 py-3 sm:px-6">
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
        class="text-title leading-6 font-semibold"
        :style="{ color: nameColour }"
      >
        {{ $t(verdict.labelKey) }}
      </p>
      <p data-testid="score" class="font-mono text-stat leading-none font-semibold tabular-nums">
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
      <p
        data-testid="hero-line"
        class="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5 text-meta text-muted"
      >
        <span v-if="failingTest" data-testid="failing-test" class="font-semibold text-content">{{
          failingTest
        }}</span>
        <span v-if="line">{{ line }}</span>
        <span v-if="isProvisional" data-testid="provisional">{{
          $t('submission.provisional')
        }}</span>
        <span v-if="submission.isPretested">{{ $t('submission.pretest') }}</span>
      </p>
      <div v-if="submission.testSummary && !isFinished" class="w-full">
        <TestStrip :summary="submission.testSummary" :is-grading="!isFinished" />
      </div>
    </div>
    <slot />
  </div>
</template>
