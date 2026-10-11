<script setup lang="ts">
/**
 * The header of a rank-number column: a visible "#" for sighted readers, and the translated word ("Hạng" / "Rank")
 * for screen readers. Put it inside the `<th>` of every ranking table so the column stays narrow.
 */
defineProps<{ label: string }>();
</script>

<template>
  <span
    ><span aria-hidden="true">#</span><span class="sr-only">{{ label }}</span></span
  >
</template>
