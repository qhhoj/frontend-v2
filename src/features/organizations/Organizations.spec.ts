import { describe, expect, it } from 'vitest';
import { userPage } from '@/test/fixtures';
import {
  organizationDetail,
  organizationItem,
  organizationSummary,
} from '@/test/community-fixtures';
import { organizationListRoutes, organizationRoutes } from '@/test/community-routes';
import { mockApi, ok, page } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer, signedInViewer } from '@/test/problem-routes';

describe('organization list', () => {
  it('ranks organizations by performance points and filters to the viewer’s own', async () => {
    mockApi({
      ...signedInViewer(),
      ...organizationListRoutes,
      'GET /organizations': page([
        organizationItem({ performancePoints: 100 }),
        organizationItem({
          id: 'o2',
          slug: 'hcmus',
          shortName: 'HCMUS',
          name: 'Đội tuyển HCMUS',
          isOpen: false,
          performancePoints: 900,
        }),
      ]),
      'GET /users/user_01': ok(userPage({ organizations: [organizationSummary()] })),
    });
    const { wrapper } = await mountApp('/organizations');
    const cards = wrapper.findAll('[data-testid="organization-card"]');
    expect(cards.map((card) => card.text())).toEqual([
      expect.stringContaining('#1'),
      expect.stringContaining('#2'),
    ]);
    expect(cards[0]!.text()).toContain('Cần duyệt');
    expect(cards[1]!.text()).toContain('Mở tự do');
    expect(cards[1]!.text()).toContain('Đã tham gia');
    expect(cards[1]!.text()).toContain('842');
    const mine = wrapper.findAll('button').find((button) => button.text().startsWith('Của tôi'))!;
    await mine.trigger('click');
    expect(wrapper.findAll('[data-testid="organization-card"]')).toHaveLength(1);
  });
  it('hides the "Của tôi" filter from anonymous visitors and never asks for their profile', async () => {
    const calls = mockApi({ ...anonymousViewer, ...organizationListRoutes });
    const { wrapper } = await mountApp('/organizations');
    expect(wrapper.text()).not.toContain('Của tôi');
    expect(calls.some((call) => call.path.startsWith('/users/'))).toBe(false);
  });
});

describe('organization access and states', () => {
  it('hides the requests tab from members who are not administrators', async () => {
    mockApi({
      ...signedInViewer(),
      ...organizationRoutes(
        organizationDetail({
          viewer: { isMember: true, canAdminister: false, pendingRequestId: null },
        }),
      ),
    });
    const { wrapper } = await mountApp('/organizations/lhp');
    expect(wrapper.get('nav[aria-label="Mục tổ chức"]').text()).not.toContain('Yêu cầu tham gia');
  });
});
