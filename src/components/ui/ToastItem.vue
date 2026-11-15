<script setup lang="ts">
import { CircleAlert, CircleCheck, Info, X } from 'lucide-vue-next';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { translate } from '@/i18n';
import BitMascot from '@/components/BitMascot.vue';
import { BIT_MOODS } from '@/mascot/bit-moods';
import AppButton from './AppButton.vue';
import IconButton from './IconButton.vue';
import StretchedLink from './StretchedLink.vue';
import VerdictChip from './VerdictChip.vue';
import type { Toast } from './toasts';

/**
 * One toast card: tone icon or verdict chip (with Bit on a first solve), the text, Undo, Close. With `to` the whole card is
 * the link. On touch a horizontal swipe past SWIPE_DISMISS_PX closes it; a shorter one snaps back. It reports its height so the
 * stack can lay the cards out when it expands.
 */
const props = defineProps<{ toast: Toast }>();
const emit = defineEmits<{ dismiss: []; undo: []; measure: [height: number] }>();

const ICONS = { success: CircleCheck, danger: CircleAlert, info: Info } as const;
const ICON_TONES = {
  success: 'text-positive',
  danger: 'text-negative',
  info: 'text-info',
} as const;
const SWIPE_DISMISS_PX = 72;
/** A drag shorter than this is a tap, so the link still opens. */
const TAP_SLOP_PX = 8;
const FADE_DISTANCE_PX = 240;

const card = ref<HTMLElement | null>(null);
const dragX = ref(0);
const isDragging = ref(false);
let startX = 0;
let hasMoved = false;

function onPointerDown(event: PointerEvent) {
  if (event.pointerType !== 'touch') return;
  startX = event.clientX;
  hasMoved = false;
  isDragging.value = true;
  card.value?.setPointerCapture(event.pointerId);
}
function onPointerMove(event: PointerEvent) {
  if (!isDragging.value) return;
  dragX.value = event.clientX - startX;
  hasMoved ||= Math.abs(dragX.value) > TAP_SLOP_PX;
}
function onPointerEnd() {
  if (!isDragging.value) return;
  isDragging.value = false;
  const swiped = Math.abs(dragX.value) >= SWIPE_DISMISS_PX;
  dragX.value = 0;
  if (swiped) emit('dismiss');
}
/** A swipe ends with a click on the link under the finger: that is not a visit. */
function onClickCapture(event: MouseEvent) {
  if (!hasMoved) return;
  event.preventDefault();
  event.stopPropagation();
  hasMoved = false;
}

const dragStyle = computed(() => ({
  translate: dragX.value ? `${dragX.value}px` : undefined,
  opacity: dragX.value ? 1 - Math.min(Math.abs(dragX.value) / FADE_DISTANCE_PX, 1) : undefined,
}));

let observer: ResizeObserver | undefined;
onMounted(() => {
  if (!card.value || typeof ResizeObserver === 'undefined') return;
  observer = new ResizeObserver(() => emit('measure', card.value?.offsetHeight ?? 0));
  observer.observe(card.value);
  emit('measure', card.value.offsetHeight);
});
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <div
    ref="card"
    class="flex touch-pan-y items-center gap-2.5 rounded-row border border-line-strong bg-surface-solid py-1.5 pr-1.5 pl-3 text-meta text-content shadow-float"
    :class="{
      'box-link': toast.to,
      'transition-[translate,opacity] duration-(--qh-duration-fast)': !isDragging,
    }"
    :style="dragStyle"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerEnd"
    @pointercancel="onPointerEnd"
    @click.capture="onClickCapture"
  >
    <VerdictChip v-if="props.toast.verdict" :verdict="props.toast.verdict" />
    <component
      :is="ICONS[props.toast.tone]"
      v-else
      aria-hidden="true"
      class="size-4 shrink-0"
      :class="ICON_TONES[props.toast.tone]"
    />
    <BitMascot
      v-if="props.toast.verdict && props.toast.celebrate"
      data-testid="toast-bit"
      :look="BIT_MOODS.crown.look"
      class="bit-pop [--bit-px:2px]"
    />
    <p class="m-0 min-w-0 flex-1 py-1">
      <StretchedLink v-if="props.toast.to" :to="props.toast.to" @click="emit('dismiss')">{{
        props.toast.text
      }}</StretchedLink>
      <template v-else>{{ props.toast.text }}</template>
    </p>
    <AppButton v-if="props.toast.undo" tone="ghost" size="sm" @click="emit('undo')">
      {{ props.toast.undoLabel ?? translate('common.undo') }}
    </AppButton>
    <IconButton size="sm" :label="translate('common.toast.close')" @click="emit('dismiss')">
      <X aria-hidden="true" />
    </IconButton>
  </div>
</template>
