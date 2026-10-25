<script setup lang="ts">
import { computed } from 'vue';
import HighlightedText from '../../search/HighlightedText.vue';
import { PALETTE_GROUPS, paletteOptionId } from './admin-search';
import type { PaletteEntry } from './admin-search';

const props = defineProps<{
  listboxId: string;
  entries: readonly PaletteEntry[];
  activeKey: string | null;
  term: string;
}>();
const emit = defineEmits<{ choose: [entry: PaletteEntry]; hover: [key: string] }>();

const groups = computed(() =>
  PALETTE_GROUPS.map((id) => ({
    id,
    entries: props.entries.filter((entry) => entry.group === id),
  })).filter((group) => group.entries.length > 0),
);
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
        class="px-3 pb-1 text-caption leading-4 font-bold tracking-wide text-muted uppercase"
      >
        {{ $t(`admin.shell.search.groups.${group.id}`) }}
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
        <HighlightedText :text="entry.label" :query="term" class="font-semibold" />
        <span v-if="entry.detail" class="font-mono text-caption leading-4 text-muted">{{
          entry.detail
        }}</span>
      </div>
    </div>
  </div>
</template>
