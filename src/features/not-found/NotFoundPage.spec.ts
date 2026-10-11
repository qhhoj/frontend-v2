import { flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { signedOut } from '@/test/fixtures';
import { fail, mockApi } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { signedInViewer } from '@/test/problem-routes';

/** The short-link redirect is a real HTTP redirect: the page sees it only in the navigation timing entry. */
const redirectedTo = (path: string) =>
  vi
    .spyOn(performance, 'getEntriesByType')
    .mockReturnValue([
      { redirectCount: 1, name: `${location.origin}${path}` } as unknown as PerformanceEntry,
    ]);

describe('not found page', () => {
  it('shows the requested path as text, never as markup', async () => {
    mockApi({
      'GET /auth/me': signedOut,
      'GET /pages/a%26amp%3Bb': fail(404, 'not_found'),
    });
    const { wrapper } = await mountApp('/a&amp;b');
    const shown = wrapper.get('[data-testid="requested-path"]').element;
    expect(shown.children).toHaveLength(0);
    expect(shown.textContent?.trim()).toBe('/a&amp;b'); // markup would decode the entity to '&'
    expect(shown.innerHTML).toContain('&amp;amp;'); // and the text is escaped on the way out
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
