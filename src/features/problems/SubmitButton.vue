<script setup lang="ts">
defineProps<{ label: string; canSubmit: boolean }>();
</script>

<template>
  <button
    type="submit"
    :aria-disabled="!canSubmit"
    class="bg-gradient-accent shrink-0 rounded-pill font-display font-bold text-on-accent aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
  >
    {{ label }}
  </button>
</template>
