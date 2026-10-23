import { flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory } from 'vue-router';
import { apiRequest, onCsrfFailed, onGateRequired, onUnauthorized } from '@/api/client';
import { blogListRoutes } from '@/test/community-routes';
import { signedIn } from '@/test/fixtures';
import { fail, mockApi, noContent } from '@/test/mock-api';
import { useSessionStore } from '@/stores/session.store';
import { createAppRouter } from './index';

const waitUntil = (condition: () => boolean) => vi.waitFor(() => expect(condition()).toBe(true));
const NEEDS_SESSION = '/settings';

/** A signed-in viewer on `path`; the server then refuses their next request with 401. */
async function signedInOn(path: string) {
  mockApi({
    ...blogListRoutes,
    'GET /auth/me': signedIn(),
    'POST /submissions/abc/abort': fail(401, 'unauthorized'),
    'POST /auth/logout': noContent(),
  });
  const router = createAppRouter(createMemoryHistory());
  await router.push(path);
  return router;
}

describe('a session lost while a page is open', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    onCsrfFailed(null);
    onUnauthorized(null);
    onGateRequired(null);
  });

  it('sends the viewer to sign-in, with the page as the return URL, when a request is answered 401', async () => {
    const router = await signedInOn(NEEDS_SESSION);
    await apiRequest('/submissions/abc/abort', { method: 'POST' }).catch(() => undefined);
    await waitUntil(() => router.currentRoute.value.name === 'login');
    expect(router.currentRoute.value.query.redirect).toBe(NEEDS_SESSION);
  });

  it('sends the viewer to sign-in when another tab signs out', async () => {
    const router = await signedInOn(NEEDS_SESSION);
    const channel = new BroadcastChannel('qhhoj-session');
    channel.postMessage('signed-out');
    channel.close();
    await waitUntil(() => router.currentRoute.value.name === 'login');
    expect(useSessionStore().status).toBe('anonymous');
    expect(router.currentRoute.value.query.redirect).toBe(NEEDS_SESSION);
  });

  it('leaves a public page where it is', async () => {
    const router = await signedInOn('/blog');
    await apiRequest('/submissions/abc/abort', { method: 'POST' }).catch(() => undefined);
    await flushPromises();
    expect(useSessionStore().status).toBe('anonymous');
    expect(router.currentRoute.value.path).toBe('/blog');
  });

  it('does not treat the viewer own logout as a lost session', async () => {
    const router = await signedInOn(NEEDS_SESSION);
    await useSessionStore().logout();
    await flushPromises();
    expect(useSessionStore().sessionLostCount).toBe(0);
    expect(router.currentRoute.value.path).toBe(NEEDS_SESSION);
  });
});
