import { createRouter, createWebHistory } from 'vue-router';
import type { Router, RouterHistory } from 'vue-router';
import { translate } from '@/i18n';
import { useSessionStore } from '@/stores/session.store';
import { resolveNavigation } from './guards';
import { routes } from './routes';

export function createAppRouter(history: RouterHistory = createWebHistory()): Router {
  const router = createRouter({
    history,
    routes,
    scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
  });
  router.beforeEach((to) => resolveNavigation(to, useSessionStore()));
  router.afterEach((to) => {
    document.title = `${translate(to.meta.titleKey ?? 'app.name')} · QHHOJ`;
  });
  return router;
}
