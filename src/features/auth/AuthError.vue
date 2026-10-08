<script setup lang="ts">
import { CircleAlert } from 'lucide-vue-next';

withDefaults(defineProps<{ text?: string | null }>(), { text: null });
</script>

<template>
  <p
    v-if="text"
    role="alert"
    class="flex items-start gap-2.5 rounded-tile bg-verdict-wa-bg px-3.5 py-3 text-sm leading-normal text-verdict-wa"
  >
    <CircleAlert aria-hidden="true" class="mt-0.5 size-[18px] shrink-0" />
    <!-- The slot is an action that belongs to this failure (resend the activation mail). -->
    <span>{{ text }} <slot /></span>
  </p>
</template>
