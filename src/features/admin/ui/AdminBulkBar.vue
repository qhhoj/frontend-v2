<script setup lang="ts">
/** The sticky bar over a selectable list: "select page", how many are picked, and the caller's bulk buttons. */
defineProps<{ label: string; countText: string; allSelected: boolean; canSelect: boolean }>();
defineEmits<{ toggleAll: [] }>();
</script>

<template>
  <div
    class="sticky top-2 z-10 flex flex-wrap items-center gap-3 rounded-panel border border-line bg-surface-solid p-3 shadow-lg"
    role="group"
    :aria-label="label"
  >
    <label class="inline-flex min-h-11 items-center gap-2 font-semibold">
      <input
        type="checkbox"
        class="size-5 accent-[var(--qh-accent)]"
        :checked="allSelected"
        :disabled="!canSelect"
        @change="$emit('toggleAll')"
      />
      {{ $t('admin.ui.bulk.selectPage') }}
    </label>
    <span class="text-sm text-muted" aria-live="polite">{{ countText }}</span>
    <div class="ml-auto flex flex-wrap gap-2"><slot /></div>
  </div>
</template>
