<script setup lang="ts">
import { ChevronDown, Info, OctagonAlert, TriangleAlert } from 'lucide-vue-next';
import { ref, useId, useSlots } from 'vue';

export type NoticeTone = 'info' | 'caution' | 'danger';

/**
 * A short standing notice: icon, a title and a one-line summary on the tone's tint. A long explanation goes in the default
 * slot, behind "Chi tiết" (a disclosure button). It replaces the multi-paragraph Bit banners; no Bit, no role (it is not news).
 */
withDefaults(defineProps<{ tone?: NoticeTone; title: string; summary?: string }>(), {
  tone: 'info',
  summary: undefined,
});
const slots = useSlots();
const isOpen = ref(false);
const detailsId = useId();

const TONES: Record<NoticeTone, { box: string; icon: string }> = {
  info: { box: 'bg-tag-5-bg', icon: 'text-tag-5' },
  caution: { box: 'bg-verdict-tle-bg', icon: 'text-verdict-tle' },
  danger: { box: 'bg-verdict-wa-bg', icon: 'text-verdict-wa' },
};
const ICONS = { info: Info, caution: TriangleAlert, danger: OctagonAlert } as const;
</script>

<template>
  <div
    class="flex items-start gap-2.5 rounded-cell px-3 py-2.5 text-sm text-content"
    :class="TONES[tone].box"
  >
    <component
      :is="ICONS[tone]"
      aria-hidden="true"
      class="mt-0.5 size-4 shrink-0"
      :class="TONES[tone].icon"
      :stroke-width="1.75"
    />
    <div class="min-w-0 flex-1">
      <p class="m-0 font-semibold">{{ title }}</p>
      <p v-if="summary" class="m-0">{{ summary }}</p>
      <template v-if="slots.default">
        <button
          type="button"
          class="mt-1 inline-flex min-h-6 items-center gap-1 rounded-cell font-semibold underline underline-offset-2"
          :aria-expanded="isOpen"
          :aria-controls="detailsId"
          @click="isOpen = !isOpen"
        >
          {{
            isOpen ? $t('admin.feedback.notice.hideDetails') : $t('admin.feedback.notice.details')
          }}
          <ChevronDown
            aria-hidden="true"
            class="size-4 transition-transform"
            :class="isOpen && 'rotate-180'"
            :stroke-width="1.75"
          />
        </button>
        <div v-show="isOpen" :id="detailsId" class="mt-2 flex flex-col gap-2">
          <slot />
        </div>
      </template>
      <slot name="action" />
    </div>
  </div>
</template>
