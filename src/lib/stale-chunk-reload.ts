import type { Router } from 'vue-router';

/** Chrome, Firefox and Safari wording of a failed `import()`, plus Vite's own CSS preload failure. */
const DYNAMIC_IMPORT_FAILURE =
  /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Unable to preload CSS/i;

export const isDynamicImportFailure = (error: unknown): boolean =>
  error instanceof Error && DYNAMIC_IMPORT_FAILURE.test(error.message);

export interface StaleChunkReloader {
  /** Loads `target` from the server once per build and target; false when it already did, or cannot remember that it did. */
  reload(target: string): boolean;
}

/**
 * A tab opened before a deploy asks for chunks the new release no longer holds. One full page load of the target
 * fetches the new index.html and its chunks. The attempt is remembered in the storage per build commit and target,
 * so a chunk that stays missing after the reload shows the normal error instead of reloading forever. Without a
 * usable storage nothing can be remembered, so nothing reloads.
 */
export function createStaleChunkReloader(
  getStorage: () => Pick<Storage, 'getItem' | 'setItem'>, // a getter: merely touching sessionStorage throws when site data is blocked
  commit: string,
  load: (target: string) => void,
): StaleChunkReloader {
  let reloading = false;
  return {
    reload(target) {
      if (reloading) return false;
      const key = `stale-chunk-reload:${commit}:${target}`;
      try {
        const storage = getStorage();
        if (storage.getItem(key)) return false;
        storage.setItem(key, '1');
      } catch {
        return false;
      }
      reloading = true;
      load(target);
      return true;
    },
  };
}

/**
 * A failed navigation reloads its destination (the router error carries it). A failed preload outside a navigation
 * reloads the current page; it runs one task later, so the navigation error of the same failure wins.
 */
export function installStaleChunkReload(router: Router, reloader: StaleChunkReloader): void {
  router.onError((error, to) => {
    if (isDynamicImportFailure(error)) reloader.reload(router.resolve(to.fullPath).href);
  });
  window.addEventListener('vite:preloadError', () => {
    setTimeout(() => reloader.reload(window.location.href), 0);
  });
}
