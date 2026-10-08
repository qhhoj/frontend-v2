import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { joinRequest, organizationDetail } from '@/test/community-fixtures';
import { organizationRoutes } from '@/test/community-routes';
import { fail, mockApi, noContent, ok, sequence } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer, signedInViewer } from '@/test/problem-routes';

const hcmus = (viewer: object | null, extra: object = {}) =>
  organizationDetail({
    slug: 'hcmus',
    shortName: 'HCMUS',
    name: 'Đội tuyển HCMUS',
    isOpen: false,
    slots: 60,
    memberCount: 48,
    viewer: viewer as never,
    ...extra,
  });

describe('membership panel', () => {
  it('asks a guest to sign in and comes back to the organization', async () => {
    mockApi({ ...anonymousViewer, ...organizationRoutes(hcmus(null)) });
    const { wrapper } = await mountApp('/organizations/hcmus');
    expect(wrapper.get('[data-testid="membership-panel"] a').attributes('href')).toBe(
      '/login?redirect=/organizations/hcmus',
    );
  });
});

describe('membership panel: joining and leaving', () => {
  it('joins an open organization and refreshes it', async () => {
    const lhp = organizationDetail({
      viewer: { isMember: false, canAdminister: false, pendingRequestId: null },
    });
    const calls = mockApi({
      ...signedInViewer(),
      ...organizationRoutes(lhp),
      'GET /organizations/lhp': sequence(
        ok(lhp),
        ok({ ...lhp, viewer: { isMember: true, canAdminister: false, pendingRequestId: null } }),
      ),
      'POST /organizations/lhp/join': noContent(),
    });
    const { wrapper } = await mountApp('/organizations/lhp');
    await wrapper.get('[data-testid="membership-panel"] button').trigger('click');
    await flushPromises();
    expect(
      calls.some((call) => call.method === 'POST' && call.path === '/organizations/lhp/join'),
    ).toBe(true);
    expect(wrapper.get('[data-testid="membership-panel"]').text()).toContain('Bạn là thành viên');
  });
  it('shows the board’s sweating card when a fourth open organization is refused', async () => {
    mockApi({
      ...signedInViewer(),
      ...organizationRoutes(
        organizationDetail({
          viewer: { isMember: false, canAdminister: false, pendingRequestId: null },
        }),
      ),
      'POST /organizations/lhp/join': fail(409, 'conflict'),
    });
    const { wrapper } = await mountApp('/organizations/lhp');
    await wrapper.get('[data-testid="membership-panel"] button').trigger('click');
    await flushPromises();
    expect(wrapper.get('[data-state="error"]').text()).toContain('Không tham gia được');
  });
});

describe('membership panel: requests', () => {
  it('sends a join request with the reason, then shows it pending', async () => {
    const pending = hcmus({
      isMember: false,
      canAdminister: false,
      pendingRequestId: joinRequest().id,
    });
    const calls = mockApi({
      ...signedInViewer(),
      ...organizationRoutes(
        hcmus({ isMember: false, canAdminister: false, pendingRequestId: null }),
      ),
      'GET /organizations/hcmus': sequence(
        ok(hcmus({ isMember: false, canAdminister: false, pendingRequestId: null })),
        ok(pending),
      ),
      'POST /organizations/hcmus/requests': ok(joinRequest()),
      [`GET /organizations/hcmus/requests/${joinRequest().id}`]: ok(joinRequest()),
    });
    const { wrapper } = await mountApp('/organizations/hcmus');
    await wrapper.get('textarea').setValue('  Em muốn tham gia đội tuyển.  ');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(calls.find((call) => call.method === 'POST')!.body).toEqual({
      reason: 'Em muốn tham gia đội tuyển.',
    });
    expect(wrapper.get('[data-testid="membership-panel"]').text()).toContain('Đang chờ duyệt');
  });
});

describe('membership panel: private membership', () => {
  it('lets a member of a private organization leave, warning that coming back needs a new request', async () => {
    mockApi({
      ...signedInViewer(),
      ...organizationRoutes(
        hcmus({ isMember: true, canAdminister: false, pendingRequestId: null }),
      ),
    });
    const { wrapper } = await mountApp('/organizations/hcmus');
    expect(wrapper.get('[data-testid="membership-panel"]').text()).toContain(
      'muốn vào lại phải gửi yêu cầu mới',
    );
  });
});
