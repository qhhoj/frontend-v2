<script setup lang="ts">
import { toRef } from 'vue';
import AppButton from '@/components/ui/AppButton.vue';
import type { ProblemFilters } from './use-problem-filters';
import { useRandomProblem } from './use-random-problem';

const props = defineProps<{ filters: ProblemFilters }>();
const { open, pending, missing, failed } = useRandomProblem(toRef(props, 'filters'));
</script>

<template>
  <div class="flex items-center">
    <span data-testid="random-status" aria-live="polite" class="mr-2 text-sm text-muted empty:mr-0">
      <template v-if="missing">{{ $t('problems.randomNone') }}</template>
      <template v-else-if="failed">{{ $t('problems.randomFailed') }}</template>
    </span>
    <AppButton tone="primary" size="sm" :loading="pending" @click="open()">
      {{ $t('problems.random') }}
    </AppButton>
  </div>
</template>
