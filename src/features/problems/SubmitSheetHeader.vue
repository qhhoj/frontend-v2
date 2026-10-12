<script setup lang="ts">
import { ChevronDown, ChevronUp, Maximize2 } from 'lucide-vue-next';
import { ref } from 'vue';
import { useSheetDrag } from './use-sheet-drag';
import { FULLSCREEN_TOGGLE_ID } from './use-submit-fullscreen';

defineProps<{ isExpanded: boolean; controlsId: string }>();
const emit = defineEmits<{ toggle: []; collapse: []; fullscreen: [] }>();
const title = ref<HTMLElement | null>(null);
const toggleButton = ref<HTMLElement | null>(null);
const drag = useSheetDrag(() => emit('collapse'));

defineExpose({
  focusTitle: () => title.value?.focus(),
  focusToggle: () => toggleButton.value?.focus(),
});
</script>

<template>
  <header>
    <!-- The drag zone is its own strip: pointer capture on the whole header would swallow the button's click. -->
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
        <button
          v-if="isExpanded"
          :id="FULLSCREEN_TOGGLE_ID"
          type="button"
          :aria-label="$t('submit.fullscreen')"
          class="flex size-11 items-center justify-center rounded-pill border border-line bg-surface hover:bg-surface-hover"
          @click="emit('fullscreen')"
        >
          <Maximize2 class="size-5" aria-hidden="true" />
        </button>
        <button
          ref="toggleButton"
          type="button"
          :aria-expanded="isExpanded"
          :aria-controls="controlsId"
          :aria-label="$t(isExpanded ? 'submit.collapse' : 'submit.expand')"
          class="flex size-11 items-center justify-center rounded-pill border border-line bg-surface hover:bg-surface-hover"
          @click="emit('toggle')"
        >
          <ChevronDown v-if="isExpanded" class="size-5" aria-hidden="true" />
          <ChevronUp v-else class="size-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  </header>
</template>
