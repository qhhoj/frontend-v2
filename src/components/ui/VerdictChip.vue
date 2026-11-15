<script setup lang="ts">
import { Check, CircleDashed, Clock, CodeXml, Hourglass, TriangleAlert, X } from 'lucide-vue-next';
import type { Component } from 'vue';
import type { Verdict, VerdictTone } from '@/lib/verdicts';
import { VERDICT_TONE_CLASSES } from '@/lib/verdicts';

/**
 * The one verdict chip (Workbench, directions.md §2): a Lucide glyph, the mono code and, with `named`, the verdict's name, on
 * its lane tint. Glyph and code carry the meaning, so colour is never the only signal. Without `named` the name is the tooltip
 * and what a screen reader reads.
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
    class="inline-flex h-5 shrink-0 items-center gap-1 rounded-cell px-1.5 text-tiny leading-4 font-semibold whitespace-nowrap"
    :class="VERDICT_TONE_CLASSES[verdict.tone]"
    :title="named ? undefined : $t(verdict.labelKey)"
  >
    <component
      :is="GLYPHS[verdict.tone]"
      aria-hidden="true"
      class="size-3 shrink-0"
      :stroke-width="2.5"
    />
    <span class="font-mono" :aria-hidden="named ? undefined : 'true'">{{ verdict.code }}</span>
    <span v-if="named" class="ml-0.5 font-medium">{{ $t(verdict.labelKey) }}</span>
    <span v-else class="sr-only">{{ $t(verdict.labelKey) }}</span>
  </span>
</template>
