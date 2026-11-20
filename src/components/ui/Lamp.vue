<script setup lang="ts">
import type { VerdictTone } from '@/lib/verdicts';
import { VERDICT_LAMP_CLASSES } from '@/lib/verdicts';

/**
 * A verdict lamp (redesign "Sơn mài"): a round dot in the verdict's colour, the one place a verdict shows as a colour
 * mark. `none` is an unlit ring (not tried, not reached). A `pending` lamp pulses while judging; it is still under
 * reduced motion, in low-power mode and with `still`. Decorative beside its verdict code; alone it needs `label`
 * (read out, shown on hover). `size="event"` is the larger lamp of a timeline event. Inside a `Readout` it takes the
 * plate's colours by itself.
 */
defineOptions({ name: 'UiLamp' });
withDefaults(
  defineProps<{
    tone: VerdictTone | 'none';
    label?: string;
    size?: 'md' | 'event';
    still?: boolean;
  }>(),
  { label: undefined, size: 'md' },
);
</script>

<template>
  <span
    :title="label"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : 'true'"
    class="lamp align-middle"
    :class="[
      tone === 'none' ? 'lamp-off' : VERDICT_LAMP_CLASSES[tone],
      tone === 'pending' && !still && 'lamp-pulse',
      size === 'event' && 'lamp-event',
    ]"
  />
</template>
