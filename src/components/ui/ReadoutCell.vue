<script setup lang="ts">
import type { VerdictTone } from '@/lib/verdicts';
import { VERDICT_TEXT_CLASSES } from '@/lib/verdicts';

/**
 * One reading on a plate (`Readout`): a small capital label, the value, and whatever measures it below (`#below`: a
 * Gauge, TestSquares, a line of meta). `size`: `big` is the plate's one large numeral (countdown, score; 40 px mono),
 * `value` a figure (20 px mono), `word` a verdict in words (22 px display font). `tone` colours the value as a
 * verdict. `unit` (or `#unit`) is the muted suffix: "/100", "s", "MB". `#label` replaces the label's text when it carries a mark
 * (a phase lamp before the word): the lamp belongs in the label, never beside the numerals.
 */
defineOptions({ name: 'UiReadoutCell' });
withDefaults(
  defineProps<{
    label: string;
    size?: 'big' | 'value' | 'word';
    tone?: VerdictTone;
    unit?: string;
  }>(),
  { size: 'value', tone: undefined, unit: undefined },
);

const VALUE = {
  big: 'font-mono text-score leading-none font-semibold tracking-wide tabular-nums',
  value: 'font-mono text-readout leading-none font-semibold tabular-nums',
  word: 'font-display text-readout-word leading-tight font-bold',
};
const UNIT = { big: 'text-readout', value: 'text-small', word: 'text-small' };
</script>

<template>
  <div class="flex min-w-0 flex-col gap-2">
    <span class="eyebrow inline-flex items-center gap-2">
      <slot name="label">{{ label }}</slot>
    </span>
    <span
      class="flex items-baseline gap-1"
      :class="[VALUE[size], tone && VERDICT_TEXT_CLASSES[tone]]"
    >
      <slot />
      <span v-if="unit || $slots.unit" class="font-mono font-medium text-muted" :class="UNIT[size]">
        <slot name="unit">{{ unit }}</slot>
      </span>
    </span>
    <slot name="below" />
  </div>
</template>
