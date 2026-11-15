<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue';
import { translate } from '@/i18n';
import ToastItem from './ToastItem.vue';
import { dismissToast, holdToasts, releaseToasts, toasts } from './toasts';
import type { Toast } from './toasts';

/**
 * The toast stack: one polite region (a failure is an alert), bottom right, bottom centre on phones. Motion notes 4: a toast
 * rises 12 px on a spring and one leaves with a 4 px fade. Several toasts rest as a short pile (the newest in front, the others
 * peeking above it); hovering or focusing the stack spreads it into a list and pauses every self-close timer until the pointer
 * and focus leave. Texts come from the global `translate`: the host outlives the component that mounted it.
 */
/** Rows between cards and how far an older card peeks above the one in front, in px. */
const GAP_PX = 8;
const PEEK_PX = 8;
const PILE_SCALE_STEP = 0.05;
/** An older card in the pile is cut to this height, so a tall one never shows above the front card. */
const PILE_CARD_MAX = '3rem';

const hasPointer = ref(false);
const hasFocus = ref(false);
const isExpanded = computed(() => hasPointer.value || hasFocus.value);
function setReading(pointer: boolean, focus: boolean) {
  const wasExpanded = isExpanded.value;
  hasPointer.value = pointer;
  hasFocus.value = focus;
  if (isExpanded.value === wasExpanded) return;
  if (isExpanded.value) holdToasts();
  else releaseToasts();
}
const root = ref<HTMLElement | null>(null);
const onFocusOut = (event: FocusEvent) =>
  setReading(hasPointer.value, root.value?.contains(event.relatedTarget as Node | null) ?? false);
// A closed card takes its focus and pointer with it without a focusout or mouseleave: look again after each change.
watch(
  () => toasts.length,
  async (count) => {
    await nextTick();
    const stillFocused = root.value?.contains(document.activeElement) ?? false;
    setReading(count > 0 && hasPointer.value, stillFocused);
  },
);

/** Natural height of each card, reported by the cards; the expanded list needs them to stack. */
const heights = reactive<Record<number, number>>({});

/** How far card `index` sits above the bottom when the stack is a list: the cards in front of it and a gap each. */
function listOffset(index: number): number {
  return toasts.slice(index + 1).reduce((sum, newer) => sum + (heights[newer.id] ?? 0) + GAP_PX, 0);
}

function pileStyle(index: number) {
  const depth = toasts.length - 1 - index;
  if (isExpanded.value) return { transform: `translateY(${-listOffset(index)}px)` };
  return {
    transform: `translateY(${-depth * PEEK_PX}px) scale(${1 - depth * PILE_SCALE_STEP})`,
    maxHeight: depth > 0 ? PILE_CARD_MAX : undefined,
    overflow: depth > 0 ? 'hidden' : undefined,
  };
}

function undo(toast: Toast) {
  dismissToast(toast.id);
  toast.undo?.();
}
</script>

<template>
  <div
    ref="root"
    data-testid="toasts"
    role="status"
    aria-live="polite"
    :aria-label="translate('common.toast.region')"
    class="pointer-events-none fixed inset-x-4 bottom-[calc(max(1rem,env(safe-area-inset-bottom))+var(--tab-bar-height,0px))] z-toast flex justify-center sm:inset-x-auto sm:right-6 sm:bottom-6"
  >
    <TransitionGroup
      tag="ol"
      class="m-0 grid w-full max-w-sm list-none p-0"
      enter-from-class="translate-y-3 opacity-0"
      enter-active-class="transition-[translate,opacity] duration-(--qh-duration) ease-spring"
      leave-active-class="transition-[translate,opacity] duration-(--qh-duration-fast) ease-exit"
      leave-to-class="translate-y-1 opacity-0"
      move-class="transition-transform duration-(--qh-duration) ease-move"
      @mouseenter="setReading(true, hasFocus)"
      @mouseleave="setReading(false, hasFocus)"
      @focusin="setReading(hasPointer, true)"
      @focusout="onFocusOut"
    >
      <li
        v-for="(toast, index) in toasts"
        :key="toast.id"
        :role="toast.tone === 'danger' ? 'alert' : undefined"
        class="pointer-events-auto relative col-start-1 row-start-1 self-end"
        :style="{ zIndex: index }"
      >
        <div
          class="pt-2 transition-transform duration-(--qh-duration) ease-move origin-bottom"
          :style="pileStyle(index)"
        >
          <ToastItem
            :toast="toast"
            @dismiss="dismissToast(toast.id)"
            @undo="undo(toast)"
            @measure="heights[toast.id] = $event"
          />
        </div>
      </li>
    </TransitionGroup>
  </div>
</template>

<style>
/*
 * Toasts stand above a save bar that is on screen (a page bar, or a drawer footer) so its buttons stay
 * clickable. An idle page bar is not rendered, so nothing is raised for it.
 */
body:has([data-save-bar='page'], [data-save-bar='footer']) [data-testid='toasts'] {
  bottom: 5.5rem;
}
</style>
