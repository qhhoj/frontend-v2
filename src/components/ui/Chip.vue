<script setup lang="ts">
import type { Component } from 'vue';
import { computed } from 'vue';
import { VERDICT_TONE_CLASSES, VERDICT_TONES } from '@/lib/verdicts';
import type { VerdictCode } from '@/lib/verdicts';

type TagTone = `tag-${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`;
type StatusTone = 'neutral' | 'accent' | 'success' | 'danger' | 'warning' | 'info';
/** A status, a tag colour, or a verdict code (AC, WA, ...) for the verdict's own pair. */
export type ChipTone = StatusTone | TagTone | VerdictCode;
export type ChipSize = 'sm' | 'md';

/**
 * A pill chip: optional dot or icon, then text on a tone's token pair, never wrapping. sm is 22 px with caption text and a 14 px
 * icon, md 28 px with meta text and a 16 px icon; an icon in the `icon` slot without its own `size-*` class gets the same size. The text carries the meaning; colour only repeats it. `interactive` makes it a button with a 44 px hit area
 * on coarse pointers.
 */
const props = withDefaults(
  defineProps<{
    tone?: ChipTone;
    size?: ChipSize;
    icon?: Component;
    dot?: boolean;
    interactive?: boolean;
  }>(),
  { tone: 'neutral', size: 'sm', icon: undefined, dot: false, interactive: false },
);

defineOptions({ name: 'UiChip' });

const STATUS_TONES: Record<StatusTone | TagTone, string> = {
  neutral: 'border-line bg-surface-strong text-muted',
  accent: 'border-transparent bg-accent-soft text-accent-soft-text',
  success: 'border-transparent bg-verdict-ac-bg text-verdict-ac',
  danger: 'border-transparent bg-verdict-wa-bg text-verdict-wa',
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
  'relative cursor-pointer transition-colors hover:border-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus pointer-coarse:after:absolute pointer-coarse:after:inset-x-0 pointer-coarse:after:top-1/2 pointer-coarse:after:h-11 pointer-coarse:after:-translate-y-1/2';

const toneClass = computed(() =>
  props.tone in VERDICT_TONES
    ? `border-transparent ${VERDICT_TONE_CLASSES[VERDICT_TONES[props.tone as VerdictCode]]}`
    : STATUS_TONES[props.tone as StatusTone | TagTone],
);
</script>

<template>
  <component
    :is="interactive ? 'button' : 'span'"
    :type="interactive ? 'button' : undefined"
    class="inline-flex max-w-full shrink-0 items-center gap-1 rounded-pill border font-semibold whitespace-nowrap"
    :class="[SIZES[size].box, toneClass, interactive && INTERACTIVE]"
  >
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
</template>
