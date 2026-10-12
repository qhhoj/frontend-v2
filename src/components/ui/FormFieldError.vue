<script setup lang="ts">
import { CircleAlert } from 'lucide-vue-next';

/**
 * A field's error line: icon and text, `id` named by the control's `aria-describedby`. `scale="admin"` is the admin forms'
 * 14 px variant, kept until the admin area moves to the 13 px line.
 */
withDefaults(defineProps<{ id: string; message: string; scale?: 'meta' | 'admin' }>(), {
  scale: 'meta',
});
</script>

<template>
  <p v-if="scale === 'admin'" :id="id" class="flex items-start gap-1.5 text-sm text-negative">
    <CircleAlert class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" :stroke-width="1.75" />
    <span>{{ message }}</span>
  </p>
  <p v-else :id="id" class="flex items-center gap-1.5 text-meta text-negative">
    <CircleAlert aria-hidden="true" class="size-3.5 shrink-0" />
    {{ message }}
  </p>
</template>
