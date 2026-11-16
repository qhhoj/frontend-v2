<script setup lang="ts">
import type { Component } from 'vue';
import { X } from 'lucide-vue-next';
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import type { RouteLocationRaw } from 'vue-router';
import { CUE_CHIP } from './cue-tones';
import type { CueTone } from './cue-tones';

type TagTone = `tag-${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`;
/** `solid` is the attention count ("something waits for you"): the one filled chip. */
type StatusTone = 'neutral' | 'accent' | 'solid' | 'success' | 'danger' | 'warning' | 'info';
/** A status, a cue (live, upcoming, ended, full, partial, zero, attention; cue-tones.ts) or a tag colour. A verdict is a `VerdictChip`, which adds its glyph. */
export type ChipTone = StatusTone | CueTone | TagTone;
export type ChipSize = 'sm' | 'md';

/**
 * A pill chip, no line: optional dot or icon, then text on a tone's tint, never wrapping. sm is 24 px (`--qh-chip`) with 13 px text and a 14 px
 * icon, md is 24 px with 14 px text and a 16 px icon; a filter chip (`pressed` or `removable`) is 36 px, on the toolbar's band; an icon in the `icon` slot without its own `size-*` class gets the same size.
 * The text carries the meaning; colour only repeats it, so give a chip a tone only when the tone means a status.
 *
 * One chip in a set: `pressed` (true/false) makes it a toggle button (`aria-pressed`) and a pressed chip takes the one active look
 * (accent-soft fill) whatever its tone; `to` makes it a link; `interactive` alone is a plain button. `removable` adds
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

const TONES: Record<ChipTone, string> = {
  ...CUE_CHIP,
  neutral: 'bg-surface-strong text-muted',
  accent: 'bg-accent-soft text-accent-soft-text',
  solid: 'bg-accent text-on-accent',
  success: 'bg-positive-bg text-positive',
  danger: 'bg-negative-bg text-negative',
  warning: 'bg-warning-bg text-warning',
  info: 'bg-info-bg text-info',
  'tag-1': 'bg-tag-1-bg text-tag-1',
  'tag-2': 'bg-tag-2-bg text-tag-2',
  'tag-3': 'bg-tag-3-bg text-tag-3',
  'tag-4': 'bg-tag-4-bg text-tag-4',
  'tag-5': 'bg-tag-5-bg text-tag-5',
  'tag-6': 'bg-tag-6-bg text-tag-6',
  'tag-7': 'bg-tag-7-bg text-tag-7',
  'tag-8': 'bg-tag-8-bg text-tag-8',
};
const SIZES: Record<ChipSize, { box: string; icon: string }> = {
  sm: {
    box: 'h-(--qh-chip) px-(--qh-chip-px) text-small [&_svg:not([class*=size-])]:size-3.5',
    icon: 'size-3.5',
  },
  md: {
    box: 'h-(--qh-chip) px-(--qh-chip-px) text-meta [&_svg:not([class*=size-])]:size-4',
    icon: 'size-4',
  },
};
/** A filter chip (pressable or removable) sits on the 36 px control band with the toolbar (spec §1). */
const FILTER_BOX = 'h-(--qh-control) px-(--qh-control-px-sm) text-meta';
const INTERACTIVE =
  'relative cursor-pointer transition-colors hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus touch:after:absolute touch:after:inset-x-0 touch:after:top-1/2 touch:after:h-11 touch:after:-translate-y-1/2';

const PRESSED = 'bg-accent-soft text-accent-soft-text';
const REMOVE =
  'relative -mr-2 inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-pill hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus touch:after:absolute touch:after:top-1/2 touch:after:left-1/2 touch:after:size-11 touch:after:-translate-1/2';

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
const isFilter = computed(() => props.removable || props.pressed !== undefined);
const toneClass = computed(() => (props.pressed ? PRESSED : TONES[props.tone]));
</script>

<template>
  <component
    :is="outerTag"
    v-bind="outerAttrs"
    class="edge-high inline-flex max-w-full shrink-0 items-center gap-1 rounded-pill font-semibold whitespace-nowrap"
    :class="[
      isFilter ? FILTER_BOX : SIZES[size].box,
      toneClass,
      isInteractive && !removable && INTERACTIVE,
    ]"
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
