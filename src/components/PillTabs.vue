<script setup lang="ts">
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import Tabs from './ui/Tabs.vue';
import type { TabItem } from './ui/Tabs.vue';

export interface PillTab {
  key: string;
  label: string;
  to: RouteLocationRaw;
  /** Lights the tab on a page that is not its own route; otherwise the router marks the exact match. */
  isCurrent?: boolean;
  badge?: {
    text: string;
    /** `neutral` is a count; `accent` says something waits for the viewer. */
    tone: 'neutral' | 'accent';
    /** Spoken instead of the bare number. */
    srLabel?: string;
  };
}

/** The public page's section links: `Tabs` in its pill look, scrolling sideways when they do not fit. */
const props = defineProps<{ tabs: PillTab[]; label: string }>();
const items = computed<TabItem[]>(() =>
  props.tabs.map(({ badge, ...tab }) => ({
    ...tab,
    count: badge?.text,
    countLabel: badge?.srLabel,
    countTone: badge?.tone,
    countTestid: 'tab-badge',
  })),
);
</script>

<template>
  <Tabs :items="items" :label="label" overflow="scroll" />
</template>
