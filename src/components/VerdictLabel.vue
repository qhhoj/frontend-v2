<script setup lang="ts">
import type { Verdict } from '@/lib/verdicts';
import { VERDICT_TONE_CLASSES } from '@/lib/verdicts';

defineProps<{ verdict: Verdict }>();
</script>

<template>
  <span
    class="inline-flex h-7 items-center gap-1.5 rounded-pill px-2.5 font-mono text-xs font-semibold"
    :class="VERDICT_TONE_CLASSES[verdict.tone]"
  >
    {{ verdict.code }} · {{ $t(verdict.labelKey) }}
  </span>
</template>
