<script setup lang="ts">
import { toRef } from 'vue';
import type { ProblemFilters } from './use-problem-filters';
import { useRandomProblem } from './use-random-problem';

const props = defineProps<{ filters: ProblemFilters }>();
const { open, pending, missing, failed } = useRandomProblem(toRef(props, 'filters'));
</script>

<template>
  <div class="flex items-center gap-2">
    <span data-testid="random-status" aria-live="polite" class="text-sm text-muted">
      <template v-if="missing">{{ $t('problems.randomNone') }}</template>
      <template v-else-if="failed">{{ $t('problems.randomFailed') }}</template>
    </span>
    <button
      type="button"
      :disabled="pending"
      class="h-10 rounded-row bg-accent px-4 text-sm font-semibold text-on-accent hover:bg-accent-2 disabled:opacity-60"
      @click="open()"
    >
      {{ $t('problems.random') }}
    </button>
  </div>
</template>
