<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import SkeletonBlock from '@/components/SkeletonBlock.vue';

/**
 * The one sideways-scrolling table frame: a focusable, labelled scroller that says so when it clips.
 * While content hides on a side, that edge carries a soft shade; while more hides to the right, a
 * "swipe" line shows above it on screens below `lg`. Nothing shows when the table fits.
 * Wrap a table in this instead of a bare `overflow-x-auto` div. The scroller is `relative` so a `sr-only` (absolute) header
 * cell far to the right is clipped with it instead of widening the page.
 */
defineProps<{
  label: string;
  hint?: string;
  /** No text line: the edge shades alone say it scrolls (admin tables). */
  noHint?: boolean;
  /** A loading skeleton's frame: same layout and cue room as the real one, but inert (no region role, no focus) and the hint a placeholder bar. */
  placeholder?: boolean;
}>();
const scroller = ref<HTMLElement | null>(null);
const hasMoreLeft = ref(false);
const hasMoreRight = ref(false);
/** Sub-pixel rounding leaves up to a pixel of false overflow. */
const SLACK_PX = 1;

function measure() {
  const el = scroller.value;
  if (!el) return;
  hasMoreLeft.value = el.scrollLeft > SLACK_PX;
  hasMoreRight.value = el.scrollWidth - el.clientWidth - el.scrollLeft > SLACK_PX;
}

let observer: ResizeObserver | undefined;
onMounted(() => {
  measure();
  if (typeof ResizeObserver === 'undefined' || !scroller.value) return;
  observer = new ResizeObserver(measure);
  observer.observe(scroller.value);
  if (scroller.value.firstElementChild) observer.observe(scroller.value.firstElementChild);
});
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <div :aria-hidden="placeholder || undefined">
    <p
      v-if="hasMoreRight && !noHint"
      data-testid="scroll-hint"
      aria-hidden="true"
      class="px-5 pt-3 text-meta text-muted lg:hidden"
    >
      <SkeletonBlock v-if="placeholder" text class="w-48" />
      <template v-else>{{ hint ?? $t('common.scrollHint') }}</template>
    </p>
    <div class="relative">
      <div
        ref="scroller"
        :tabindex="placeholder ? undefined : 0"
        :role="placeholder ? undefined : 'region'"
        :aria-label="placeholder ? undefined : label"
        class="relative overflow-x-auto focus-visible:-outline-offset-2"
        @scroll.passive="measure"
      >
        <slot />
      </div>
      <span
        v-if="hasMoreLeft"
        data-testid="scroll-shade-left"
        aria-hidden="true"
        class="pointer-events-none absolute inset-y-0 left-0 w-6 bg-linear-to-r from-content/15 to-transparent"
      />
      <span
        v-if="hasMoreRight"
        data-testid="scroll-shade-right"
        aria-hidden="true"
        class="pointer-events-none absolute inset-y-0 right-0 w-6 bg-linear-to-l from-content/15 to-transparent"
      />
    </div>
  </div>
</template>
