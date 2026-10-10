<script setup lang="ts">
import { toolbarControlClass } from './toolbar-classes';

defineProps<{ pressed: boolean; disabled?: boolean }>();
defineEmits<{ toggle: [] }>();
</script>

<template>
  <button
    type="button"
    :aria-pressed="pressed"
    :disabled="disabled"
    :class="[toolbarControlClass(pressed), disabled && 'opacity-50']"
    @click="$emit('toggle')"
  >
    <slot />
  </button>
</template>
