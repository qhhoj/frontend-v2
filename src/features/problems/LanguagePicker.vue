<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next';
import Select from 'primevue/select';
import type { Language } from '@/api/types/problems';
import TokenCoin from '@/components/TokenCoin.vue';
import Chip from '@/components/ui/Chip.vue';

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
        <Chip v-if="selected.fileOnly">{{ $t('submit.fileOnly') }}</Chip>
      </span>
    </template>
    <template #dropdownicon>
      <ChevronDown class="size-4" aria-hidden="true" />
    </template>
    <template #option="{ option }">
      {{ option.name }}
      <Chip v-if="option.fileOnly" class="ml-2">{{ $t('submit.fileOnly') }}</Chip>
    </template>
  </Select>
</template>
