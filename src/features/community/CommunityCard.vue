<script setup lang="ts">
import Card from '@/components/ui/Card.vue';
import QueryState from '@/components/QueryState.vue';

/**
 * A home or rail card: the kit `Card` (24 px, `Card title`), the list with the shared loading and error states.
 * The `footer` slot (a `SeeAllLink`) and the optional decorative `bit` slot sit at the header's right.
 * `embedded` drops the card chrome to be one section of a shared card, with its footer at the bottom.
 */
withDefaults(
  defineProps<{ title: string; loading: boolean; error: unknown; embedded?: boolean }>(),
  { embedded: false },
);
defineEmits<{ retry: [] }>();
</script>

<template>
  <section v-if="embedded" class="flex flex-col gap-3">
    <h2 class="font-display text-base font-bold">{{ title }}</h2>
    <QueryState :loading="loading" :error="error" @retry="$emit('retry')">
      <template #skeleton><slot name="skeleton" /></template>
      <slot />
    </QueryState>
    <div v-if="$slots.footer" class="pt-1 text-sm"><slot name="footer" /></div>
  </section>
  <Card v-else padding="lg" :title="title">
    <template v-if="$slots.bit || $slots.footer" #actions>
      <slot name="bit" />
      <slot name="footer" />
    </template>
    <QueryState :loading="loading" :error="error" @retry="$emit('retry')">
      <template #skeleton>
        <div class="flex flex-col gap-3"><slot name="skeleton" /></div>
      </template>
      <div class="flex flex-col gap-3"><slot /></div>
    </QueryState>
  </Card>
</template>
