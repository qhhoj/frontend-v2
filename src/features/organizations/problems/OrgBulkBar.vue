<script setup lang="ts">
/** The sticky bar of board M7A while rows are ticked; the count is announced politely when it changes. */
defineProps<{ count: number; isPending: boolean }>();
const emit = defineEmits<{ archive: []; unarchive: []; tag: []; clear: [] }>();
const BUTTON =
  'inline-flex min-h-11 items-center rounded-pill border border-line px-4 font-semibold hover:bg-surface-hover aria-disabled:cursor-progress aria-disabled:text-muted';
</script>

<template>
  <div
    role="region"
    :aria-label="$t('orgProblems.bulk.label')"
    data-testid="org-bulk-bar"
    class="sticky bottom-3 z-10 flex flex-wrap items-center gap-2 rounded-panel border border-line-strong bg-surface-solid p-3"
  >
    <p role="status" class="mr-auto font-semibold">
      {{ $t('orgProblems.bulk.selected', { count }, count) }}
    </p>
    <button
      type="button"
      :class="BUTTON"
      :aria-disabled="isPending || undefined"
      @click="emit('tag')"
    >
      {{ $t('orgProblems.bulk.tag') }}
    </button>
    <button
      type="button"
      :class="BUTTON"
      :aria-disabled="isPending || undefined"
      @click="emit('archive')"
    >
      {{ $t('orgProblems.bulk.archive') }}
    </button>
    <button
      type="button"
      :class="BUTTON"
      :aria-disabled="isPending || undefined"
      @click="emit('unarchive')"
    >
      {{ $t('orgProblems.bulk.unarchive') }}
    </button>
    <button type="button" :class="BUTTON" @click="emit('clear')">
      {{ $t('orgProblems.bulk.clear') }}
    </button>
  </div>
</template>
