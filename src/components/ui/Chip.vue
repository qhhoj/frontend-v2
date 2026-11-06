<script setup lang="ts">
import type { Component } from 'vue';
import { X } from 'lucide-vue-next';
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import type { RouteLocationRaw } from 'vue-router';
import { VERDICT_TONE_CLASSES, VERDICT_TONES } from '@/lib/verdicts';
import type { VerdictCode } from '@/lib/verdicts';

type TagTone = `tag-${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`;
/** `solid` is the attention count ("something waits for you"): the one filled chip. */
type StatusTone = 'neutral' | 'accent' | 'solid' | 'success' | 'danger' | 'warning' | 'info';
/** A status, a tag colour, or a verdict code (AC, WA, ...) for the verdict's own pair. */
export type ChipTone = StatusTone | TagTone | VerdictCode;
export type ChipSize = 'sm' | 'md';

/**
 * A pill chip: optional dot or icon, then text on a tone's token pair, never wrapping. sm is 22 px with caption text and a 14 px
 * icon, md 28 px with meta text and a 16 px icon; an icon in the `icon` slot without its own `size-*` class gets the same size.
 * The text carries the meaning; colour only repeats it, so give a chip a tone only when the tone means a status.
 *
 * One chip in a set: `pressed` (true/false) makes it a toggle button (`aria-pressed`) and a pressed chip takes the one active look
 * (accent-soft fill, accent border) whatever its tone; `to` makes it a link; `interactive` alone is a plain button. `removable` adds
 * an x button (`removeLabel`, required, is its aria-label) and emits `remove`: an active filter. The chip is then a group of two
 * sibling controls (the chip's own action and the x), never a button inside a button. Interactive chips get a 44 px hit area on
 * coarse pointers. The count badge of Tabs and SegmentedControl is `size="sm"` with `class="font-mono tabular-nums"`.
 */
interface ChipBase {
  tone?: ChipTone;
  size?: ChipSize;
  icon?: Component;
  dot?: boolean;
  interactive?: boolean;
  pressed?: boolean;
  to?: RouteLocationRaw;
}
/** A removable chip must say what its x removes: `removeLabel` is required with `removable`. */
type ChipProps = ChipBase &
  ({ removable?: false; removeLabel?: string } | { removable: true; removeLabel: string });
const props = withDefaults(defineProps<ChipProps>(), {
  tone: 'neutral',
  size: 'sm',
  icon: undefined,
  dot: false,
  interactive: false,
  pressed: undefined,
  to: undefined,
  removable: false,
  removeLabel: undefined,
});
const emit = defineEmits<{ remove: [] }>();

defineOptions({ name: 'UiChip' });

const STATUS_TONES: Record<StatusTone | TagTone, string> = {
  neutral: 'border-line bg-surface-strong text-muted',
  accent: 'border-transparent bg-accent-soft text-accent-soft-text',
  solid: 'border-transparent bg-accent text-on-accent',
  success: 'border-transparent bg-positive-bg text-positive',
  danger: 'border-transparent bg-negative-bg text-negative',
  warning: 'border-transparent bg-warning-bg text-warning',
  info: 'border-transparent bg-info-bg text-info',
  'tag-1': 'border-transparent bg-tag-1-bg text-tag-1',
  'tag-2': 'border-transparent bg-tag-2-bg text-tag-2',
  'tag-3': 'border-transparent bg-tag-3-bg text-tag-3',
  'tag-4': 'border-transparent bg-tag-4-bg text-tag-4',
  'tag-5': 'border-transparent bg-tag-5-bg text-tag-5',
  'tag-6': 'border-transparent bg-tag-6-bg text-tag-6',
  'tag-7': 'border-transparent bg-tag-7-bg text-tag-7',
  'tag-8': 'border-transparent bg-tag-8-bg text-tag-8',
};
const SIZES: Record<ChipSize, { box: string; icon: string }> = {
  sm: {
    box: 'h-5.5 px-2 text-caption leading-4 [&_svg:not([class*=size-])]:size-3.5',
    icon: 'size-3.5',
  },
  md: {
    box: 'h-7 px-2.5 text-meta leading-4.5 [&_svg:not([class*=size-])]:size-4',
    icon: 'size-4',
  },
};
const INTERACTIVE =
  'relative cursor-pointer transition-colors hover:border-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus touch:after:absolute touch:after:inset-x-0 touch:after:top-1/2 touch:after:h-11 touch:after:-translate-y-1/2';

const PRESSED = 'border-accent bg-accent-soft text-accent-soft-text';
const REMOVE =
  'relative -mr-1 inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-pill hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus touch:after:absolute touch:after:top-1/2 touch:after:left-1/2 touch:after:size-11 touch:after:-translate-1/2';

const INTERACTIVE_INNER =
  'relative cursor-pointer hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus touch:after:absolute touch:after:inset-x-0 touch:after:top-1/2 touch:after:h-11 touch:after:-translate-y-1/2';

const tag = computed(() => {
  if (props.to) return RouterLink;
  return props.interactive || props.pressed !== undefined ? 'button' : 'span';
});
const isInteractive = computed(() => tag.value !== 'span');
const controlAttrs = computed(() => {
  if (props.to) return { to: props.to, 'aria-current': props.pressed ? 'page' : undefined };
  if (tag.value === 'button') return { type: 'button', 'aria-pressed': props.pressed };
  return {};
});
/** The chip box is the control itself, unless it is removable: then the box is a group and the control sits inside it. */
const outerTag = computed(() => (props.removable ? 'span' : tag.value));
const outerAttrs = computed(() => (props.removable ? { role: 'group' } : controlAttrs.value));
const innerTag = computed(() => (props.removable ? tag.value : 'span'));
const innerAttrs = computed(() => (props.removable ? controlAttrs.value : {}));
const innerClass = computed(() => {
  if (!props.removable) return 'contents';
  const base = 'inline-flex min-w-0 items-center gap-1 rounded-pill';
  return isInteractive.value ? `${base} ${INTERACTIVE_INNER}` : base;
});
const toneClass = computed(() => {
  if (props.pressed) return PRESSED;
  return props.tone in VERDICT_TONES
    ? `border-transparent ${VERDICT_TONE_CLASSES[VERDICT_TONES[props.tone as VerdictCode]]}`
    : STATUS_TONES[props.tone as StatusTone | TagTone];
});
</script>

<template>
  <component
    :is="outerTag"
    v-bind="outerAttrs"
    class="inline-flex max-w-full shrink-0 items-center gap-1 rounded-pill border font-semibold whitespace-nowrap"
    :class="[SIZES[size].box, toneClass, isInteractive && !removable && INTERACTIVE]"
  >
    <component :is="innerTag" v-bind="innerAttrs" :class="innerClass">
      <span v-if="dot" aria-hidden="true" class="size-1.5 shrink-0 rounded-pill bg-current" />
      <slot name="icon">
        <component
          :is="icon"
          v-if="icon"
          aria-hidden="true"
          class="shrink-0"
          :class="SIZES[size].icon"
          :stroke-width="1.75"
        />
      </slot>
      <span class="truncate"><slot /></span>
    </component>
    <button
      v-if="removable"
      type="button"
      :aria-label="removeLabel"
      :class="REMOVE"
      @click.stop="emit('remove')"
    >
      <X aria-hidden="true" class="size-3.5" />
    </button>
  </component>
</template>
