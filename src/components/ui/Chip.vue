<script setup lang="ts">
import type { Component } from 'vue';
import { X } from 'lucide-vue-next';
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import type { RouteLocationRaw } from 'vue-router';
import { TOGGLE_BASE, TOGGLE_OFF, TOGGLE_ON } from './button-classes';
import { CUE_TEXT } from './cue-tones';
import type { CueTone } from './cue-tones';

type TagTone = `tag-${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`;
/** Old tone names keep working; see `STRONG_TONES` and `MARK` for what each one draws now. */
type StatusTone = 'neutral' | 'accent' | 'solid' | 'success' | 'danger' | 'warning' | 'info';
/** A status, a cue (live, upcoming, ended, full, partial, zero, attention; cue-tones.ts) or a tag colour. A verdict is a `VerdictChip`. */
export type ChipTone = StatusTone | CueTone | TagTone;
export type ChipSize = 'sm' | 'md';

/**
 * Two things share this name ("Sơn mài" controls); the shape tells them apart.
 *
 * A **status tag** (the default): a pill on the raised ground, 24 px, 13 px text, no border, no hover, never clickable. `strong` is
 * ink semibold text ("Công khai" beside "Nháp"). One ground for every tone: a tone that says a state (accent, success, warning,
 * danger, info and the cues but `ended`) draws the strong text, and its colour stays only on the `dot` or the icon; `neutral`,
 * `ended` and the tag colours draw the plain tag. `size` is kept for old call sites; there is one size.
 *
 * A **filter toggle** (`pressed`, `interactive`, `to` or `removable`): anything you can click is a 32 px rounded rectangle, never a
 * pill. On (`pressed`) is the soft brand ground, brand border and brand text, the cue of the current menu item; it never looks like
 * the primary button. `to` makes it a link, `interactive` alone a plain button. `removable` (an active filter) adds an x button
 * (`removeLabel`, required, is its aria-label) and emits `remove`: the box is then a group of two sibling controls, never a button
 * inside a button. A toggle is 44 px tall on touch.
 */
interface ChipBase {
  tone?: ChipTone;
  size?: ChipSize;
  strong?: boolean;
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
  strong: false,
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

/** The tones that are not a state: they draw the plain tag. Every other tone draws the strong one. */
const PLAIN_TONES: ReadonlySet<ChipTone> = new Set<ChipTone>([
  'neutral',
  'ended',
  'tag-1',
  'tag-2',
  'tag-3',
  'tag-4',
  'tag-5',
  'tag-6',
  'tag-7',
  'tag-8',
]);
/** The colour of a tag's dot or icon; the text stays ink. */
const MARK: Partial<Record<ChipTone, string>> = {
  ...CUE_TEXT,
  accent: 'text-accent-text',
  solid: 'text-accent-text',
  success: 'text-positive',
  danger: 'text-negative',
  warning: 'text-warning',
  info: 'text-info',
};
const TAG =
  'h-(--qh-chip) gap-1 rounded-pill bg-surface-strong px-(--qh-chip-px) text-small whitespace-nowrap';
const TAG_PLAIN = 'text-secondary';
const TAG_STRONG = 'font-semibold text-content';
const REMOVE =
  '-mr-2 inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-control hover:bg-surface-strong touch:size-(--qh-touch)';
const INNER_CONTROL = 'inline-flex min-w-0 cursor-pointer items-center gap-2 self-stretch';

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
  return isInteractive.value ? INNER_CONTROL : 'inline-flex min-w-0 items-center gap-2';
});
/** A toggle is anything that can be clicked or removed; everything else is a status tag. */
const isToggle = computed(() => isInteractive.value || props.removable);
const isOn = computed(() => props.pressed ?? props.removable);
const boxClass = computed(() => {
  if (isToggle.value)
    return [
      TOGGLE_BASE,
      isOn.value ? TOGGLE_ON : TOGGLE_OFF,
      isInteractive.value && !props.removable && 'cursor-pointer',
    ];
  return [TAG, props.strong || !PLAIN_TONES.has(props.tone) ? TAG_STRONG : TAG_PLAIN];
});
const markClass = computed(() => (isToggle.value ? undefined : MARK[props.tone]));
</script>

<template>
  <component
    :is="outerTag"
    v-bind="outerAttrs"
    class="inline-flex max-w-full shrink-0 items-center"
    :class="boxClass"
  >
    <component :is="innerTag" v-bind="innerAttrs" :class="innerClass">
      <span
        v-if="dot"
        aria-hidden="true"
        class="size-2 shrink-0 rounded-pill bg-current"
        :class="markClass"
      />
      <slot name="icon">
        <component
          :is="icon"
          v-if="icon"
          aria-hidden="true"
          class="size-4 shrink-0"
          :class="markClass"
        />
      </slot>
      <span class="truncate"><slot /></span>
    </component>
    <button
      v-if="removable"
      type="button"
      :aria-label="removeLabel"
      :title="removeLabel"
      :class="REMOVE"
      @click.stop="emit('remove')"
    >
      <X aria-hidden="true" class="size-4" />
    </button>
  </component>
</template>
