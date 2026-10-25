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
import { takeSocialReturn } from '@/features/auth/social-return';
import { focusMain } from './focus-main';
import { resolveNavigation } from './guards';
import { trackFirstPage } from '@/lib/arrived-by-redirect';
import { pageTitle } from './page-title';
import { preloadRouteComponents } from './preload';
import { routes } from './routes';

/** Back/forward restores the saved position; a hash scrolls to its element; a query-only change (a tab, a filter) keeps the position; a new page starts at the top. */
export const scrollOnNavigation: RouterScrollBehavior = (to, from, saved) => {
  if (saved) return saved;
  if (to.hash) return { el: to.hash };
  return to.path === from.path ? false : { top: 0 };
};

/** Another path is a new page: focus must not stay on a control of the old one (it is gone, and focus falls to the body). The first load and query-only changes (tabs, filters, the sheet) keep their own focus handling. */
export const isNewPage = (to: RouteLocationNormalized, from: RouteLocationNormalized) =>
  from !== START_LOCATION && to.path !== from.path;

/**
 * One loading source per navigation, shared along a redirect chain: a redirect starts a new navigation and never
 * reaches afterEach for the original, while a cancelled slow navigation must not end the source of the one that
 * replaced it.
 */
function installNavigationLoading(router: Router) {
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
    useLoadingStore().beginPage(source);
    // The page's code downloads while the session loads, not after it.
    preloadRouteComponents(to);
    return resolveNavigation(to, useSessionStore());
  });
  // afterEach also runs for cancelled and duplicate navigations; onError covers a failed chunk or a throwing guard.
  router.afterEach(endNavigation);
  router.onError((_error, to) => endNavigation(to));
}

/**
 * A request refused with a gate (a second factor required, or a password change: set on another device, or by a
 * breach check during this session): reload the session and apply the navigation rules to where the viewer is, as
 * a navigation there would. Several refused requests at once share one reload.
 */
function installGateSync(router: Router) {
  const reloadAndApplyRules = async () => {
    const session = useSessionStore();
    await session.refresh().catch(() => undefined);
    const target = await resolveNavigation(router.currentRoute.value, session);
    if (target !== true) await router.replace(target);
  };
  let syncing: Promise<void> | null = null;
  const syncToGate = () => {
    syncing ??= reloadAndApplyRules().finally(() => (syncing = null));
    return syncing;
  };
  onGateRequired(() => void syncToGate());
}

/**
 * The session ended without the viewer asking (expired, or signed out in another tab): apply the navigation rules to the
 * page they are on, so a page that needs a session sends them to sign-in and brings them back (`redirect`) afterwards.
 */
export function installLostSessionRedirect(router: Router) {
  let watching = false;
  // The store needs the app's pinia, which exists only once the first navigation starts.
  router.beforeEach(() => {
    if (watching) return;
    watching = true;
    const session = useSessionStore();
    watch(
      () => session.sessionLostCount,
      async () => {
        const target = await resolveNavigation(router.currentRoute.value, session);
        if (target !== true) await router.replace(target);
      },
    );
  });
}

/**
 * A social sign-in lands on `/` signed in: go on to the page the viewer came from (kept by `rememberSocialReturn`).
 * It runs after the session guard, so the session is loaded; a landing on `/` signed out or by any other route keeps the note for its page.
 */
function installSocialReturn(router: Router) {
  router.beforeEach((to) => {
    if (to.path !== '/' || useSessionStore().status !== 'authenticated') return true;
    return takeSocialReturn() ?? true;
  });
}

export function createAppRouter(history: RouterHistory = createWebHistory()): Router {
  const router = createRouter({ history, routes, scrollBehavior: scrollOnNavigation });
  installNavigationLoading(router);
  installGateSync(router);
  installLostSessionRedirect(router);
  installSocialReturn(router);
  trackFirstPage(router);
  const titleDocument = () => {
    if (typeof document === 'undefined') return; // hook can fire after the DOM is torn down
    const title =
      pageTitle.value ?? translate(router.currentRoute.value.meta.titleKey ?? 'app.name');
    document.title = `${title} · QHHOJ`;
  };
  router.afterEach((to, from, failure) => {
    if (!failure && isNewPage(to, from)) focusMain();
  });
  router.afterEach(titleDocument);
  watch([() => i18n.global.locale.value, pageTitle], titleDocument);
  return router;
}
