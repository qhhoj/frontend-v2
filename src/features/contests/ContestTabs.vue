<script setup lang="ts">
import { computed, toRef } from 'vue';
import type { ContestPhase } from '@/api/types/contests';
import AnnouncementLiveRegion from './AnnouncementLiveRegion.vue';
import { useUnreadAnnouncementCount } from './announcement-seen';

const props = defineProps<{ contestKey: string; phase?: ContestPhase }>();
interface ContestTab {
  name: string;
  labelKey: string;
  /** Shown only once the contest has ended (the replay answers 409 before). */
  isEndedOnly?: boolean;
}
const TABS: ContestTab[] = [
  { name: 'contest', labelKey: 'contests.tabs.problems' },
  { name: 'contest-announcements', labelKey: 'contests.tabs.announcements' },
  { name: 'contest-submissions', labelKey: 'contests.tabs.submissions' },
  { name: 'contest-stats', labelKey: 'contests.tabs.stats' },
  { name: 'contest-ranking', labelKey: 'contests.tabs.ranking' },
  { name: 'contest-replay', labelKey: 'contests.tabs.replay', isEndedOnly: true },
];
const visibleTabs = computed(() =>
  TABS.filter((tab) => !tab.isEndedOnly || props.phase === 'ended'),
);
/** The open tab is the one RouterLink marks `aria-current="page"` (exact match), so no route comparison is needed. */
const LINK =
  'inline-flex min-h-11 items-center gap-2 rounded-pill border border-transparent px-4 text-sm font-medium whitespace-nowrap text-muted hover:bg-surface-hover hover:text-content aria-[current=page]:border-accent aria-[current=page]:bg-accent-soft aria-[current=page]:font-semibold aria-[current=page]:text-accent-soft-text';
const unread = useUnreadAnnouncementCount(toRef(props, 'contestKey'));
/** The announcements stream runs while the contest can still get announcements; it waits until the phase is known. */
const isStreaming = computed(() => props.phase !== undefined && props.phase !== 'ended');
</script>

<template>
  <nav :aria-label="$t('contests.tabs.label')" class="flex flex-wrap gap-1">
    <RouterLink
      v-for="tab in visibleTabs"
      :key="tab.name"
      :to="{ name: tab.name, params: { key: contestKey } }"
      :class="LINK"
    >
      {{ $t(tab.labelKey) }}
      <span
        v-if="tab.name === 'contest-announcements' && unread > 0"
        class="inline-flex min-w-5 items-center justify-center rounded-pill bg-accent px-1.5 text-[11px] font-semibold text-on-accent"
      >
        <span aria-hidden="true">{{ unread }}</span>
        <span class="sr-only">{{
          $t('contests.announcements.unread', { count: unread }, unread)
        }}</span>
      </span>
    </RouterLink>
  </nav>
  <AnnouncementLiveRegion :contest-key="contestKey" :is-streaming="isStreaming" />
</template>
