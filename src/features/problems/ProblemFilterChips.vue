<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import Chip from '@/components/ui/Chip.vue';
import type { FilterChip } from './problem-filter-chips';
import type { ProblemFilters } from './use-problem-filters';

defineProps<{ chips: FilterChip[] }>();
const emit = defineEmits<{ remove: [patch: Partial<ProblemFilters>]; clearAll: [] }>();
</script>

<template>
  <ul v-if="chips.length" class="flex flex-wrap items-center gap-2 text-meta">
    <li class="text-muted">{{ $t('problems.filtering') }}</li>
    <li v-for="chip in chips" :key="chip.key" class="min-w-0">
      <Chip
        size="md"
        removable
        :remove-label="$t('problems.removeFilter', { name: chip.label })"
        @remove="emit('remove', chip.clear)"
        >{{ chip.label }}</Chip
      >
    </li>
    <li>
      <AppButton tone="link" @click="emit('clearAll')">{{ $t('problems.clearAll') }}</AppButton>
    </li>
  </ul>
</template>
