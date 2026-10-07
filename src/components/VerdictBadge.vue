<script setup lang="ts">
import type { Verdict, VerdictTone } from '@/lib/verdicts';

withDefaults(defineProps<{ verdict: Verdict; size?: 'md' | 'sm' }>(), { size: 'md' });

const TONE_CLASSES: Record<VerdictTone, string> = {
  ac: 'bg-verdict-ac-bg text-verdict-ac',
  wa: 'bg-verdict-wa-bg text-verdict-wa',
  tle: 'bg-verdict-tle-bg text-verdict-tle',
  rte: 'bg-verdict-rte-bg text-verdict-rte',
  ce: 'bg-verdict-ce-bg text-verdict-ce',
  pending: 'bg-verdict-pending-bg text-verdict-pending',
};
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold"
    :class="[TONE_CLASSES[verdict.tone], size === 'md' ? 'size-10' : 'h-7 min-w-7 px-2']"
    :title="$t(verdict.labelKey)"
  >
    <span aria-hidden="true">{{ verdict.code }}</span>
    <span class="sr-only">{{ $t(verdict.labelKey) }}</span>
  </span>
</template>
