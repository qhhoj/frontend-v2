<script setup lang="ts">
import type { Verdict } from '@/lib/verdicts';
import { VERDICT_TEXT_CLASSES } from '@/lib/verdicts';
import Lamp from './Lamp.vue';

/**
 * The one verdict mark (redesign "Sơn mài"): a lamp and the mono code in the verdict's colour and, with `named`, the
 * verdict's name. No tint and no box: colour sits on the lamp and the code only, and the code carries the meaning, so
 * colour is never the only signal. Without `named` the name is the tooltip and what a screen reader reads, and the
 * mark has one fixed minimum width (fits the longest code, 3 characters), so the titles beside a column of marks line
 * up. A judging verdict's lamp pulses. Inside a `Readout` it takes the plate's colours.
 */
defineProps<{ verdict: Verdict; named?: boolean }>();
</script>

<template>
  <span
    class="inline-flex min-h-(--qh-chip) shrink-0 items-center gap-2 font-mono text-small font-bold tracking-wide whitespace-nowrap"
    :class="[VERDICT_TEXT_CLASSES[verdict.tone], named ? '' : 'min-w-15']"
    :title="named ? undefined : $t(verdict.labelKey)"
  >
    <Lamp :tone="verdict.tone" />
    <span :aria-hidden="named ? undefined : 'true'">{{ verdict.code }}</span>
    <span v-if="named" class="font-body font-medium tracking-normal">{{
      $t(verdict.labelKey)
    }}</span>
    <span v-else class="sr-only">{{ $t(verdict.labelKey) }}</span>
  </span>
</template>
