<script setup lang="ts">
import { X } from 'lucide-vue-next';
import AppButton from './AppButton.vue';

/**
 * Shown only while rows are selected: "3 đã chọn", a "Bỏ chọn" button and the bulk actions (default slot, small buttons). A flat
 * `surface-strong` band in a table's toolbar place; `sticky` makes it a bordered bar that stays at the top of the page.
 * The count is announced politely.
 */
withDefaults(defineProps<{ count: number; label?: string; sticky?: boolean }>(), {
  label: undefined,
  sticky: false,
});
defineEmits<{ clear: [] }>();
defineOptions({ name: 'UiBulkBar' });
</script>

<template>
  <div
    v-if="count > 0"
    role="group"
    :aria-label="label ?? $t('common.table.bulkLabel')"
    class="flex flex-wrap items-center gap-x-3 gap-y-2 bg-surface-strong px-3 py-2"
    :class="
      sticky ? 'sticky top-0 z-10 rounded-row border border-line-strong' : 'border-b border-line'
    "
  >
    <span class="text-sm font-semibold" aria-live="polite">
      {{ $t('common.table.selected', count) }}
    </span>
    <AppButton tone="ghost" size="sm" @click="$emit('clear')">
      <template #icon><X aria-hidden="true" class="size-4" /></template>
      {{ $t('common.clearSelection') }}
    </AppButton>
    <div class="ml-auto flex flex-wrap items-center gap-2"><slot /></div>
  </div>
</template>
