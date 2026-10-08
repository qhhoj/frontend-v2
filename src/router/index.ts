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
    scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
  });
  // One source per navigation, so a cancelled slow one never ends the source of the navigation that replaced it.
  const navigationSources = new WeakMap<RouteLocationNormalized, symbol>();
  const endNavigation = (to: RouteLocationNormalized) => {
    const source = navigationSources.get(to);
    if (source) useLoadingStore().end(source);
  };
  router.beforeEach(async (to) => {
    const source = Symbol('navigation');
    navigationSources.set(to, source);
    useLoadingStore().begin(source);
    const verdict = await resolveNavigation(to, useSessionStore());
    // A redirect starts a new navigation with its own source and never reaches afterEach for this one.
    if (verdict !== true) endNavigation(to);
    return verdict;
  });
  // afterEach also runs for cancelled navigations; onError covers a failed chunk or a throwing guard.
  router.afterEach(endNavigation);
  router.onError((_error, to) => endNavigation(to));
  const titleDocument = () => {
    document.title = `${translate(router.currentRoute.value.meta.titleKey ?? 'app.name')} · QHHOJ`;
  };
  router.afterEach(titleDocument);
  watch(() => i18n.global.locale.value, titleDocument);
  return router;
}
