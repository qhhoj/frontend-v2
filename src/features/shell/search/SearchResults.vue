<script setup lang="ts">
import { paletteOptionId } from '@/lib/palette-list';
import type { SearchEntry, SearchGroupId } from './site-search';

export interface SearchGroup {
  id: SearchGroupId;
  label: string;
  entries: SearchEntry[];
}

/** The palette's grouped listbox; the combobox in `CommandPalette` keeps the focus and the active option. */
defineProps<{ listboxId: string; groups: readonly SearchGroup[]; activeKey: string | null }>();
const emit = defineEmits<{ choose: [entry: SearchEntry]; hover: [key: string] }>();
</script>

<template>
  <div :id="listboxId" role="listbox" class="flex flex-col gap-3">
    <div
      v-for="group in groups"
      :key="group.id"
      role="group"
      :aria-labelledby="`${listboxId}-${group.id}`"
      class="flex flex-col"
    >
      <span
        :id="`${listboxId}-${group.id}`"
        class="px-3 pb-1 text-caption leading-4 font-semibold text-muted"
      >
        {{ group.label }}
      </span>
      <div
        v-for="entry in group.entries"
        :id="paletteOptionId(listboxId, entry.key)"
        :key="entry.key"
        role="option"
        :aria-selected="entry.key === activeKey"
        class="flex min-h-11 cursor-pointer flex-col justify-center rounded-row px-3 py-1.5 aria-selected:bg-accent-soft aria-selected:text-accent-soft-text"
        @mousedown.prevent
        @mousemove="emit('hover', entry.key)"
        @click="emit('choose', entry)"
      >
        <span class="font-semibold">{{ entry.label }}</span>
        <span v-if="entry.detail" class="font-mono text-caption leading-4 text-muted">{{
          entry.detail
        }}</span>
      </div>
    </div>
  </div>
</template>
