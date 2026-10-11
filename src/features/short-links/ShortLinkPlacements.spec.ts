import { flushPromises } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fail, mockApi } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer, problemPageRoutes, signedInViewer } from '@/test/problem-routes';

const redirectedTo = (path: string) =>
  vi
    .spyOn(performance, 'getEntriesByType')
    .mockReturnValue([
      { redirectCount: 1, name: `${location.origin}${path}` } as unknown as PerformanceEntry,
    ]);
afterEach(() => vi.restoreAllMocks());

const BUTTON = '[data-testid="short-link-button"]';

describe('short-link button placements', () => {
  it('sits in the problem header for a signed-in viewer only', async () => {
    mockApi({ ...signedInViewer(), ...problemPageRoutes() });
    const { wrapper } = await mountApp('/problems/duongdi');
    await flushPromises();
    expect(wrapper.find(`[data-testid="header-actions"] ${BUTTON}`).exists()).toBe(true);
  });

  it('is absent for a signed-out viewer', async () => {
    mockApi({ ...anonymousViewer, ...problemPageRoutes() });
    const { wrapper } = await mountApp('/problems/duongdi');
    await flushPromises();
    expect(wrapper.find(BUTTON).exists()).toBe(false);
  });
});

describe('the not-found hint for short-link visitors', () => {
  it('shows on a 404 reached through a redirect', async () => {
    redirectedTo('/problems/secret');
    mockApi({ ...signedInViewer(), 'GET /problems/secret': fail(404, 'not_found') });
    const { wrapper } = await mountApp('/problems/secret');
    await flushPromises();
    expect(wrapper.get('[data-testid="short-link-hint"]').text()).toBe(
      'Bạn có thể không có quyền xem trang này.',
    );
  });

  it('stays hidden on a 404 opened without a redirect', async () => {
    mockApi({ ...signedInViewer(), 'GET /problems/secret': fail(404, 'not_found') });
    const { wrapper } = await mountApp('/problems/secret');
    await flushPromises();
    expect(wrapper.find('[data-testid="short-link-hint"]').exists()).toBe(false);
  });

  it('is gone after an in-app trip away and back to the same path', async () => {
    redirectedTo('/problems/secret');
    mockApi({
      ...signedInViewer(),
      'GET /problems/secret': fail(404, 'not_found'),
      'GET /problems/elsewhere': fail(404, 'not_found'),
    });
    const { wrapper, router } = await mountApp('/problems/secret');
    await flushPromises();
    await router.push('/problems/elsewhere');
    await router.push('/problems/secret');
    await flushPromises();
    expect(wrapper.find('[data-testid="short-link-hint"]').exists()).toBe(false);
  });
});
