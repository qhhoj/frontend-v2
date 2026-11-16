<script setup lang="ts">
import { Check, CircleDashed, Clock, CodeXml, Hourglass, TriangleAlert, X } from 'lucide-vue-next';
import type { Component } from 'vue';
import type { Verdict, VerdictTone } from '@/lib/verdicts';
import { VERDICT_TONE_CLASSES } from '@/lib/verdicts';

/**
 * The one verdict chip (Workbench, directions.md §2): a Lucide glyph, the mono code and, with `named`, the verdict's name, on
 * its lane tint, as a 24 px pill (Kit 2). Glyph and code carry the meaning, so colour is never the only signal. Without `named` the name is the tooltip
 * and what a screen reader reads. Without `named` the chip has one fixed minimum width (fits the longest code, 3 characters),
 * so the titles beside a column of chips line up.
 */
defineProps<{ verdict: Verdict; named?: boolean }>();

const GLYPHS: Record<VerdictTone, Component> = {
  ac: Check,
  pc: CircleDashed,
  wa: X,
  tle: Clock,
  rte: TriangleAlert,
  ce: CodeXml,
  pending: Hourglass,
};
</script>

<template>
  <span
    class="inline-flex h-(--qh-chip) shrink-0 items-center gap-1 rounded-pill px-(--qh-chip-px) text-small font-semibold whitespace-nowrap"
    :class="[VERDICT_TONE_CLASSES[verdict.tone], named ? '' : 'min-w-15 justify-center']"
    :title="named ? undefined : $t(verdict.labelKey)"
  >
    <component
      :is="GLYPHS[verdict.tone]"
      aria-hidden="true"
      class="size-3.5 shrink-0"
      :stroke-width="2.5"
    />
    <span class="font-mono" :aria-hidden="named ? undefined : 'true'">{{ verdict.code }}</span>
    <span v-if="named" class="ml-0.5 font-medium">{{ $t(verdict.labelKey) }}</span>
    <span v-else class="sr-only">{{ $t(verdict.labelKey) }}</span>
  </span>
</template>
