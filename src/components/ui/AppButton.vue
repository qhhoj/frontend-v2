<script setup lang="ts">
import { computed, h, ref, useAttrs, useId, useSlots } from 'vue';
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
const control = ref<HTMLElement | null>(null);
/** Refs reach the button itself even when a disabled reason wraps it. */
defineExpose({ focus: (options?: FocusOptions) => control.value?.focus(options) });

const inactive = computed(() => props.disabled || props.loading);
const reasonId = useId();
const reason = computed(() => (props.disabled ? props.disabledReason : undefined));
const attrs = useAttrs();
/** The caller's own `aria-describedby`, then the reason's id. */
const described = computed(
  () =>
    [attrs['aria-describedby'], reason.value ? reasonId : undefined].filter(Boolean).join(' ') ||
    undefined,
);
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
 * A button that may get a reason is always wrapped (the reason only appears while disabled), so toggling `disabled` never
 * re-creates the `<button>` and focus stays. Button and reason are one inline unit, so a flex toolbar gives them one gap. Without
 * `disabledReason` the root is the button (or link) itself, so `$el` and template refs reach the element.
 */
const WithReason = (_props: object, { slots }: { slots: { default?: () => VNode[] } }) =>
  props.disabledReason === undefined
    ? slots.default?.()[0]
    : h('span', { class: 'inline-flex items-center gap-2' }, [
        slots.default?.(),
        reason.value
          ? h('span', { id: reasonId, class: 'text-caption text-muted' }, reason.value)
          : null,
      ]);
</script>

<template>
  <WithReason>
    <RouterLink v-if="to !== undefined" v-slot="{ href: routeHref, navigate }" :to="to" custom>
      <a
        ref="control"
        :aria-pressed="pressed"
        v-bind="$attrs"
        :class="classes"
        :aria-disabled="inactive || undefined"
        :aria-busy="loading || undefined"
        :aria-describedby="described"
        :href="routeHref"
        @click="press($event, navigate)"
      >
        <ButtonContent />
      </a>
    </RouterLink>
    <a
      v-else-if="href !== undefined"
      ref="control"
      :aria-pressed="pressed"
      v-bind="$attrs"
      :class="classes"
      :aria-disabled="inactive || undefined"
      :aria-busy="loading || undefined"
      :aria-describedby="described"
      :href="href"
      @click="press"
    >
      <ButtonContent />
    </a>
    <button
      v-else
      ref="control"
      :aria-pressed="pressed"
      v-bind="$attrs"
      :class="classes"
      :aria-disabled="inactive || undefined"
      :aria-busy="loading || undefined"
      :aria-describedby="described"
      :type="type"
      @click="press"
    >
      <ButtonContent />
    </button>
  </WithReason>
</template>
