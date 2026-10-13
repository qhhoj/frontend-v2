<script setup lang="ts">
/** The on/off switch of an appearance setting (44 × 56): labelled by the setting's title element (`labelledby`). */
defineProps<{ checked: boolean; labelledby: string }>();
const emit = defineEmits<{ toggle: [] }>();
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="checked"
    :aria-labelledby="labelledby"
    class="flex h-11 w-14 shrink-0 items-center rounded-pill border border-line-accent p-1"
    :class="checked ? 'bg-gradient-accent justify-end' : 'justify-start bg-surface-strong'"
    @click="emit('toggle')"
  >
    <span aria-hidden="true" class="size-8 rounded-full bg-content" />
  </button>
</template>
