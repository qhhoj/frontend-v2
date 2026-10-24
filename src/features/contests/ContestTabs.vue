<script setup lang="ts">
import { Settings } from 'lucide-vue-next';
import { computed, toRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import type { ContestPhase } from '@/api/types/contests';
import PillTabs, { type PillTab } from '@/components/PillTabs.vue';
import {
  contestEditTarget,
  type ContestEditScreen,
} from '@/features/admin/edit-link/admin-edit-targets';
import { useSessionStore } from '@/stores/session.store';
import AnnouncementLiveRegion from './AnnouncementLiveRegion.vue';
import { useUnreadAnnouncementCount } from './announcement-seen';
import { useContestQuery } from './contests.queries';
import { useStreamedContest } from './live/use-streamed-contest';

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
const route = useRoute();
const session = useSessionStore();
/** The editor tab that matches a public contest page: the problem list opens Problems, the board opens Ranking; others General. */
const EDIT_SCREEN_OF_PAGE: Record<string, ContestEditScreen> = {
  contest: 'contestProblems',
  'contest-announcements': 'contestAnnouncements',
  'contest-ranking': 'contestRanking',
};
/** Editors' "Quản lý": the admin editor's tab that matches the page they are on. */
const manageTarget = computed(() =>
  contest.value
    ? contestEditTarget(
        session.user,
        contest.value,
        EDIT_SCREEN_OF_PAGE[props.current ?? String(route.name)],
      )
    : null,
);
/** This page streams announcements while the contest can still get them, unless the app shell streams it (the viewer is in it). */
const streamed = useStreamedContest();
const isStreaming = computed(
  () =>
    props.phase !== undefined &&
    props.phase !== 'ended' &&
    !streamed.isPending.value &&
    streamed.contest.value?.key !== props.contestKey,
);
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
  <div class="flex items-center gap-2">
    <PillTabs class="min-w-0 flex-1" :tabs="tabs" :label="t('contests.tabs.label')" />
    <RouterLink
      v-if="manageTarget"
      :to="manageTarget"
      data-testid="contest-manage-tab"
      class="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-pill border border-dashed border-line-strong px-4 text-sm font-semibold whitespace-nowrap text-muted hover:bg-surface-hover hover:text-content max-sm:px-3"
    >
      <Settings aria-hidden="true" class="size-4" />
      <span class="max-sm:sr-only">{{ t('contests.tabs.manage') }}</span>
    </RouterLink>
  </div>
  <AnnouncementLiveRegion :contest-key="contestKey" :is-streaming="isStreaming" />
</template>
