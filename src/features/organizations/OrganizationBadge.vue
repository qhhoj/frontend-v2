<script setup lang="ts">
defineProps<{ shortName: string }>();
</script>

<template>
  <span class="rounded-tile bg-accent-soft px-2.5 py-1 text-sm font-bold text-accent-soft-text">
    {{ shortName }}
  </span>
</template>
