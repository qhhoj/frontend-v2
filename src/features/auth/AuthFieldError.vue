<script setup lang="ts">
import { CircleAlert } from 'lucide-vue-next';

/** The error line under an auth field; its `id` is the one the field's `aria-describedby` names. */
defineProps<{ id: string; message: string }>();
</script>

<template>
  <p :id="id" class="flex items-center gap-1.5 text-meta text-negative">
    <CircleAlert aria-hidden="true" class="size-3.5 shrink-0" />
    {{ message }}
  </p>
</template>
