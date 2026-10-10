<script setup lang="ts">
import GlassCard from '@/components/GlassCard.vue';
import QueryState from '@/components/QueryState.vue';

/** A rail card: its heading, the list with the shared loading and error states, and an optional footer link. The optional `bit` slot puts a decorative Bit at the heading's right. `embedded` drops the card chrome to be one section of a shared card. */
withDefaults(
  defineProps<{ title: string; loading: boolean; error: unknown; embedded?: boolean }>(),
  { embedded: false },
);
defineEmits<{ retry: [] }>();
</script>

<template>
  <component
    :is="embedded ? 'section' : GlassCard"
    class="flex flex-col gap-3"
    :class="{ 'p-4 sm:p-5': !embedded }"
  >
    <div v-if="$slots.bit" class="flex items-center justify-between gap-2">
      <h2 class="font-display text-base font-bold">{{ title }}</h2>
      <slot name="bit" />
    </div>
    <h2 v-else class="font-display text-base font-bold">{{ title }}</h2>
    <QueryState :loading="loading" :error="error" @retry="$emit('retry')">
      <template #skeleton><slot name="skeleton" /></template>
      <slot />
    </QueryState>
    <div v-if="$slots.footer" class="pt-1 text-sm">
      <slot name="footer" />
    </div>
  </component>
</template>
