<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next';
import Select from 'primevue/select';
import type { Language } from '@/api/types/problems';
import TokenCoin from '@/components/TokenCoin.vue';

defineProps<{
  languages: Language[];
  /** The selected language's id. */
  selectedId: string | null;
  selected: Language | null;
  /** The phone sheet's pill is taller than the desktop one and fills its row. */
  isSheet: boolean;
}>();
defineEmits<{ pick: [languageId: string] }>();
</script>

<template>
  <Select
    :model-value="selectedId"
    :options="languages"
    option-label="name"
    option-value="id"
    :aria-label="$t('submit.language')"
    :class="isSheet ? 'h-12 min-w-0 flex-1' : 'h-11 min-w-44'"
    @update:model-value="$emit('pick', $event)"
  >
    <template #value>
      <span v-if="selected" class="flex items-center gap-2">
        <TokenCoin :seed="selected.key" size="sm" />
        {{ selected.name }}
        <span
          v-if="selected.fileOnly"
          class="rounded-pill bg-surface-strong px-2 text-xs text-muted"
          >{{ $t('submit.fileOnly') }}</span
        >
      </span>
    </template>
    <template #dropdownicon>
      <ChevronDown class="size-4" aria-hidden="true" />
    </template>
    <template #option="{ option }">
      {{ option.name }}
      <span
        v-if="option.fileOnly"
        class="ml-2 rounded-pill bg-surface-strong px-2 text-xs text-muted"
        >{{ $t('submit.fileOnly') }}</span
      >
    </template>
  </Select>
</template>
