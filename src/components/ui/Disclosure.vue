<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next';
import { useId } from 'vue';
import Chip from './Chip.vue';

/**
 * Shows or hides a block behind one 44 px line: the label, an optional count and a chevron. `#summary` follows the label (a "set"
 * dot, a short value). The block stays in the DOM while closed so a form inside keeps its values. It opens and closes with a height change
 * (grid rows 0fr to 1fr); closed content is `invisible` and `inert`, so it leaves the tab order and the accessibility tree.
 * Under reduced motion --qh-duration is 0, so the change is instant.
 */
const open = defineModel<boolean>('open', { default: false });
defineProps<{ label: string; count?: number | string | null }>();
defineOptions({ name: 'UiDisclosure' });
const panelId = useId();
</script>

<template>
  <div>
    <button
      type="button"
      class="flex min-h-11 w-full items-center gap-2 rounded-row text-left text-sm font-semibold hover:text-accent-text"
      :aria-expanded="open"
      :aria-controls="panelId"
      @click="open = !open"
    >
      <span class="min-w-0">{{ label }}</span>
      <Chip v-if="count != null" size="sm">{{ count }}</Chip>
      <slot name="summary" />
      <ChevronDown
        aria-hidden="true"
        class="ml-auto size-4 shrink-0 transition-transform duration-(--qh-duration) ease-move"
        :class="open && 'rotate-180'"
      />
    </button>
    <div
      :id="panelId"
      class="grid grid-rows-[0fr] transition-[grid-template-rows,visibility] duration-(--qh-duration) ease-move"
      :class="open ? 'grid-rows-[1fr] visible' : 'invisible'"
      :inert="!open"
    >
      <div class="min-h-0 overflow-hidden">
        <div class="pt-2"><slot /></div>
      </div>
    </div>
  </div>
</template>
