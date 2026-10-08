import { watch } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import type { RouteLocationNormalized, Router, RouterHistory } from 'vue-router';
import { i18n, translate } from '@/i18n';
import { useLoadingStore } from '@/stores/loading.store';
import { useSessionStore } from '@/stores/session.store';
import { resolveNavigation } from './guards';
import { routes } from './routes';

export function createAppRouter(history: RouterHistory = createWebHistory()): Router {
  const router = createRouter({
    history,
    routes,
    // A query-only change (a tab, a filter) keeps the scroll position.
    scrollBehavior: (to, from, saved) => saved ?? (to.path === from.path ? false : { top: 0 }),
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
    document.title = `${translate(router.currentRoute.value.meta.titleKey ?? 'app.name')} · QHHOJ`;
  };
  router.afterEach(titleDocument);
  watch(() => i18n.global.locale.value, titleDocument);
  return router;
}
