<script setup lang="ts">
import { computed } from 'vue';
import type { RingProgress } from '@/lib/grading';
import { translate } from '@/i18n';
import { VERDICT_TONE_VARS } from '@/lib/verdicts';
import type { Verdict } from '@/lib/verdicts';

/**
 * While grading `progress` fills the ring in the positive colour; a final `verdict` fills it in its own colour, all of it, or
 * up to `share` (a partially correct score's share of the problem's points, shown as a percent in the middle).
 */
const props = defineProps<{
  progress: RingProgress | null;
  verdict: Verdict;
  share?: number | null;
  /** Nothing to measure yet (final-only contest): an empty neutral ring, no points text. */
  isEmpty?: boolean;
}>();
const FULL_TURN_DEGREES = 360;
const PERCENT = 100;

const finalShare = computed(() => (props.progress ? null : (props.share ?? null)));
const fraction = computed(() => {
  if (props.isEmpty) return 0;
  return props.progress?.fraction ?? finalShare.value ?? 1;
});
const filledColour = computed(() => {
  if (props.isEmpty) return '--qh-text-muted';
  return props.progress ? '--qh-positive' : VERDICT_TONE_VARS[props.verdict.tone];
});
const ringStyle = computed(() => ({
  background: `conic-gradient(var(${filledColour.value}) ${fraction.value * FULL_TURN_DEGREES}deg, var(--qh-line-strong) 0)`,
}));
const percent = computed(() => Math.round(fraction.value * PERCENT));
const label = computed(() => {
  if (!props.isEmpty && finalShare.value !== null)
    return `${translate(props.verdict.labelKey)}, ${translate('submission.ringLabelPoints', { percent: percent.value })}`;
  if (props.isEmpty || !props.progress) return translate(props.verdict.labelKey);
  return props.progress.mode === 'cases'
    ? translate('submission.ringLabel', {
        graded: props.progress.graded,
        total: props.progress.total,
      })
    : translate('submission.ringLabelPoints', { percent: percent.value });
});
const centerText = computed(() => {
  if (props.isEmpty) return props.verdict.code;
  if (finalShare.value !== null) return `${percent.value}%`;
  if (!props.progress) return props.verdict.code;
  return props.progress.mode === 'cases'
    ? `${props.progress.graded}/${props.progress.total}`
    : `${percent.value}%`;
});
</script>

<template>
  <div
    role="img"
    :aria-label="label"
    :style="ringStyle"
    class="flex size-32 shrink-0 items-center justify-center rounded-full"
  >
    <span
      aria-hidden="true"
      class="flex size-24 items-center justify-center rounded-full bg-surface-solid font-mono text-title font-semibold tabular-nums"
      :class="{ 'text-muted': isEmpty }"
      >{{ centerText }}</span
    >
  </div>
</template>
