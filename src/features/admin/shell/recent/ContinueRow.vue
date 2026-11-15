<script setup lang="ts">
import type { Component } from 'vue';
import Chip from '@/components/ui/Chip.vue';
import type { ChipTone } from '@/components/ui/Chip.vue';

/** One record to come back to: its name, its code and the tab it was last open on, its state as a chip; the whole row is the link. */
defineProps<{
  icon: Component;
  name: string;
  id: string;
  tabTitle: string;
  status: string;
  tone: ChipTone;
  to: string;
}>();
</script>

<template>
  <li>
    <RouterLink
      :to="to"
      class="flex min-h-14 items-center gap-3 px-4 py-2 transition-colors hover:bg-surface-hover"
    >
      <component :is="icon" aria-hidden="true" class="size-4 shrink-0 text-muted" />
      <span class="min-w-0 flex-1">
        <span class="block truncate text-sm font-semibold">{{ name }}</span>
        <span class="block truncate text-caption leading-4 text-muted">
          <span class="font-mono">{{ id }}</span> · {{ tabTitle }}
        </span>
      </span>
      <Chip :tone="tone" size="sm">{{ status }}</Chip>
    </RouterLink>
  </li>
</template>
