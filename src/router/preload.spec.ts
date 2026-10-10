import { defineComponent } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import { signedOut } from '@/test/fixtures';
import { mockApi } from '@/test/mock-api';
import { preloadRoute } from './preload';

const page = defineComponent({ template: '<p />' });

describe('route preloading', () => {
  beforeEach(() => setActivePinia(createPinia()));

  it('starts a lazy page, and only that one, before anyone navigates there', () => {
    const wanted = vi.fn(() => Promise.resolve(page));
    const other = vi.fn(() => Promise.resolve(page));
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/a', component: wanted },
        { path: '/b', component: other },
      ],
    });
    preloadRoute(router, '/a');
    expect([wanted.mock.calls.length, other.mock.calls.length]).toEqual([1, 0]);
  });

  it('ignores a page that fails to download; the navigation reports it later', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/a', component: () => Promise.reject(new Error('chunk')) }],
    });
    expect(() => preloadRoute(router, '/a')).not.toThrow();
    await Promise.resolve();
  });

  it('the app router starts the page download before it asks for the session', async () => {
    const { createAppRouter } = await import('./index');
    const loaded = vi.fn(() => Promise.resolve(page));
    let downloadsWhenAsked = -1;
    mockApi({
      'GET /auth/me': () => {
        downloadsWhenAsked = loaded.mock.calls.length;
        return signedOut;
      },
    });
    const router = createAppRouter(createMemoryHistory());
    router.addRoute({
      path: '/lazy',
      name: 'lazy',
      component: loaded as () => Promise<typeof page>,
    });
    await router.push('/lazy');
    expect(downloadsWhenAsked).toBe(1);
  });
});
