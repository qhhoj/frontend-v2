import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMemoryHistory } from 'vue-router';
import { useLoadingStore } from '@/stores/loading.store';
import { mockApi, ok } from '@/test/mock-api';
import { signedOut } from '@/test/fixtures';
import { createAppRouter } from './index';

describe('navigation as a waiting source', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockApi({ 'GET /auth/me': signedOut, 'GET /problems/meta': ok({}) });
  });

  it('waits while a navigation is in flight and stops when it lands', async () => {
    const router = createAppRouter(createMemoryHistory());
    const loading = useLoadingStore();
    let seenDuringNavigation = false;
    router.beforeEach(() => {
      seenDuringNavigation = loading.isWaiting; // runs after the router's own guard
    });
    await router.push('/problems');
    expect(seenDuringNavigation).toBe(true);
    expect(loading.isWaiting).toBe(false);
  });

  it('stops waiting when a guard cancels the navigation', async () => {
    const router = createAppRouter(createMemoryHistory());
    router.beforeEach(() => false);
    await router.push('/problems');
    expect(useLoadingStore().isWaiting).toBe(false);
  });

  it('stops waiting when a navigation throws', async () => {
    const router = createAppRouter(createMemoryHistory());
    router.beforeEach(() => {
      throw new Error('boom');
    });
    await expect(router.push('/problems')).rejects.toThrow('boom');
    expect(useLoadingStore().isWaiting).toBe(false);
  });
});
