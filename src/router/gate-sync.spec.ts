import { flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory } from 'vue-router';
import { apiRequest, onCsrfFailed, onGateRequired, onUnauthorized } from '@/api/client';
import { partialSession, signedIn } from '@/test/fixtures';
import { fail, mockApi } from '@/test/mock-api';
import { blogListRoutes } from '@/test/community-routes';
import type { MockResponse } from '@/test/mock-api';
import { createAppRouter } from './index';

const refuse = (path: string) => apiRequest(path, { method: 'POST' }).catch(() => undefined);

/**
 * A viewer who is signed in on /blog; then the server starts refusing their requests with a gate. `requests` gated
 * requests fly at once. Resolves once the session was asked again and the sync has had time to act.
 */
async function refusedWith(code: string, sessionAfter: () => MockResponse, requests = 1) {
  let gateClosed = false;
  const calls = mockApi({
    ...blogListRoutes,
    'GET /auth/me': () => (gateClosed ? sessionAfter() : signedIn()),
    'POST /submissions/abc/abort': fail(403, code),
  });
  const router = createAppRouter(createMemoryHistory());
  await router.push('/blog');
  // Spied after the page is open: only the gate sync may navigate from here on.
  const replace = vi.spyOn(router, 'replace');
  gateClosed = true;
  await Promise.all(Array.from({ length: requests }, () => refuse('/submissions/abc/abort')));
  // The hook reloads the session; the page behind a new route is a lazy chunk, so wait for the answer, not for a tick.
  await vi.waitFor(() => expect(calls.filter((call) => call.path === '/auth/me')).toHaveLength(2));
  await flushPromises();
  return { router, replace, calls };
}

describe('API-level gates', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    onCsrfFailed(null);
    onUnauthorized(null);
    onGateRequired(null);
  });

  it('moves the viewer to the second-factor page when a request needs it, keeping where they were', async () => {
    const { router } = await refusedWith('two_factor_required', () => signedIn(partialSession()));
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('login-2fa'));
    expect(router.currentRoute.value.query.redirect).toBe('/blog');
  });

  it('moves the viewer to the password change when a request needs it', async () => {
    const { router } = await refusedWith('password_change_required', () =>
      signedIn({ passwordChangeRequired: true }),
    );
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('account-password'));
    expect(router.currentRoute.value.query.redirect).toBe('/blog');
  });

  it('leaves the viewer where they are when the session turns out to be fine', async () => {
    const { router, replace } = await refusedWith('two_factor_required', () => signedIn());
    expect(router.currentRoute.value.name).toBe('blog');
    expect(replace).not.toHaveBeenCalled();
  });

  it('reloads the session once for several gated requests at once', async () => {
    const { replace, calls } = await refusedWith(
      'two_factor_required',
      () => signedIn(partialSession()),
      3,
    );
    await vi.waitFor(() => expect(replace).toHaveBeenCalledTimes(1));
    expect(calls.filter((call) => call.path === '/auth/me')).toHaveLength(2);
  });
});
