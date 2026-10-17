<script setup lang="ts">
import { toRef } from 'vue';
import { Zap } from 'lucide-vue-next';
import AppButton from '@/components/ui/AppButton.vue';
import type { ProblemFilters } from './use-problem-filters';
import { useRandomProblem } from './use-random-problem';

/** A rare pick: a ghost button at the end of the toolbar, so the search and the list keep the eye (one solid button per screen). */
const props = defineProps<{ filters: ProblemFilters }>();
const { open, pending, missing, failed } = useRandomProblem(toRef(props, 'filters'));
</script>

<template>
  <div class="flex items-center">
    <span data-testid="random-status" aria-live="polite" class="mr-2 text-sm text-muted empty:mr-0">
      <template v-if="missing">{{ $t('problems.randomNone') }}</template>
      <template v-else-if="failed">{{ $t('problems.randomFailed') }}</template>
    </span>
    <AppButton tone="ghost" size="sm" :loading="pending" @click="open()">
      <template #icon><Zap class="size-4" aria-hidden="true" /></template>
      {{ $t('problems.random') }}
    </AppButton>
  </div>
</template>
