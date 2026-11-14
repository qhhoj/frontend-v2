import {
  Building2,
  ChartColumn,
  House,
  ListChecks,
  Newspaper,
  Send,
  Trophy,
} from 'lucide-vue-next';
import type { Component } from 'vue';
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { RouteLocationNormalized } from 'vue-router';
import { preloadRoute } from '@/router/preload';
import { useIsFirstNavigationPending } from '@/router/first-navigation';
import { navSectionOverride } from './nav-section';

export interface NavItem {
  path: string;
  labelKey: string;
  icon: Component;
}

/** The seven public sections, in the order of the rail and of the phone sheet (the tab bar keeps the first four). */
export const NAV_ITEMS: readonly NavItem[] = [
  { path: '/', labelKey: 'nav.home', icon: House },
  { path: '/problems', labelKey: 'nav.problems', icon: ListChecks },
  { path: '/contests', labelKey: 'nav.contests', icon: Trophy },
  { path: '/submissions', labelKey: 'nav.submissions', icon: Send },
  { path: '/users', labelKey: 'nav.users', icon: ChartColumn },
  { path: '/blog', labelKey: 'nav.blog', icon: Newspaper },
  { path: '/organizations', labelKey: 'nav.organizations', icon: Building2 },
];

/** The section the viewer just asked for; it is lit at once while the page behind it loads. Null when none is pending. */
const pendingPath = ref<string | null>(null);

/** Called when a navigation ends, however it ends (landed, cancelled, failed): the real route is then the truth. */
export const clearPendingNav = () => {
  pendingPath.value = null;
};

const isSameLocation = (route: RouteLocationNormalized, path: string) => route.fullPath === path;

const isInSection = (path: string, routePath: string) =>
  path === '/' ? routePath === '/' : routePath === path || routePath.startsWith(`${path}/`);

/**
 * Whether a section is current. It stays current on its sub-pages (`/problems/aplusb` is in Problems), unless the page
 * claims another (`useNavSection`). Between a click and the page landing, the clicked section is current. Before the
 * first navigation lands the route is the start location (`/`): none is.
 */
export function useIsNavCurrent() {
  const route = useRoute();
  const isFirstNavigationPending = useIsFirstNavigationPending();
  return (path: string) => {
    if (pendingPath.value !== null) return path === pendingPath.value;
    if (isFirstNavigationPending.value) return false;
    if (navSectionOverride.value !== null) return path === navSectionOverride.value;
    return isInSection(path, route.path);
  };
}

/**
 * Events for a nav link. Pressing the pointer starts downloading the page, ahead of the click's navigation; the click
 * lights the section at once. A modified click (new tab) navigates nowhere here, so it marks nothing.
 */
export function useNavLinkEvents() {
  const router = useRouter();
  const route = useRoute();
  return (path: string) => ({
    pointerdown: () => preloadRoute(router, path),
    click: (event: MouseEvent) => {
      const opensHere =
        !(event.button > 0) && !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey);
      if (opensHere && !isSameLocation(route, path)) pendingPath.value = path;
    },
  });
}

/**
 * The section of the page on screen (its claim through `useNavSection`, else its path), or null outside the seven. Unlike
 * `useIsNavCurrent` it ignores a pending click: the top bar's crumbs name the page that is shown.
 */
export function useCurrentSection() {
  const route = useRoute();
  return computed(() => {
    const claimed = navSectionOverride.value;
    return (
      NAV_ITEMS.find((item) =>
        claimed === null ? isInSection(item.path, route.path) : item.path === claimed,
      ) ?? null
    );
  });
}
