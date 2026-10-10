<script setup lang="ts">
import { ChevronDown, ChevronUp } from 'lucide-vue-next';
import { ref } from 'vue';
import { useSheetDrag } from './use-sheet-drag';

defineProps<{ isExpanded: boolean; controlsId: string }>();
const emit = defineEmits<{ toggle: []; collapse: [] }>();
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
  </header>
</template>
