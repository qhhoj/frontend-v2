import { watch } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import type { Router, RouterHistory } from 'vue-router';
import { i18n, translate } from '@/i18n';
import { NAVIGATION_SOURCE, useLoadingStore } from '@/stores/loading.store';
import { useSessionStore } from '@/stores/session.store';
import { resolveNavigation } from './guards';
import { routes } from './routes';

export function createAppRouter(history: RouterHistory = createWebHistory()): Router {
  const router = createRouter({
    history,
    routes,
    scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
  });
  router.beforeEach((to) => {
    useLoadingStore().begin(NAVIGATION_SOURCE);
    return resolveNavigation(to, useSessionStore());
  });
  // afterEach also runs for cancelled and redirected navigations; onError covers a failed chunk or a throwing guard.
  const endNavigation = () => useLoadingStore().end(NAVIGATION_SOURCE);
  router.afterEach(endNavigation);
  router.onError(endNavigation);
  const titleDocument = () => {
    document.title = `${translate(router.currentRoute.value.meta.titleKey ?? 'app.name')} · QHHOJ`;
  };
  router.afterEach(titleDocument);
  watch(() => i18n.global.locale.value, titleDocument);
  return router;
}
