import { defineAsyncComponent } from 'vue';
import type { Component } from 'vue';

export type ContestTabId =
  'general' | 'problems' | 'announcements' | 'ranking' | 'actions' | 'participants';
export interface ContestTab {
  id: ContestTabId;
  routeName: string;
  labelKey: string;
  leadKey: string;
}

/** The editor's tabs, in the board's order. Tasks 12 to 16 each fill one `TAB_COMPONENTS` entry (the tab's route is already in admin-routes). */
export const CONTEST_TABS: ContestTab[] = [
  {
    id: 'general',
    routeName: 'admin-contestGeneral',
    labelKey: 'admin.contests.tabs.general',
    leadKey: 'admin.contests.leads.general',
  },
  {
    id: 'problems',
    routeName: 'admin-contestProblems',
    labelKey: 'admin.contests.tabs.problems',
    leadKey: 'admin.contests.leads.problems',
  },
  {
    id: 'announcements',
    routeName: 'admin-contestAnnouncements',
    labelKey: 'admin.contests.tabs.announcements',
    leadKey: 'admin.contests.leads.announcements',
  },
  {
    id: 'ranking',
    routeName: 'admin-contestRanking',
    labelKey: 'admin.contests.tabs.ranking',
    leadKey: 'admin.contests.leads.ranking',
  },
  {
    id: 'actions',
    routeName: 'admin-contestActions',
    labelKey: 'admin.contests.tabs.actions',
    leadKey: 'admin.contests.leads.actions',
  },
  {
    id: 'participants',
    routeName: 'admin-contestParticipants',
    labelKey: 'admin.contests.tabs.participants',
    leadKey: 'admin.contests.leads.participants',
  },
];

const TAB_COMPONENTS: Record<ContestTabId, Component | null> = {
  general: defineAsyncComponent(() => import('./general/ContestGeneralTab.vue')),
  problems: defineAsyncComponent(() => import('./problems/ContestProblemsTab.vue')),
  announcements: defineAsyncComponent(() => import('./announcements/ContestAnnouncementsTab.vue')),
  ranking: defineAsyncComponent(() => import('./ranking/ContestRankingTab.vue')),
  actions: defineAsyncComponent(() => import('./actions/ContestActionsTab.vue')),
  participants: defineAsyncComponent(() => import('./participants/ContestParticipantsTab.vue')),
};

/** The tab a route name belongs to, or null for a route that is not one of the editor's tabs. */
export function contestTabOf(routeName: unknown): ContestTabId | null {
  return CONTEST_TABS.find((tab) => tab.routeName === routeName)?.id ?? null;
}

export function contestTabComponent(id: ContestTabId): Component | null {
  return TAB_COMPONENTS[id];
}
