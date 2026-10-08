<script setup lang="ts">
import type { Verdict } from '@/lib/verdicts';
import { VERDICT_TONE_CLASSES } from '@/lib/verdicts';

withDefaults(defineProps<{ verdict: Verdict; size?: 'md' | 'sm' }>(), { size: 'md' });
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold"
    :class="[VERDICT_TONE_CLASSES[verdict.tone], size === 'md' ? 'size-10' : 'h-7 min-w-7 px-2']"
    :title="$t(verdict.labelKey)"
  >
    <span aria-hidden="true">{{ verdict.code }}</span>
    <span class="sr-only">{{ $t(verdict.labelKey) }}</span>
  </span>
</template>
