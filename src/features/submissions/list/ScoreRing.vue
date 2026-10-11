<script setup lang="ts">
import { computed } from 'vue';
import type { SubmissionListItem } from '@/api/types/submissions';
import { translate } from '@/i18n';
import { ringFraction } from '@/lib/grading';
import { VERDICT_TONE_VARS, verdictOf } from '@/lib/verdicts';
import { isFinished } from '../submission-row';

/**
 * A card's score: the share of the problem's points as a ring in the verdict's colour, the percent in the middle. A row still
 * being graded fills with the points judged so far; one with no score (CE, IE, queued) shows its code on an empty ring.
 */
const props = defineProps<{ row: SubmissionListItem }>();
const PERCENT = 100;
const FULL_TURN_DEGREES = 360;
const verdict = computed(() => verdictOf(props.row));
const isGrading = computed(() => props.row.status === 'G');
const fraction = computed(() => {
  if (isGrading.value) return ringFraction(props.row);
  const max = props.row.problem?.points ?? 0;
  if (!isFinished(props.row) || props.row.points === null || max <= 0) return null;
  return Math.min(1, Math.max(0, props.row.points / max));
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
    class="flex size-14 shrink-0 items-center justify-center rounded-full"
  >
    <span
      aria-hidden="true"
      class="flex size-11 items-center justify-center rounded-full bg-surface-solid font-mono text-xs font-bold tabular-nums"
      :style="{ color: `var(${colour})` }"
      >{{ fraction === null ? verdict.code : `${percent}%` }}</span
    >
  </div>
</template>
