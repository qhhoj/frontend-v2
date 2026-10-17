<script setup lang="ts">
import { SlidersHorizontal } from 'lucide-vue-next';
import { toolbarControlClass } from '@/components/toolbar-classes';

/** "Bộ lọc nâng cao": opens the panel `panelId`; `count` is how many filters only the panel shows. */
defineProps<{ open: boolean; count: number; panelId: string }>();
defineEmits<{ toggle: [] }>();
</script>

<template>
  <button
    type="button"
    data-testid="advanced-filters"
    :aria-expanded="open"
    :aria-controls="panelId"
    :class="[toolbarControlClass(count > 0), 'border-dashed']"
    @click="$emit('toggle')"
  >
    <SlidersHorizontal class="size-4" aria-hidden="true" />
    {{ $t('submissions.quick.advanced') }}
    <span v-if="count" class="font-mono text-xs tabular-nums">{{ count }}</span>
  </button>
</template>
