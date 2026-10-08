import { flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory } from 'vue-router';
import { apiRequest, onCsrfFailed, onGateRequired, onUnauthorized } from '@/api/client';
import { partialSession, signedIn } from '@/test/fixtures';
import { fail, mockApi } from '@/test/mock-api';
import type { MockResponse } from '@/test/mock-api';
import { createAppRouter } from './index';

/** A viewer who is signed in on /blog; then the server starts refusing their requests with a gate. Resolves once the session was asked again. */
async function refusedWith(code: string, sessionAfter: () => MockResponse) {
  let gateClosed = false;
  const calls = mockApi({
    'GET /auth/me': () => (gateClosed ? sessionAfter() : signedIn()),
    'POST /submissions/abc/abort': fail(403, code),
  });
  const router = createAppRouter(createMemoryHistory());
  await router.push('/blog');
  gateClosed = true;
  await apiRequest('/submissions/abc/abort', { method: 'POST' }).catch(() => undefined);
  // The hook reloads the session; the page behind a new route is a lazy chunk, so wait for the answer, not for a tick.
  await vi.waitFor(() => expect(calls.filter((call) => call.path === '/auth/me')).toHaveLength(2));
  await flushPromises();
  return router;
}

describe('API-level gates', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    onCsrfFailed(null);
    onUnauthorized(null);
    onGateRequired(null);
  });

  it('moves the viewer to the second-factor page when a request needs it, keeping where they were', async () => {
    const router = await refusedWith('two_factor_required', () => signedIn(partialSession()));
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('login-2fa'));
    expect(router.currentRoute.value.query.redirect).toBe('/blog');
  });

  it('moves the viewer to the password change when a request needs it', async () => {
    const router = await refusedWith('password_change_required', () =>
      signedIn({ passwordChangeRequired: true }),
    );
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('account-password'));
    expect(router.currentRoute.value.query.redirect).toBe('/blog');
  });

  it('leaves the viewer where they are when the session turns out to be fine', async () => {
    const router = await refusedWith('two_factor_required', () => signedIn());
    expect(router.currentRoute.value.name).toBe('blog');
  });
});
