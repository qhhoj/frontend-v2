<script setup lang="ts">
import type { SwitcherEntry, SwitcherStatus } from './problem-switcher';

/** M5B: the contest's problems beside the statement, while the viewer's participation holds this one. The page decides when it is ready (`useProblemRail`). */
defineProps<{ contestKey: string; contestName: string; entries: SwitcherEntry[] }>();
const STATUS_CLASSES: Record<SwitcherStatus, string> = {
  solved: 'text-verdict-ac',
  tried: 'text-verdict-wa',
  untried: 'text-muted',
  unknown: 'text-muted',
};
const LINK =
  'flex min-h-11 items-center gap-3 rounded-row px-3 py-2 hover:bg-surface-hover aria-[current=page]:bg-accent-soft aria-[current=page]:text-accent-soft-text';
</script>

<template>
  <nav
    data-testid="problem-switcher"
    :aria-label="$t('problemSwitcher.title')"
    class="glass min-w-0 rounded-panel p-2 lg:sticky lg:top-20"
  >
    <RouterLink
      :to="{ name: 'contest', params: { key: contestKey } }"
      class="flex min-h-11 items-center px-3 font-display text-sm font-semibold hover:text-accent-text"
      >{{ contestName }}</RouterLink
    >
    <ul class="m-0 flex list-none gap-1 overflow-x-auto p-0 lg:flex-col lg:overflow-visible">
      <li v-for="entry in entries" :key="entry.code" class="shrink-0">
        <RouterLink
          :to="{ name: 'problem', params: { code: entry.code } }"
          :aria-current="entry.isCurrent ? 'page' : undefined"
          :class="LINK"
        >
          <span class="font-display text-lg font-bold">{{ entry.label }}</span>
          <span class="flex min-w-0 flex-col">
            <span class="max-w-40 truncate font-semibold lg:max-w-none lg:whitespace-normal">{{
              entry.name
            }}</span>
            <span :class="['text-caption', STATUS_CLASSES[entry.status]]">{{
              $t(`problemSwitcher.status.${entry.status}`)
            }}</span>
          </span>
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>
