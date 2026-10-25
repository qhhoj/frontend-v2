<script setup lang="ts">
import { computed } from 'vue';
import type { SubmissionListItem } from '@/api/types/submissions';
import { translate } from '@/i18n';
import { ringFraction } from '@/lib/grading';
import { VERDICT_TONE_VARS, submissionVerdictOf } from '@/lib/verdicts';
import { isFinished } from '../submission-row';

/**
 * A card's score (40 px in a phone's ledger row, 56 px from md): the share of the problem's points as a ring in the verdict's colour, the percent in the middle. A row still
 * being graded fills with the points judged so far; one with no score (CE, IE, queued) shows its code on an empty ring.
 * `contestMax` (a contest's list) scores the row by its contest points over the contest problem's, as the ranking does.
 */
const props = defineProps<{ row: SubmissionListItem; contestMax?: number }>();
const PERCENT = 100;
const FULL_TURN_DEGREES = 360;
const verdict = computed(() => submissionVerdictOf(props.row));
const isGrading = computed(() => props.row.status === 'G');
/** The contest's points when the list is a contest's and the row still holds them, else the problem's. */
const score = computed(() => {
  const contestPoints = props.row.contest?.points ?? null;
  if (props.contestMax !== undefined && contestPoints !== null)
    return { points: contestPoints, max: props.contestMax };
  return { points: props.row.points, max: props.row.problem?.points ?? 0 };
});
const fraction = computed(() => {
  if (isGrading.value) return ringFraction(props.row);
  const { points, max } = score.value;
  if (!isFinished(props.row) || points === null || max <= 0) return null;
  return Math.min(1, Math.max(0, points / max));
});
const percent = computed(() => Math.round((fraction.value ?? 0) * PERCENT));
const colour = computed(() =>
  isGrading.value ? '--qh-positive' : VERDICT_TONE_VARS[verdict.value.tone],
);
const ringStyle = computed(() => ({
  background: `conic-gradient(var(${colour.value}) ${(fraction.value ?? 0) * FULL_TURN_DEGREES}deg, var(--qh-line-strong) 0)`,
}));
const label = computed(() => {
  if (fraction.value === null) return translate(verdict.value.labelKey);
  return translate(isGrading.value ? 'submissions.ring.grading' : 'submissions.ring.label', {
    percent: percent.value,
  });
});
</script>

<template>
  <div
    role="img"
    :aria-label="label"
    :style="ringStyle"
    class="flex size-10 shrink-0 items-center justify-center rounded-full md:size-14"
  >
    <span
      aria-hidden="true"
      class="flex size-8 items-center justify-center rounded-full bg-surface-solid font-mono text-tiny font-bold tabular-nums md:size-11 md:text-caption md:leading-4"
      :style="{ color: `var(${colour})` }"
      >{{ fraction === null ? verdict.code : `${percent}%` }}</span
    >
  </div>
</template>
