<script setup lang="ts">
import { X } from 'lucide-vue-next';
import type { FilterChip } from './problem-filter-chips';
import type { ProblemFilters } from './use-problem-filters';

defineProps<{ chips: FilterChip[] }>();
const emit = defineEmits<{ remove: [patch: Partial<ProblemFilters>]; clearAll: [] }>();
</script>

<template>
  <ul v-if="chips.length" class="flex flex-wrap items-center gap-2 text-meta">
    <li class="text-muted">{{ $t('problems.filtering') }}</li>
    <li v-for="chip in chips" :key="chip.key">
      <button
        type="button"
        :aria-label="$t('problems.removeFilter', { name: chip.label })"
        class="inline-flex min-h-8 items-center gap-1.5 rounded-pill bg-surface-strong py-1 pr-2 pl-3 hover:bg-surface-hover"
        @click="emit('remove', chip.clear)"
      >
        {{ chip.label }}<X class="size-3.5" aria-hidden="true" />
      </button>
    </li>
    <li>
      <button
        type="button"
        class="min-h-8 px-1 font-medium text-accent-text hover:underline"
        @click="emit('clearAll')"
      >
        {{ $t('problems.clearAll') }}
      </button>
    </li>
  </ul>
</template>
