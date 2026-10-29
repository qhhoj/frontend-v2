<script setup lang="ts">
import { computed, h, useId, useSlots } from 'vue';
import type { VNode } from 'vue';
import { RouterLink } from 'vue-router';
import type { RouteLocationRaw } from 'vue-router';
import { LoaderCircle } from 'lucide-vue-next';
import { buttonClasses } from './button-classes';
import type { ButtonSize, ButtonTone } from './button-classes';

/**
 * The site button (docs/design-language.md). `to` renders a RouterLink, `href` a plain link, otherwise a `<button>`. Disabled and
 * loading keep focus (`aria-disabled`, never the native attribute) and swallow the click; loading shows a spinner in place of the
 * icon and keeps the label. `iconOnly` is IconButton's square shape. `pressed` makes it a toggle (`aria-pressed`, the accent-soft
 * pair while on). `tone="link"` is an inline text action with a 44 px hit area. `disabledReason` shows, beside a disabled button,
 * why it cannot be used (and names it for assistive tech): a disabled button never has to guess.
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
    pressed?: boolean;
    disabledReason?: string;
  }>(),
  {
    tone: 'secondary',
    size: 'md',
    to: undefined,
    href: undefined,
    type: 'button',
    pressed: undefined,
    disabledReason: undefined,
  },
);
const emit = defineEmits<{ click: [event: MouseEvent] }>();
const slots = useSlots();

const inactive = computed(() => props.disabled || props.loading);
const reasonId = useId();
const reason = computed(() => (props.disabled ? props.disabledReason : undefined));
const described = computed(() => (reason.value ? reasonId : undefined));
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
/**
 * With a reason, button and reason are one inline unit, so a flex toolbar gives them one gap, not two. Without one there is no
 * wrapper at all.
 */
const WithReason = (_props: object, { slots }: { slots: { default?: () => VNode[] } }) =>
  reason.value
    ? h('span', { class: 'inline-flex items-center gap-2' }, [
        slots.default?.(),
        h('span', { id: reasonId, class: 'text-caption text-muted' }, reason.value),
      ])
    : slots.default?.();
</script>

<template>
  <WithReason>
    <RouterLink v-if="to !== undefined" v-slot="{ href: routeHref, navigate }" :to="to" custom>
      <a
        v-bind="$attrs"
        :class="classes"
        :aria-disabled="inactive || undefined"
        :aria-busy="loading || undefined"
        :aria-pressed="pressed"
        :aria-describedby="described"
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
      :aria-pressed="pressed"
      :aria-describedby="described"
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
      :aria-pressed="pressed"
      :aria-describedby="described"
      :type="type"
      @click="press"
    >
      <ButtonContent />
    </button>
  </WithReason>
</template>
