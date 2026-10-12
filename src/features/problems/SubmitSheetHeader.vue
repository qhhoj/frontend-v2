<script setup lang="ts">
import { ChevronDown, ChevronUp, Maximize2 } from 'lucide-vue-next';
import { ref } from 'vue';
import IconButton from '@/components/ui/IconButton.vue';
import { useSheetDrag } from './use-sheet-drag';
import { FULLSCREEN_TOGGLE_ID } from './use-submit-fullscreen';

defineProps<{ isExpanded: boolean; controlsId: string }>();
const emit = defineEmits<{ toggle: []; collapse: []; fullscreen: [] }>();
const title = ref<HTMLElement | null>(null);
/** The IconButton component; its root element is the button. */
const toggleButton = ref<{ $el: HTMLElement } | null>(null);
const drag = useSheetDrag(() => emit('collapse'));

defineExpose({
  focusTitle: () => title.value?.focus(),
  focusToggle: () => toggleButton.value?.$el.focus(),
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
        <IconButton
          v-if="isExpanded"
          :id="FULLSCREEN_TOGGLE_ID"
          :label="$t('submit.fullscreen')"
          tone="secondary"
          @click="emit('fullscreen')"
        >
          <Maximize2 class="size-5" aria-hidden="true" />
        </IconButton>
        <IconButton
          ref="toggleButton"
          :aria-expanded="isExpanded"
          :aria-controls="controlsId"
          :label="$t(isExpanded ? 'submit.collapse' : 'submit.expand')"
          tone="secondary"
          @click="emit('toggle')"
        >
          <ChevronDown v-if="isExpanded" class="size-5" aria-hidden="true" />
          <ChevronUp v-else class="size-5" aria-hidden="true" />
        </IconButton>
      </div>
    </div>
  </header>
</template>
