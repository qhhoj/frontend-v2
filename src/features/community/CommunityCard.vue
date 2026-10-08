<script setup lang="ts">
import GlassCard from '@/components/GlassCard.vue';
import QueryState from '@/components/QueryState.vue';

/** A rail card: its heading, the list with the shared loading and error states, and an optional footer link. */
defineProps<{ title: string; loading: boolean; error: unknown }>();
defineEmits<{ retry: [] }>();
</script>

<template>
  <GlassCard class="flex flex-col gap-3 p-4 sm:p-5">
    <h2 class="font-display text-lg font-semibold">{{ title }}</h2>
    <QueryState :loading="loading" :error="error" @retry="$emit('retry')">
      <template #skeleton><slot name="skeleton" /></template>
      <slot />
    </QueryState>
    <div v-if="$slots.footer" class="pt-1 text-sm">
      <slot name="footer" />
    </div>
  </GlassCard>
</template>
