import { defineAsyncComponent } from 'vue';
import type { Component } from 'vue';

export const PROBLEM_TABS = [
  {
    id: 'general',
    routeName: 'admin-problemGeneral',
    labelKey: 'admin.problems.tabs.general',
    leadKey: 'admin.problems.leads.general',
  },
  {
    id: 'statements',
    routeName: 'admin-problemStatements',
    labelKey: 'admin.problems.tabs.statements',
    leadKey: 'admin.problems.leads.statements',
  },
  {
    id: 'editorial',
    routeName: 'admin-problemEditorial',
    labelKey: 'admin.problems.tabs.editorial',
    leadKey: 'admin.problems.leads.editorial',
  },
  {
    id: 'data',
    routeName: 'admin-problemData',
    labelKey: 'admin.problems.tabs.data',
    leadKey: 'admin.problems.leads.data',
  },
  {
    id: 'files',
    routeName: 'admin-problemFiles',
    labelKey: 'admin.problems.tabs.files',
    leadKey: 'admin.problems.leads.files',
  },
] as const;
export type ProblemTabId = (typeof PROBLEM_TABS)[number]['id'];

/** One line per tab; Tasks 5-9 each replace their own `null`. A `null` tab shows the "not built yet" line. */
const TAB_COMPONENTS: Record<ProblemTabId, Component | null> = {
  general: defineAsyncComponent(() => import('./general/ProblemGeneralTab.vue')),
  statements: defineAsyncComponent(() => import('./statements/ProblemStatementsTab.vue')),
  editorial: defineAsyncComponent(() => import('./editorial/ProblemEditorialTab.vue')),
  data: defineAsyncComponent(() => import('./data/ProblemDataTab.vue')),
  files: defineAsyncComponent(() => import('./files/ProblemFilesTab.vue')),
};

export const problemTabOf = (routeName: unknown) =>
  PROBLEM_TABS.find((tab) => tab.routeName === routeName) ?? PROBLEM_TABS[0];
export const problemTabComponent = (id: ProblemTabId) => TAB_COMPONENTS[id];
