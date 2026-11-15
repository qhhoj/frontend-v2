<script setup lang="ts">
import { toRef } from 'vue';
import { Shuffle } from 'lucide-vue-next';
import AppButton from '@/components/ui/AppButton.vue';
import IconButton from '@/components/ui/IconButton.vue';
import type { ProblemFilters } from './use-problem-filters';
import { useRandomProblem } from './use-random-problem';

/** A rare pick: an icon button at the end of the toolbar (its name is the tooltip), so the search and the list keep the eye. */
const props = defineProps<{
  filters: ProblemFilters;
  /** With its name beside the icon (inside the phone's filter panel, where no tooltip shows). */
  labelled?: boolean;
}>();
const { open, pending, missing, failed } = useRandomProblem(toRef(props, 'filters'));
</script>

<template>
  <div class="flex items-center">
    <span data-testid="random-status" aria-live="polite" class="mr-2 text-sm text-muted empty:mr-0">
      <template v-if="missing">{{ $t('problems.randomNone') }}</template>
      <template v-else-if="failed">{{ $t('problems.randomFailed') }}</template>
    </span>
    <AppButton v-if="labelled" tone="ghost" :loading="pending" @click="open()">
      <template #icon><Shuffle class="size-4" aria-hidden="true" /></template>
      {{ $t('problems.random') }}
    </AppButton>
    <IconButton v-else :label="$t('problems.random')" :loading="pending" @click="open()">
      <Shuffle aria-hidden="true" />
    </IconButton>
  </div>
</template>
