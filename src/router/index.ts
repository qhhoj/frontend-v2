import { watch } from 'vue';
import { START_LOCATION, createRouter, createWebHistory } from 'vue-router';
import type {
  RouteLocationNormalized,
  Router,
  RouterHistory,
  RouterScrollBehavior,
} from 'vue-router';
import { onGateRequired } from '@/api/client';
import { i18n, translate } from '@/i18n';
import { useLoadingStore } from '@/stores/loading.store';
import { useSessionStore } from '@/stores/session.store';
import { focusMain } from './focus-main';
import { resolveNavigation } from './guards';
import { pageTitle } from './page-title';
import { routes } from './routes';

/** Back/forward restores the saved position; a query-only change (a tab, a filter) keeps it; a new page starts at the top. */
export const scrollOnNavigation: RouterScrollBehavior = (to, from, saved) =>
  saved ?? (to.path === from.path ? false : { top: 0 });

/** Another path is a new page: focus must not stay on a control of the old one (it is gone, and focus falls to the body). The first load and query-only changes (tabs, filters, the sheet) keep their own focus handling. */
export const isNewPage = (to: RouteLocationNormalized, from: RouteLocationNormalized) =>
  from !== START_LOCATION && to.path !== from.path;

export function createAppRouter(history: RouterHistory = createWebHistory()): Router {
  const router = createRouter({
    history,
    routes,
    scrollBehavior: scrollOnNavigation,
  });
  // One source per navigation, shared along a redirect chain: a redirect starts a new navigation and never reaches
  // afterEach for the original, while a cancelled slow navigation must not end the source of the one that replaced it.
  const navigationSources = new WeakMap<object, symbol>();
  const sourceOf = (to: RouteLocationNormalized) =>
    navigationSources.get(to) ?? (to.redirectedFrom && navigationSources.get(to.redirectedFrom));
  const endNavigation = (to: RouteLocationNormalized) => {
    const source = sourceOf(to);
    if (source) useLoadingStore().end(source);
  };
  router.beforeEach((to) => {
    const source = sourceOf(to) || Symbol('navigation');
    navigationSources.set(to, source);
    useLoadingStore().begin(source);
    return resolveNavigation(to, useSessionStore());
  });
  // afterEach also runs for cancelled and duplicate navigations; onError covers a failed chunk or a throwing guard.
  router.afterEach(endNavigation);
  router.onError((_error, to) => endNavigation(to));
  const titleDocument = () => {
    const title =
      pageTitle.value ?? translate(router.currentRoute.value.meta.titleKey ?? 'app.name');
    document.title = `${title} · QHHOJ`;
  };
  router.afterEach((to, from, failure) => {
    if (!failure && isNewPage(to, from)) focusMain();
  });
  router.afterEach(titleDocument);
  /**
   * A request refused with a gate (another tab signed in as an account that needs a second factor): reload the
   * session and apply the navigation rules to where the viewer is, as a navigation there would.
   */
  const syncToGate = async () => {
    const session = useSessionStore();
    await session.refresh().catch(() => undefined);
    const target = await resolveNavigation(router.currentRoute.value, session);
    if (target !== true) await router.replace(target);
  };
  onGateRequired(() => void syncToGate());
  watch([() => i18n.global.locale.value, pageTitle], titleDocument);
  return router;
}
