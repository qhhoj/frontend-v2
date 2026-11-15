<script setup lang="ts">
/**
 * The one row between a page's header and its content (layout plan §2), shaped like `FilterBar` but with free slots, so
 * it also serves lists with no search box. `#left`: the search box first, then the filters. `#right`: the result count
 * (`aria-live="polite"`), then the sort, then one list-level toggle. `#chips`: the active filters, under the row.
 * The row wraps on a phone: the left group takes a line, the right group the next, and the right one stays right.
 */
defineSlots<{ left?: () => unknown; right?: () => unknown; chips?: () => unknown }>();
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="flex flex-wrap items-center gap-2">
      <div v-if="$slots.left" class="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <slot name="left" />
      </div>
      <div v-if="$slots.right" class="ml-auto flex flex-wrap items-center gap-2 text-sm text-muted">
        <slot name="right" />
      </div>
    </div>
    <div v-if="$slots.chips"><slot name="chips" /></div>
  </div>
</template>
