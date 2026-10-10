import type { RouteLocationNormalized, RouteLocationRaw, Router } from 'vue-router';

type LazyComponent = () => Promise<unknown>;

/**
 * Starts downloading the lazy page components of a route without waiting for them. The module system caches the import, so
 * the router's own load later reuses it; a failed preload is ignored, the router reports a failure when it loads the page.
 */
export function preloadRouteComponents(route: Pick<RouteLocationNormalized, 'matched'>): void {
  for (const record of route.matched)
    for (const component of Object.values(record.components ?? {}))
      if (typeof component === 'function')
        void (component as LazyComponent)().catch(() => undefined);
}

/** The same for a place the viewer is about to go to (the page after sign-in). */
export function preloadRoute(router: Router, location: RouteLocationRaw): void {
  preloadRouteComponents(router.resolve(location));
}
