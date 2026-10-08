<script setup lang="ts">
import { computed } from 'vue';
import type { RingProgress } from '@/lib/grading';
import { translate } from '@/i18n';
import type { Verdict, VerdictTone } from '@/lib/verdicts';

/** While grading `progress` fills the ring in the positive colour; a final `verdict` fills it all in its own colour. */
const props = defineProps<{
  progress: RingProgress | null;
  verdict: Verdict;
  /** Nothing to measure yet (final-only contest): an empty neutral ring, no points text. */
  isEmpty?: boolean;
}>();
const FULL_TURN_DEGREES = 360;
const PERCENT = 100;
/** Custom properties of the verdict tones (tokens), the same ones the verdict badges use. */
const TONE_COLOURS: Record<VerdictTone, string> = {
  ac: '--qh-verdict-ac',
  wa: '--qh-verdict-wa',
  tle: '--qh-verdict-tle',
  rte: '--qh-verdict-rte',
  ce: '--qh-verdict-ce',
  pending: '--qh-verdict-pending',
};

const fraction = computed(() => (props.isEmpty ? 0 : (props.progress?.fraction ?? 1)));
const filledColour = computed(() => {
  if (props.isEmpty) return '--qh-text-muted';
  return props.progress ? '--qh-positive' : TONE_COLOURS[props.verdict.tone];
});
const ringStyle = computed(() => ({
  background: `conic-gradient(var(${filledColour.value}) ${fraction.value * FULL_TURN_DEGREES}deg, var(--qh-line-strong) 0)`,
}));
const percent = computed(() => Math.round(fraction.value * PERCENT));
const label = computed(() => {
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
      class="flex size-24 items-center justify-center rounded-full bg-surface-solid font-mono text-lg font-semibold tabular-nums"
      :class="{ 'text-muted': isEmpty }"
      >{{ centerText }}</span
    >
  </div>
</template>
