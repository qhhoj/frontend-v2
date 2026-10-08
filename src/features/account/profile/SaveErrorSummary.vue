<script setup lang="ts">
import { ref, useId } from 'vue';
import InlineBit from '@/components/InlineBit.vue';

/** One invalid field: `fieldId` is the control's DOM id, `text` what is wrong with it. */
export interface SummaryItem {
  fieldId: string;
  text: string;
}

defineProps<{ title: string; items: SummaryItem[] }>();
const root = ref<HTMLElement | null>(null);
const titleId = useId();

/** Called by the page after a failed save, so the viewer hears the summary first. */
function focus() {
  root.value?.focus();
}
defineExpose({ focus });

/** The link focuses its control; the fragment alone does not move focus in every browser. */
function focusField(event: MouseEvent, fieldId: string) {
  const control = document.getElementById(fieldId);
  if (!control) return;
  event.preventDefault();
  control.focus();
}
</script>

<template>
  <section
    ref="root"
    role="alert"
    tabindex="-1"
    :aria-labelledby="titleId"
    class="flex items-start gap-2.5 rounded-row bg-verdict-wa-bg px-3.5 py-3 text-sm leading-normal text-verdict-wa"
  >
    <InlineBit kind="sweat" />
    <div class="flex min-w-0 flex-1 flex-col gap-1.5">
      <h3 :id="titleId" class="m-0 text-sm font-semibold">{{ title }}</h3>
      <ul class="m-0 flex list-disc flex-col gap-0.5 ps-5">
        <li v-for="item in items" :key="item.fieldId">
          <a
            :href="`#${item.fieldId}`"
            class="font-semibold underline"
            @click="focusField($event, item.fieldId)"
            >{{ item.text }}</a
          >
        </li>
      </ul>
    </div>
  </section>
</template>
