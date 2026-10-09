import { flushPromises } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { organizationDetail, postDetail } from '@/test/community-fixtures';
import { organizationRoutes, postRoutes, profileRoutes } from '@/test/community-routes';
import { contestPageRoutes } from '@/test/contest-routes';
import { userPage } from '@/test/fixtures';
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

  it('sits in the contest header', async () => {
    mockApi({ ...signedInViewer(), ...contestPageRoutes() });
    const { wrapper } = await mountApp('/contests/r42');
    await flushPromises();
    expect(wrapper.find(`[data-testid="contest-header"] ${BUTTON}`).exists()).toBe(true);
  });

  it('sits in the post actions and the organization header', async () => {
    mockApi({ ...signedInViewer(), ...postRoutes() });
    const post = await mountApp(`/blog/${postDetail().id}`);
    await flushPromises();
    expect(post.wrapper.find(`[data-testid="post-actions"] ${BUTTON}`).exists()).toBe(true);
    post.wrapper.unmount();

    mockApi({ ...signedInViewer(), ...organizationRoutes() });
    const organization = await mountApp(`/organizations/${organizationDetail().slug}`);
    await flushPromises();
    expect(
      organization.wrapper.find(`[data-testid="organization-header"] ${BUTTON}`).exists(),
    ).toBe(true);
  });
});

describe('the profile header', () => {
  it('carries the button for a plain viewer of another profile, and no ban action', async () => {
    mockApi({ ...signedInViewer(), ...profileRoutes(userPage({ username: 'ngoc_anh' })) });
    const { wrapper } = await mountApp('/users/ngoc_anh');
    await flushPromises();
    const header = wrapper.get('[data-testid="profile-header"]');
    expect(header.find(BUTTON).exists()).toBe(true);
    expect(header.find('[data-testid="ban-open"]').exists()).toBe(false);
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

  it('shows in the contest 404 too', async () => {
    redirectedTo('/contests/hidden');
    mockApi({
      ...signedInViewer(),
      'GET /contests/hidden': fail(404, 'not_found'),
      'GET /contests/hidden/announcements': fail(404, 'not_found'),
    });
    const { wrapper } = await mountApp('/contests/hidden');
    await flushPromises();
    expect(wrapper.find('[data-testid="short-link-hint"]').exists()).toBe(true);
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
