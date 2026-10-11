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
          viewer: {
            isMember: true,
            canAdminister: false,
            canCreateProblem: false,
            canCreateContest: false,
            pendingRequestId: null,
          },
        }),
      ),
    });
    const { wrapper } = await mountApp('/organizations/lhp');
    expect(wrapper.get('nav[aria-label="Mục tổ chức"]').text()).not.toContain('Yêu cầu tham gia');
  });
});

describe('organization manage card (1B)', () => {
  const viewerWith = (flags: { canAdminister: boolean; canCreateProblem: boolean }) => ({
    isMember: true,
    canCreateContest: false,
    pendingRequestId: null,
    ...flags,
  });

  it('offers "Tạo bài tập" to an administrator the API lets create, linked to the form for this organization', async () => {
    mockApi({
      ...signedInViewer(),
      ...organizationRoutes(
        organizationDetail({ viewer: viewerWith({ canAdminister: true, canCreateProblem: true }) }),
      ),
    });
    const { wrapper } = await mountApp('/organizations/lhp');
    const card = wrapper.get('[data-testid="organization-manage-card"]');
    expect(card.get('[data-testid="org-create-problem"]').attributes('href')).toBe(
      '/admin/problems/new?organization=lhp',
    );
    expect(card.find('[data-testid="org-create-contest"]').exists()).toBe(false);
    expect(card.text()).toContain('Yêu cầu tham gia');
  });

  it('keeps the card for an administrator without create rights, with no create button', async () => {
    mockApi({
      ...signedInViewer(),
      ...organizationRoutes(
        organizationDetail({
          viewer: viewerWith({ canAdminister: true, canCreateProblem: false }),
        }),
      ),
    });
    const { wrapper } = await mountApp('/organizations/lhp');
    expect(wrapper.find('[data-testid="organization-manage-card"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="org-create-problem"]').exists()).toBe(false);
  });

  it('shows no card to a plain member', async () => {
    mockApi({
      ...signedInViewer(),
      ...organizationRoutes(
        organizationDetail({
          viewer: viewerWith({ canAdminister: false, canCreateProblem: false }),
        }),
      ),
    });
    const { wrapper } = await mountApp('/organizations/lhp');
    expect(wrapper.find('[data-testid="organization-manage-card"]').exists()).toBe(false);
  });
});
