<script setup lang="ts">
import { computed, h, useSlots } from 'vue';
import { RouterLink } from 'vue-router';
import type { RouteLocationRaw } from 'vue-router';
import { LoaderCircle } from 'lucide-vue-next';
import { buttonClasses } from './button-classes';
import type { ButtonSize, ButtonTone } from './button-classes';

/**
 * The site button (docs/design-language.md). `to` renders a RouterLink, `href` a plain link, otherwise a `<button>`. Disabled and
 * loading keep focus (`aria-disabled`, never the native attribute) and swallow the click; loading shows a spinner in place of the
 * icon and keeps the label. `iconOnly` is IconButton's square shape.
 */
defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<{
    tone?: ButtonTone;
    size?: ButtonSize;
    to?: RouteLocationRaw;
    href?: string;
    type?: 'button' | 'submit' | 'reset';
    loading?: boolean;
    disabled?: boolean;
    block?: boolean;
    iconOnly?: boolean;
  }>(),
  { tone: 'secondary', size: 'md', to: undefined, href: undefined, type: 'button' },
);
const emit = defineEmits<{ click: [event: MouseEvent] }>();
const slots = useSlots();

const inactive = computed(() => props.disabled || props.loading);
const classes = computed(() =>
  buttonClasses({
    tone: props.tone,
    size: props.size,
    block: props.block,
    iconOnly: props.iconOnly,
  }),
);

function press(event: MouseEvent, navigate?: (event: MouseEvent) => unknown) {
  if (inactive.value) {
    event.preventDefault();
    return;
  }
  emit('click', event);
  // RouterLink's navigate skips modified clicks and clicks a listener prevented.
  if (navigate) void navigate(event);
}

const spinner = () =>
  h(LoaderCircle, { 'aria-hidden': 'true', class: 'size-4 motion-safe:animate-spin' });
/** Icon (or the spinner while loading), then the label. */
const ButtonContent = () => [props.loading ? spinner() : slots.icon?.(), slots.default?.()];
</script>

<template>
  <RouterLink v-if="to !== undefined" v-slot="{ href: routeHref, navigate }" :to="to" custom>
    <a
      v-bind="$attrs"
      :class="classes"
      :aria-disabled="inactive || undefined"
      :aria-busy="loading || undefined"
      :href="routeHref"
      @click="press($event, navigate)"
    >
      <ButtonContent />
    </a>
  </RouterLink>
  <a
    v-else-if="href !== undefined"
    v-bind="$attrs"
    :class="classes"
    :aria-disabled="inactive || undefined"
    :aria-busy="loading || undefined"
    :href="href"
    @click="press"
  >
    <ButtonContent />
  </a>
  <button
    v-else
    v-bind="$attrs"
    :class="classes"
    :aria-disabled="inactive || undefined"
    :aria-busy="loading || undefined"
    :type="type"
    @click="press"
  >
    <ButtonContent />
  </button>
</template>
