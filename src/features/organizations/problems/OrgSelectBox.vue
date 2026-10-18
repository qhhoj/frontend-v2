<script setup lang="ts">
/**
 * A 44 px tick box for one row, or for the whole page in the header; `label` is its screen-reader name. Text in the
 * default slot sits beside the box inside the same label, so tapping it ticks the box too.
 */
defineProps<{ checked: boolean; label: string }>();
defineEmits<{ change: [] }>();
</script>

<template>
  <label class="inline-flex min-h-11 shrink-0 items-center gap-1">
    <span class="inline-flex size-11 items-center justify-center">
      <input
        type="checkbox"
        class="size-5"
        :checked="checked"
        :aria-label="label"
        @change="$emit('change')"
      />
    </span>
    <slot />
  </label>
</template>
