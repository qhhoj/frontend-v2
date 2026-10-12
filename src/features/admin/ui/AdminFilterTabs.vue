<script setup lang="ts">
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import SegmentedControl from '@/components/ui/SegmentedControl.vue';
import type { SegmentOption } from '@/components/ui/SegmentedControl.vue';

export interface AdminFilterTab {
  key: string;
  label: string;
  /** A link tab (the view lives in the URL). Without `to` the tab is a button that sets `current` (emits `update:current`). */
  to?: RouteLocationRaw;
  /** A count chip after the label; hidden at 0. */
  count?: number;
  countLabel?: string;
  countTestid?: string;
  /** A red dot after the label, read as this text: the view holds something to fix (a field error). */
  alertLabel?: string;
  testid?: string;
}

/** The segmented control of a list's view or filter: `SegmentedControl` at the admin chip density. */
const props = defineProps<{ tabs: AdminFilterTab[]; current: string; label: string }>();
const emit = defineEmits<{ 'update:current': [key: string] }>();
const options = computed<SegmentOption[]>(() =>
  props.tabs.map(({ key, ...tab }) => ({ ...tab, value: key })),
);
</script>

<template>
  <SegmentedControl
    size="sm"
    :label="label"
    :options="options"
    :model-value="current"
    @update:model-value="(key) => emit('update:current', key)"
  />
</template>
