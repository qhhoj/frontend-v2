import type { RouteParamsRaw } from 'vue-router';
import type { AdminTab } from './AdminTabs.vue';

/** Tabs that are routes of their own (an editor's sections): each tab's key is its route name. */
export const routeTabs = (
  tabs: readonly { routeName: string; labelKey: string }[],
  params: RouteParamsRaw = {},
): AdminTab[] =>
  tabs.map((tab) => ({
    key: tab.routeName,
    labelKey: tab.labelKey,
    to: { name: tab.routeName, params },
  }));
