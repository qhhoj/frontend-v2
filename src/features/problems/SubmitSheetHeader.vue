<script setup lang="ts">
import { ChevronDown, ChevronUp, Maximize2 } from 'lucide-vue-next';
import { ref } from 'vue';
import AppButton from '@/components/ui/AppButton.vue';
import IconButton from '@/components/ui/IconButton.vue';
import { useSheetDrag } from './use-sheet-drag';
import { FULLSCREEN_TOGGLE_ID } from './use-submit-fullscreen';

defineProps<{ isExpanded: boolean; controlsId: string }>();
const emit = defineEmits<{ toggle: []; collapse: []; fullscreen: [] }>();
const title = ref<HTMLElement | null>(null);
/** The IconButton component; its root element is the button. */
const toggleButton = ref<{ $el: HTMLElement } | null>(null);
/** The collapsed bar: one native button across the whole row. */
const barButton = ref<{ focus: () => void } | null>(null);
const drag = useSheetDrag(() => emit('collapse'));

defineExpose({
  focusTitle: () => title.value?.focus(),
  focusToggle: () => (barButton.value ? barButton.value.focus() : toggleButton.value?.$el.focus()),
});
</script>

<template>
  <header v-if="!isExpanded" class="flex flex-col gap-2 px-4 pt-2 pb-2">
    <!-- The collapsed bar is the phone's primary "Nộp bài": the whole width opens the sheet; the last result (slot `result`) is a line over it. -->
    <div v-if="$slots.result" class="flex min-w-0 items-center gap-2"><slot name="result" /></div>
    <AppButton
      ref="barButton"
      tone="primary"
      size="lg"
      block
      :aria-expanded="false"
      :aria-controls="controlsId"
      @click="emit('toggle')"
    >
      <template #icon><ChevronUp aria-hidden="true" /></template>
      {{ $t('submit.title') }}
    </AppButton>
  </header>
  <header v-else>
    <!-- The drag zone is its own strip: pointer capture on the whole header would swallow the button's click. Dragging only
         collapses, so the collapsed bar has none and stays one 56 px row (M-06). -->
    <div
      class="flex h-6 touch-none items-center justify-center"
      @pointerdown="drag.onPointerdown"
      @pointermove="drag.onPointermove"
      @pointerup="drag.onPointerup"
      @pointercancel="drag.onPointercancel"
    >
      <span aria-hidden="true" class="h-1 w-10 rounded-pill bg-line-strong"></span>
    </div>
    <div class="flex items-center justify-between gap-3 px-4 pb-1">
      <h2 ref="title" tabindex="-1" class="font-display text-base font-bold outline-none">
        {{ $t('submit.title') }}
      </h2>
      <div class="flex items-center gap-2">
        <IconButton
          :id="FULLSCREEN_TOGGLE_ID"
          :label="$t('submit.fullscreen')"
          tone="secondary"
          @click="emit('fullscreen')"
        >
          <Maximize2 class="size-5" aria-hidden="true" />
        </IconButton>
        <IconButton
          ref="toggleButton"
          :aria-expanded="true"
          :aria-controls="controlsId"
          :label="$t('submit.collapse')"
          tone="secondary"
          @click="emit('toggle')"
        >
          <ChevronDown class="size-5" aria-hidden="true" />
        </IconButton>
      </div>
    </div>
  </header>
</template>
