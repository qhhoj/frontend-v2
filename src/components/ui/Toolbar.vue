<script setup lang="ts">
/**
 * The one row between a page's header and its content (layout plan §2), shaped like `FilterBar` but with free slots, so
 * it also serves lists with no search box. `#left`: the search box first, then the filters. `#right`: the result count
 * (`aria-live="polite"`), then the sort, then one list-level toggle. `#chips`: the active filters, under the row.
 * One 36 px line (Kit 2): every control in it is one height, 10 px apart. The row wraps on a phone: the left group takes a line, the right group the next, and the right one stays right.
 */
defineOptions({ name: 'UiToolbar' });
defineSlots<{ left?: () => unknown; right?: () => unknown; chips?: () => unknown }>();
</script>

<template>
  <div class="flex flex-col gap-(--qh-gap-control)">
    <div class="flex flex-wrap items-center gap-(--qh-gap-control)">
      <div
        v-if="$slots.left"
        class="flex min-w-0 flex-1 flex-wrap items-center gap-(--qh-gap-control)"
      >
        <slot name="left" />
      </div>
      <div
        v-if="$slots.right"
        class="ml-auto flex flex-wrap items-center gap-(--qh-gap-control) text-meta text-muted"
      >
        <slot name="right" />
      </div>
    </div>
    <div v-if="$slots.chips"><slot name="chips" /></div>
  </div>
</template>
