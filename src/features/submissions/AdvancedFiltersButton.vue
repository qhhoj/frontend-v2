<script setup lang="ts">
import { SlidersHorizontal } from 'lucide-vue-next';
import AppButton from '@/components/ui/AppButton.vue';
import Chip from '@/components/ui/Chip.vue';

/**
 * "Bộ lọc nâng cao" ("Bộ lọc" on phones): opens the panel `panelId`; `count` is how many filters only the panel shows.
 * `phoneCount` counts them below sm, where the panel also holds filters the chip row hides there (the language).
 */
const props = defineProps<{ open: boolean; count: number; phoneCount?: number; panelId: string }>();
defineEmits<{ toggle: [] }>();
</script>

<template>
  <AppButton
    data-testid="advanced-filters"
    class="shrink-0"
    :aria-expanded="open"
    :aria-controls="panelId"
    :pressed="count > 0"
    @click="$emit('toggle')"
  >
    <template #icon><SlidersHorizontal class="size-4" aria-hidden="true" /></template>
    <span class="sm:hidden">{{ $t('submissions.quick.filters') }}</span>
    <span class="max-sm:hidden">{{ $t('submissions.quick.advanced') }}</span>
    <Chip v-if="(props.phoneCount ?? count) > 0" class="font-mono tabular-nums sm:hidden">{{
      props.phoneCount ?? count
    }}</Chip>
    <Chip v-if="count" class="font-mono tabular-nums max-sm:hidden">{{ count }}</Chip>
  </AppButton>
</template>
