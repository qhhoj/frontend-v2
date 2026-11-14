import { flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { blogListRoutes } from '@/test/community-routes';
import { mockApi } from '@/test/mock-api';
import { anonymousViewer } from '@/test/problem-routes';
import { mountApp } from '@/test/mount';

describe('nav acknowledgement', () => {
  it('lights the clicked section at once and drops it when the navigation is cancelled', async () => {
    mockApi({ ...blogListRoutes, ...anonymousViewer });
    const { wrapper, router } = await mountApp('/blog');
    const noop = () => undefined;
    let release: (allow: boolean) => void = noop;
    router.beforeEach((to) =>
      to.path === '/problems' ? new Promise<boolean>((resolve) => (release = resolve)) : true,
    );
    const problems = wrapper.get('nav a[href="/problems"]');
    expect(problems.attributes('aria-current')).toBeUndefined();

    await problems.trigger('click');
    expect(problems.attributes('aria-current')).toBe('page');

    await vi.waitFor(() => expect(release).not.toBe(noop));
    release(false);
    await flushPromises();
    expect(problems.attributes('aria-current')).toBeUndefined();
  });
});
