<script setup lang="ts">
import { useRoute } from 'vue-router';

defineProps<{ contestKey: string }>();
const route = useRoute();
const TABS = [
  { name: 'contest', labelKey: 'contests.tabs.problems' },
  { name: 'contest-announcements', labelKey: 'contests.tabs.announcements' },
  { name: 'contest-submissions', labelKey: 'contests.tabs.submissions' },
  { name: 'contest-stats', labelKey: 'contests.tabs.stats' },
  { name: 'contest-ranking', labelKey: 'contests.tabs.ranking' },
] as const;
const LINK = 'inline-flex min-h-11 items-center gap-2 rounded-pill px-4 whitespace-nowrap';
</script>

<template>
  <nav
    :aria-label="$t('contests.tabs.label')"
    class="glass flex w-fit max-w-full gap-0.5 overflow-x-auto rounded-pill p-1"
  >
    <RouterLink
      v-for="tab in TABS"
      :key="tab.name"
      :to="{ name: tab.name, params: { key: contestKey } }"
      :class="[
        LINK,
        route.name === tab.name
          ? 'bg-surface-hover font-semibold'
          : 'text-muted hover:text-content',
      ]"
    >
      {{ $t(tab.labelKey) }}
    </RouterLink>
  </nav>
</template>
