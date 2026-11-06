import { BookOpen, Building2, House, ListChecks, Medal, Newspaper, Trophy } from 'lucide-vue-next';
import type { Component } from 'vue';
import { useRoute } from 'vue-router';
import { useIsFirstNavigationPending } from '@/router/first-navigation';
import { navSectionOverride } from './nav-section';

export interface NavItem {
  path: string;
  labelKey: string;
  icon: Component;
}

/** The seven public sections, in the order of the desktop bar and of the phone sheet. */
export const NAV_ITEMS: readonly NavItem[] = [
  { path: '/', labelKey: 'nav.home', icon: House },
  { path: '/problems', labelKey: 'nav.problems', icon: BookOpen },
  { path: '/contests', labelKey: 'nav.contests', icon: Trophy },
  { path: '/submissions', labelKey: 'nav.submissions', icon: ListChecks },
  { path: '/users', labelKey: 'nav.users', icon: Medal },
  { path: '/blog', labelKey: 'nav.blog', icon: Newspaper },
  { path: '/organizations', labelKey: 'nav.organizations', icon: Building2 },
];

/**
 * Whether a section is current. It stays current on its sub-pages (`/problems/aplusb` is in Problems), unless the page
 * claims another (`useNavSection`). Before the first navigation lands the route is the start location (`/`): none is.
 */
export function useIsNavCurrent() {
  const route = useRoute();
  const isFirstNavigationPending = useIsFirstNavigationPending();
  return (path: string) => {
    if (isFirstNavigationPending.value) return false;
    if (navSectionOverride.value !== null) return path === navSectionOverride.value;
    return path === '/'
      ? route.path === '/'
      : route.path === path || route.path.startsWith(`${path}/`);
  };
}
