<script setup lang="ts">
import type { Verdict } from '@/lib/verdicts';
import { VERDICT_TONE_CLASSES } from '@/lib/verdicts';

/** The verdict chip; `short` shows only the code, the full name moves to the tooltip. */
defineProps<{ verdict: Verdict; short?: boolean }>();
</script>

<template>
  <span
    class="inline-flex h-6 items-center gap-1.5 rounded-pill px-2.5 font-mono text-xs font-semibold"
    :class="VERDICT_TONE_CLASSES[verdict.tone]"
    :title="short ? $t(verdict.labelKey) : undefined"
  >
    <template v-if="short">{{ verdict.code }}</template>
    <template v-else>{{ verdict.code }} · {{ $t(verdict.labelKey) }}</template>
  </span>
</template>
