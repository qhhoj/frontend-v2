<script setup lang="ts">
import { nextTick, ref } from 'vue';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';

interface ProblemTab {
  id: string;
  labelKey: string;
  count?: number;
}
const props = defineProps<{ tabs: ProblemTab[]; modelValue: string; label: string }>();
const emit = defineEmits<{ 'update:modelValue': [id: string] }>();
const locale = useLocaleStore();
const buttons = ref<HTMLButtonElement[]>([]);

/** Left/Right wrap around, Home/End jump; focus follows the selection (automatic activation). */
const targetIndex = (key: string, index: number) => {
  const last = props.tabs.length - 1;
  if (key === 'ArrowRight') return index === last ? 0 : index + 1;
  if (key === 'ArrowLeft') return index === 0 ? last : index - 1;
  if (key === 'Home') return 0;
  if (key === 'End') return last;
  return null;
};
async function onKeydown(event: KeyboardEvent, index: number) {
  const target = targetIndex(event.key, index);
  if (target === null) return;
  event.preventDefault();
  emit('update:modelValue', props.tabs[target]!.id);
  await nextTick();
  buttons.value[target]?.focus();
}
</script>

<template>
  <div role="tablist" :aria-label="label" class="flex flex-wrap gap-2">
    <button
      v-for="(tab, index) in tabs"
      :id="`problem-tab-${tab.id}`"
      :key="tab.id"
      ref="buttons"
      type="button"
      role="tab"
      :aria-selected="tab.id === modelValue"
      :aria-controls="`problem-panel-${tab.id}`"
      :tabindex="tab.id === modelValue ? 0 : -1"
      class="min-h-11 rounded-pill px-5 text-[15px] font-semibold"
      :class="
        tab.id === modelValue
          ? 'bg-accent-soft text-accent-soft-text'
          : 'text-muted hover:bg-surface-hover hover:text-content'
      "
      @click="emit('update:modelValue', tab.id)"
      @keydown="onKeydown($event, index)"
    >
      {{ $t(tab.labelKey)
      }}<span v-if="tab.count !== undefined" class="ml-2 font-mono text-[13px] tabular-nums">{{
        formatNumber(tab.count, locale.locale)
      }}</span>
    </button>
  </div>
</template>
