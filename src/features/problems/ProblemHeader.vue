<script setup lang="ts">
import type { ProblemDetail } from '@/api/types/problems';
import GlassCard from '@/components/GlassCard.vue';

/** Code, group and title; the tabs go in the slot. Keep `ProblemHeaderSkeleton.vue` in step. */
defineProps<{ problem: ProblemDetail }>();
</script>

<template>
  <GlassCard data-testid="problem-header" class="rounded-panel px-6 pt-6 sm:px-8 sm:pt-8">
    <p class="font-mono text-sm text-muted">
      {{ problem.code }}<template v-if="problem.group"> · {{ problem.group.fullName }}</template>
    </p>
    <h1 class="mt-1 page-title [overflow-wrap:anywhere] max-sm:min-h-[65px]">
      {{ problem.name }}
    </h1>
    <div class="mt-4 pb-4"><slot /></div>
  </GlassCard>
</template>
