import { describe, expect, it, vi } from 'vitest';
import { createRouter, createMemoryHistory } from 'vue-router';
import {
  createStaleChunkReloader,
  installStaleChunkReload,
  isDynamicImportFailure,
} from './stale-chunk-reload';

const memoryStorage = () => {
  const items = new Map<string, string>();
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
  };
};

describe('isDynamicImportFailure', () => {
  it.each([
    'Failed to fetch dynamically imported module: https://x/assets/A-1.js',
    'error loading dynamically imported module: https://x/assets/A-1.js',
    'Importing a module script failed.',
    'Unable to preload CSS for /assets/A-1.css',
  ])('recognises %s', (message) => {
    expect(isDynamicImportFailure(new Error(message))).toBe(true);
  });

  it('ignores other errors and non-errors', () => {
    expect(isDynamicImportFailure(new Error('Network Error'))).toBe(false);
    expect(isDynamicImportFailure('Failed to fetch dynamically imported module')).toBe(false);
  });
});

describe('createStaleChunkReloader', () => {
  it('loads the target once, then refuses it again in the same build', () => {
    const load = vi.fn();
    const storage = memoryStorage();
    expect(createStaleChunkReloader(() => storage, 'abc', load).reload('/orgs')).toBe(true);
    expect(createStaleChunkReloader(() => storage, 'abc', load).reload('/orgs')).toBe(false);
    expect(load).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledWith('/orgs');
  });

  it('allows another target, and the same target from another build', () => {
    const load = vi.fn();
    const storage = memoryStorage();
    createStaleChunkReloader(() => storage, 'abc', load).reload('/orgs');
    expect(createStaleChunkReloader(() => storage, 'abc', load).reload('/problems')).toBe(true);
    expect(createStaleChunkReloader(() => storage, 'def', load).reload('/orgs')).toBe(true);
  });

  it('loads at most once per page life, even for different targets', () => {
    const load = vi.fn();
    const reloader = createStaleChunkReloader(() => memoryStorage(), 'abc', load);
    reloader.reload('/orgs');
    expect(reloader.reload('/problems')).toBe(false);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('does not reload when the attempt cannot be remembered', () => {
    const blocked = () => {
      throw new Error('SecurityError');
    };
    expect(createStaleChunkReloader(blocked, 'abc', vi.fn()).reload('/orgs')).toBe(false);
    const load = vi.fn();
    const broken = {
      getItem: () => null,
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(createStaleChunkReloader(() => broken, 'abc', load).reload('/orgs')).toBe(false);
    expect(load).not.toHaveBeenCalled();
  });
});

describe('installStaleChunkReload', () => {
  const failingRouter = (error: Error) => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { render: () => null } },
        { path: '/orgs', component: () => Promise.reject(error) },
      ],
    });
    return router;
  };

  it('reloads the destination of a navigation whose chunk is gone', async () => {
    const load = vi.fn();
    const router = failingRouter(new Error('Failed to fetch dynamically imported module: /a.js'));
    installStaleChunkReload(
      router,
      createStaleChunkReloader(() => memoryStorage(), 'abc', load),
    );
    await router.push('/orgs?tab=1').catch(() => undefined);
    expect(load).toHaveBeenCalledExactlyOnceWith('/orgs?tab=1');
  });

  it('leaves other navigation errors alone', async () => {
    const load = vi.fn();
    const router = failingRouter(new Error('boom'));
    installStaleChunkReload(
      router,
      createStaleChunkReloader(() => memoryStorage(), 'abc', load),
    );
    await router.push('/orgs').catch(() => undefined);
    expect(load).not.toHaveBeenCalled();
  });

  it('reloads the current page for a preload error outside a navigation, once', async () => {
    vi.useFakeTimers();
    const load = vi.fn();
    const router = failingRouter(new Error('x'));
    installStaleChunkReload(
      router,
      createStaleChunkReloader(() => memoryStorage(), 'abc', load),
    );
    window.dispatchEvent(new Event('vite:preloadError'));
    window.dispatchEvent(new Event('vite:preloadError'));
    await vi.runAllTimersAsync();
    vi.useRealTimers();
    expect(load).toHaveBeenCalledExactlyOnceWith(window.location.href);
  });
});
