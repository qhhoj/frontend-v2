<script setup lang="ts">
/**
 * The selection box of a DataTable row or header: 16 px to the eye, 44 px to a finger on a coarse pointer. A native checkbox takes
 * no `::after`, so the label around it is the hit area, and its negative margin hands the extra size back: a row never grows.
 */
defineProps<{ checked: boolean; indeterminate?: boolean; label: string }>();
defineEmits<{ change: [checked: boolean] }>();
</script>

<template>
  <label
    class="inline-flex size-4 items-center justify-center align-middle touch:-m-3.5 touch:size-11"
  >
    <input
      type="checkbox"
      class="size-4 accent-accent"
      :checked="checked"
      :indeterminate="indeterminate"
      :aria-label="label"
      @change="$emit('change', ($event.target as HTMLInputElement).checked)"
    />
  </label>
</template>
