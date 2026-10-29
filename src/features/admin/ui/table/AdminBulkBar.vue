<script setup lang="ts">
import { X } from 'lucide-vue-next';
import AppButton from '@/components/ui/AppButton.vue';

/**
 * Shown only while rows are selected, in place of the table toolbar: "3 đã chọn · Bỏ chọn" and the bulk actions (default slot,
 * small buttons). A flat `surface-strong` band, no shadow. The count is announced politely.
 */
defineProps<{ count: number; label?: string }>();
defineEmits<{ clear: [] }>();
</script>

<template>
  <div
    role="group"
    :aria-label="label ?? $t('common.table.bulkLabel')"
    class="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line bg-surface-strong px-3 py-2"
  >
    <span class="text-sm font-semibold" aria-live="polite">
      {{ $t('common.table.selected', count) }}
    </span>
    <AppButton tone="ghost" size="sm" @click="$emit('clear')">
      <template #icon><X aria-hidden="true" class="size-4" :stroke-width="1.75" /></template>
      {{ $t('common.clearSelection') }}
    </AppButton>
    <div class="ml-auto flex flex-wrap items-center gap-2"><slot /></div>
  </div>
</template>
