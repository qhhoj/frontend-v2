<script setup lang="ts">
defineProps<{ contestKey: string }>();
const TABS = [
  { name: 'contest', labelKey: 'contests.tabs.problems' },
  { name: 'contest-announcements', labelKey: 'contests.tabs.announcements' },
  { name: 'contest-submissions', labelKey: 'contests.tabs.submissions' },
  { name: 'contest-stats', labelKey: 'contests.tabs.stats' },
  { name: 'contest-ranking', labelKey: 'contests.tabs.ranking' },
] as const;
/** The open tab is the one RouterLink marks `aria-current="page"` (exact match), so no route comparison is needed. */
const LINK =
  'inline-flex min-h-11 items-center gap-2 rounded-pill border border-transparent px-4 text-sm font-medium whitespace-nowrap text-muted hover:bg-surface-hover hover:text-content aria-[current=page]:border-accent aria-[current=page]:bg-accent-soft aria-[current=page]:font-semibold aria-[current=page]:text-accent-soft-text';
</script>

<template>
  <nav :aria-label="$t('contests.tabs.label')" class="flex flex-wrap gap-1">
    <RouterLink
      v-for="tab in TABS"
      :key="tab.name"
      :to="{ name: tab.name, params: { key: contestKey } }"
      :class="LINK"
    >
      {{ $t(tab.labelKey) }}
    </RouterLink>
  </nav>
</template>
