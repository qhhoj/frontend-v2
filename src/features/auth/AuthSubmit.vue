<script setup lang="ts">
/** `aria-disabled`, not `disabled`: a disabled button drops keyboard focus mid-request. `useAuthAction` ignores the extra submit. The pending look swaps to the accent-soft token pair (contrast-checked), never opacity. */
defineProps<{ pending?: boolean }>();
</script>

<template>
  <button
    type="submit"
    :aria-busy="pending ? 'true' : undefined"
    :aria-disabled="pending ? 'true' : undefined"
    class="bg-gradient-accent h-12 w-full rounded-pill font-display text-sm font-semibold text-on-accent aria-disabled:bg-none aria-disabled:bg-accent-soft aria-disabled:text-accent-soft-text"
  >
    <slot />
  </button>
</template>
