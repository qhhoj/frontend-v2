<script setup lang="ts">
import { computed, toRef } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ContestPhase } from '@/api/types/contests';
import PillTabs, { type PillTab } from '@/components/PillTabs.vue';
import AnnouncementLiveRegion from './AnnouncementLiveRegion.vue';
import { useUnreadAnnouncementCount } from './announcement-seen';
import { useContestQuery } from './contests.queries';

/** `current` names the tab to light up on a page that is not a tab's own route (a problem's best submissions lights `contest`). */
const { t } = useI18n();
const props = defineProps<{ contestKey: string; phase?: ContestPhase; current?: string }>();
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
const unread = useUnreadAnnouncementCount(toRef(props, 'contestKey'));
/** Balloon volunteers and editors of a contest with balloons on get the queue's tab; read from the cached contest answer. */
const { data: contest } = useContestQuery(() => props.contestKey);
const canViewBalloons = computed(() => contest.value?.viewer.canViewBalloons ?? false);
/** The announcements stream runs while the contest can still get announcements; it waits until the phase is known. */
const isStreaming = computed(() => props.phase !== undefined && props.phase !== 'ended');
const tabs = computed<PillTab[]>(() => {
  const own = visibleTabs.value.map((tab) => ({
    key: tab.name,
    label: t(tab.labelKey),
    to: { name: tab.name, params: { key: props.contestKey } },
    isCurrent: tab.name === props.current,
    badge:
      tab.name === 'contest-announcements' && unread.value > 0
        ? {
            text: String(unread.value),
            tone: 'accent' as const,
            srLabel: t('contests.announcements.unread', { count: unread.value }, unread.value),
          }
        : undefined,
  }));
  if (!canViewBalloons.value) return own;
  const balloons = {
    key: 'contest-balloons',
    label: t('balloons.tab'),
    to: { name: 'contest-balloons', params: { key: props.contestKey } },
  };
  return [...own, balloons];
});
</script>

<template>
  <PillTabs :tabs="tabs" :label="t('contests.tabs.label')" />
  <AnnouncementLiveRegion :contest-key="contestKey" :is-streaming="isStreaming" />
</template>
