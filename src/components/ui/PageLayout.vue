<script setup lang="ts">
export type PageWidth = 'wide' | 'split' | 'read';

/**
 * The one page grid (layout plan §2): three zones in a fixed order, spaced by the `--space-*` tokens, so a page sets
 * no gaps of its own. `#header` takes the `PageHeader` (on the ground, never in a card), `#toolbar` takes a `Toolbar`,
 * the default slot is the content: a table, `PageSection`s (40 px apart) or one statement. `width` picks the column:
 * `wide` (lists, tables, profile), `split` (the problem page with its submit pane), `read` (prose). Pages not yet moved
 * keep the `page-column` utility.
 */
withDefaults(defineProps<{ width?: PageWidth }>(), { width: 'wide' });
defineSlots<{ header?: () => unknown; toolbar?: () => unknown; default?: () => unknown }>();

const WIDTH: Record<PageWidth, string> = {
  wide: 'max-w-(--page-wide)',
  split: 'max-w-(--page-split)',
  read: 'max-w-(--page-read)',
};
</script>

<template>
  <div
    class="mx-auto w-full px-4 py-(--space-page-top) sm:px-8"
    :class="WIDTH[width]"
    data-page-column
  >
    <slot name="header" />
    <div v-if="$slots.toolbar" class="mt-(--space-header)"><slot name="toolbar" /></div>
    <div
      class="flex flex-col gap-(--space-section)"
      :class="$slots.toolbar ? 'mt-(--space-toolbar)' : 'mt-(--space-header)'"
    >
      <slot />
    </div>
  </div>
</template>
