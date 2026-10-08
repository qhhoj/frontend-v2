<script setup lang="ts">
/** `aria-disabled`, not `disabled`: a disabled button drops keyboard focus mid-request. `useAuthAction` ignores the extra submit. */
defineProps<{ pending?: boolean }>();
</script>

<template>
  <button
    type="submit"
    :aria-busy="pending ? 'true' : undefined"
    :aria-disabled="pending ? 'true' : undefined"
    class="bg-gradient-accent h-12 w-full rounded-pill font-display text-[15px] font-semibold text-on-accent aria-disabled:opacity-60"
  >
    <slot />
  </button>
</template>
