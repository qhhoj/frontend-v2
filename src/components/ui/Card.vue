<script setup lang="ts">
import { computed, useSlots } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import StretchedLink from './StretchedLink.vue';
import { CARD_PADDING, CARD_VARIANTS, type CardPadding, type CardVariant } from './Card.variants';

const props = withDefaults(
  defineProps<{
    as?: string;
    variant?: CardVariant;
    padding?: CardPadding;
    title?: string;
    lead?: string;
    /**
     * The card stands for one destination: the WHOLE card is its link (`to` a route, `href` a plain URL). The `title` is the
     * link text; a card without a title needs `linkLabel`, read by screen readers. Buttons and links inside still work.
     */
    to?: RouteLocationRaw;
    href?: string;
    linkLabel?: string;
    /**
     * A panel with a header: the same card, with the header as a flush row on top (the title at the left; a note, a link or a
     * small quiet button at the right in `#actions`), a hairline under it, and the content padded below. Use `sm` buttons in it.
     */
    panel?: boolean;
  }>(),
  {
    as: 'section',
    variant: 'glass',
    padding: undefined,
    title: undefined,
    lead: undefined,
    to: undefined,
    href: undefined,
    linkLabel: undefined,
    panel: false,
  },
);

defineOptions({ name: 'UiCard' });

const slots = useSlots();
const isLink = computed(() => props.to !== undefined || props.href !== undefined);
const hasHeader = computed(() => Boolean(props.title || props.lead || slots.actions));
/** A card's header has no rule under it, 12 px of space; a panel's header is a flush row one table row tall over a hairline. */
const headerClass = computed(() =>
  props.panel
    ? 'min-h-(--qh-row) items-center border-b border-line px-(--qh-pad-surface) py-1'
    : 'mb-3 items-start',
);
const cardClass = computed(() => [
  CARD_VARIANTS[props.variant],
  !props.panel && props.padding && CARD_PADDING[props.padding],
  isLink.value && 'box-link',
]);
</script>

<template>
  <component :is="as" :class="cardClass">
    <header
      v-if="hasHeader"
      class="flex flex-wrap justify-between gap-x-3 gap-y-1"
      :class="headerClass"
    >
      <div class="min-w-0">
        <h2 v-if="title" :class="panel ? 'text-body font-semibold' : 'section-title'">
          <StretchedLink v-if="isLink" :to="to" :href="href">{{ title }}</StretchedLink>
          <template v-else>{{ title }}</template>
        </h2>
        <p v-if="lead" class="text-meta text-muted" :class="{ 'mt-1': !panel }">{{ lead }}</p>
      </div>
      <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2">
        <slot name="actions" />
      </div>
    </header>
    <StretchedLink v-if="isLink && !title" :to="to" :href="href">
      <span class="sr-only">{{ linkLabel }}</span>
    </StretchedLink>
    <div v-if="panel" class="p-(--qh-pad-surface)"><slot /></div>
    <slot v-else />
  </component>
</template>
