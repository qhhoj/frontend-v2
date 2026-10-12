<script setup lang="ts">
import { computed, useSlots } from 'vue';
import { CARD_PADDING, CARD_VARIANTS, type CardPadding, type CardVariant } from './Card.variants';

const props = withDefaults(
  defineProps<{
    as?: string;
    variant?: CardVariant;
    padding?: CardPadding;
    title?: string;
    lead?: string;
  }>(),
  { as: 'section', variant: 'glass', padding: undefined, title: undefined, lead: undefined },
);

defineOptions({ name: 'UiCard' });

const slots = useSlots();
const hasHeader = computed(() => Boolean(props.title || props.lead || slots.actions));
const cardClass = computed(() => [
  CARD_VARIANTS[props.variant],
  props.padding && CARD_PADDING[props.padding],
]);
</script>

<template>
  <component :is="as" :class="cardClass">
    <header v-if="hasHeader" class="mb-4 flex flex-wrap items-start justify-between gap-2">
      <div class="min-w-0">
        <h2 v-if="title" class="text-title leading-5.5 font-semibold">{{ title }}</h2>
        <p v-if="lead" class="mt-1 text-meta leading-4.5 text-muted">{{ lead }}</p>
      </div>
      <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2">
        <slot name="actions" />
      </div>
    </header>
    <slot />
  </component>
</template>
