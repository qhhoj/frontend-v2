import { readonly, ref } from 'vue';
import type { Router } from 'vue-router';

/** The fields of a `PerformanceNavigationTiming` this check reads. */
export interface NavigationEntryLike {
  redirectCount: number;
  name: string;
}

/** Segment by segment: `decodeURI` would leave `%40` (`@`) and `%2B` (`+`) encoded. */
const decodedPath = (path: string) => path.split('/').map(decodeURIComponent).join('/');
const samePath = (url: string, path: string) =>
  decodedPath(new URL(url).pathname) === decodedPath(path);

/**
 * The document arrived through a same-origin redirect (a `/s/<code>` short link answers 302; cross-origin redirects count 0)
 * and the router is still on that first path, so an in-app move to a 404 never counts.
 */
export function arrivedByRedirect(
  entry: NavigationEntryLike | undefined,
  currentPath: string,
): boolean {
  if (!entry || entry.redirectCount < 1) return false;
  try {
    return samePath(entry.name, currentPath);
  } catch {
    return false;
  }
}

export function firstNavigationEntry(): NavigationEntryLike | undefined {
  if (typeof performance === 'undefined' || typeof performance.getEntriesByType !== 'function')
    return undefined;
  return performance.getEntriesByType('navigation')[0] as NavigationEntryLike | undefined;
}

const isOnFirstPageState = ref(true);
/** False for good once the router completed a second navigation: leaving and returning to the first path is no longer a short-link visit. */
export const isOnFirstPage = readonly(isOnFirstPageState);

/** Watches `router` for the first completed navigation and every one after it. */
export function trackFirstPage(router: Router) {
  isOnFirstPageState.value = true;
  let completed = 0;
  router.afterEach((_to, _from, failure) => {
    if (!failure && ++completed > 1) isOnFirstPageState.value = false;
  });
}
