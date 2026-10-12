<script setup lang="ts">
import Notice from '@/components/ui/Notice.vue';

/** A failure line; the slot is an action that belongs to this failure (resend the activation mail). */
withDefaults(defineProps<{ text?: string | null }>(), { text: null });
</script>

<template>
  <Notice v-if="text" tone="danger">{{ text }} <slot /></Notice>
</template>
