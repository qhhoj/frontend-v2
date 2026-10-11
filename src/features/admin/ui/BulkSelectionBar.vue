<script setup lang="ts">
/** The sticky bar over a list while rows are ticked: the count, the bulk actions (slot) and a clear link. */
defineProps<{ count: number }>();
const emit = defineEmits<{ clear: [] }>();
</script>

<template>
  <div
    v-if="count > 0"
    class="sticky top-0 z-10 flex flex-wrap items-end gap-3 rounded-row border border-line-strong bg-surface-solid p-3"
  >
    <p class="min-h-11 content-center text-sm font-semibold" role="status">
      {{ $t('admin.contests.bulk.selected', { count }) }}
    </p>
    <slot />
    <button type="button" class="min-h-11 text-sm text-muted underline" @click="emit('clear')">
      {{ $t('admin.contests.bulk.clear') }}
    </button>
  </div>
</template>
