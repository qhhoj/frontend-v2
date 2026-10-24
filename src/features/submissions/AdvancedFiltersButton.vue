<script setup lang="ts">
import { SlidersHorizontal } from 'lucide-vue-next';
import { toolbarControlClass } from '@/components/toolbar-classes';

/**
 * "Bộ lọc nâng cao" ("Bộ lọc" on phones): opens the panel `panelId`; `count` is how many filters only the panel shows.
 * `phoneCount` counts them below sm, where the panel also holds filters the chip row hides there (the language).
 */
const props = defineProps<{ open: boolean; count: number; phoneCount?: number; panelId: string }>();
defineEmits<{ toggle: [] }>();
</script>

<template>
  <button
    type="button"
    data-testid="advanced-filters"
    :aria-expanded="open"
    :aria-controls="panelId"
    :class="[toolbarControlClass(count > 0), 'shrink-0 border-dashed whitespace-nowrap']"
    @click="$emit('toggle')"
  >
    <SlidersHorizontal class="size-4" aria-hidden="true" />
    <span class="sm:hidden">{{ $t('submissions.quick.filters') }}</span>
    <span class="max-sm:hidden">{{ $t('submissions.quick.advanced') }}</span>
    <span v-if="(props.phoneCount ?? count) > 0" class="font-mono text-xs tabular-nums sm:hidden">{{
      props.phoneCount ?? count
    }}</span>
    <span v-if="count" class="font-mono text-xs tabular-nums max-sm:hidden">{{ count }}</span>
  </button>
</template>
