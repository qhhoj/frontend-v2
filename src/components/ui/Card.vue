<script setup lang="ts">
import { computed, useSlots } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import StretchedLink from './StretchedLink.vue';
import {
  CARD_HEADER_BLEED,
  CARD_PADDING,
  CARD_VARIANTS,
  type CardPadding,
  type CardVariant,
} from './Card.variants';

const props = withDefaults(
  defineProps<{
    as?: string;
    variant?: CardVariant;
    padding?: CardPadding;
    title?: string;
    lead?: string;
    /** A rule between the header and the body, edge to edge when `padding` is set. */
    divided?: boolean;
    /**
     * The card stands for one destination: the WHOLE card is its link (`to` a route, `href` a plain URL). The `title` is the
     * link text; a card without a title needs `linkLabel`, read by screen readers. Buttons and links inside still work.
     */
    to?: RouteLocationRaw;
    href?: string;
    linkLabel?: string;
  }>(),
  {
    as: 'section',
    variant: 'glass',
    padding: undefined,
    title: undefined,
    lead: undefined,
    divided: false,
    to: undefined,
    href: undefined,
    linkLabel: undefined,
  },
);

defineOptions({ name: 'UiCard' });

const slots = useSlots();
const isLink = computed(() => props.to !== undefined || props.href !== undefined);
const hasHeader = computed(() => Boolean(props.title || props.lead || slots.actions));
const headerClass = computed(() =>
  props.divided
    ? ['mb-4 border-b border-line pb-3', props.padding && CARD_HEADER_BLEED[props.padding]]
    : props.variant === 'plain'
      ? 'mb-3'
      : 'mb-4',
);
const cardClass = computed(() => [
  CARD_VARIANTS[props.variant],
  props.padding && CARD_PADDING[props.padding],
  isLink.value && 'box-link',
]);
</script>

<template>
  <component :is="as" :class="cardClass">
    <header
      v-if="hasHeader"
      class="flex flex-wrap items-start justify-between gap-2"
      :class="headerClass"
    >
      <div class="min-w-0">
        <h2 v-if="title" class="text-title leading-5.5 font-semibold">
          <StretchedLink v-if="isLink" :to="to" :href="href">{{ title }}</StretchedLink>
          <template v-else>{{ title }}</template>
        </h2>
        <p v-if="lead" class="mt-1 text-meta leading-4.5 text-muted">{{ lead }}</p>
      </div>
      <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2">
        <slot name="actions" />
      </div>
    </header>
    <StretchedLink v-if="isLink && !title" :to="to" :href="href">
      <span class="sr-only">{{ linkLabel }}</span>
    </StretchedLink>
    <slot />
  </component>
</template>
