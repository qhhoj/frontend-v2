<script setup lang="ts">
/**
 * The sticky bar over a selectable card list: "select page", how many are picked, and the caller's bulk buttons.
 * Tables use `table/AdminBulkBar.vue` through `AdminDataTable` instead (shown only while rows are picked); this one stays for
 * the card lists until their screen PRs move them to the table.
 */
defineProps<{ label: string; countText: string; allSelected: boolean; canSelect: boolean }>();
defineEmits<{ toggleAll: [] }>();
</script>

<template>
  <div
    class="sticky top-2 z-10 flex flex-wrap items-center gap-3 rounded-row border border-line-strong bg-surface-strong px-3 py-2"
    role="group"
    :aria-label="label"
  >
    <label
      class="inline-flex min-h-[var(--qa-control,2.25rem)] items-center gap-2 text-sm font-semibold"
    >
      <input
        type="checkbox"
        class="size-4 accent-[var(--qh-accent)]"
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
