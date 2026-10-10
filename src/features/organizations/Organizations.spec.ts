import { describe, expect, it } from 'vitest';
import { userPage } from '@/test/fixtures';
import {
  member,
  organizationDetail,
  organizationItem,
  organizationSummary,
  postItem,
} from '@/test/community-fixtures';
import { organizationListRoutes, organizationRoutes } from '@/test/community-routes';
import { fail, hangRequestsExcept, mockApi, ok, page } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer, signedInViewer } from '@/test/problem-routes';
import UserAvatar from '@/mascot/avatar/UserAvatar.vue';

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

describe('organization page', () => {
  it('shows an organization’s header, about text, posts, admins and top members with avatars', async () => {
    mockApi({
      ...anonymousViewer,
      ...organizationRoutes(organizationDetail()),
      'GET /organizations/lhp/members': page([member(1, 'tuanlq'), member(2, 'khoa.tran')], {
        pageSize: 5,
        total: 842,
      }),
      'GET /organizations/lhp/posts': page([postItem({ title: 'Lịch kỳ thi nội bộ tháng 10' })]),
    });
    const { wrapper } = await mountApp('/organizations/lhp');
    expect(wrapper.get('h1').text()).toBe('THPT chuyên Lê Hồng Phong');
    expect(wrapper.get('[data-testid="organization-header"]').text()).toContain(
      'Còn chỗ: không giới hạn',
    );
    expect(wrapper.text()).toContain('Câu lạc bộ Tin học.');
    expect(wrapper.text()).toContain('Lịch kỳ thi nội bộ tháng 10');
    expect(wrapper.get('[data-testid="organization-admins"]').text()).toContain('thayhung');
    expect(wrapper.get('[data-testid="top-members"]').findAllComponents(UserAvatar)).toHaveLength(
      2,
    );
    expect(wrapper.get('nav[aria-label="Mục tổ chức"]').text()).toContain('Thành viên 842');
  });
});

describe('organization access and states', () => {
  it('shows card-shaped blocks while the list loads', async () => {
    mockApi({ ...anonymousViewer });
    hangRequestsExcept(['/auth/me']);
    const { wrapper } = await mountApp('/organizations');
    expect(
      wrapper.findAll('[data-testid="query-skeleton"] [data-skeleton-region="organization-card"]'),
    ).toHaveLength(6);
  });
  it('offers the requests tab to administrators only', async () => {
    mockApi({
      ...signedInViewer(),
      ...organizationRoutes(
        organizationDetail({
          viewer: { isMember: true, canAdminister: true, pendingRequestId: null },
        }),
      ),
    });
    const { wrapper } = await mountApp('/organizations/lhp');
    expect(wrapper.get('nav[aria-label="Mục tổ chức"]').text()).toContain('Yêu cầu tham gia');
  });
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
  it('shows the crying Bit for an unknown organization', async () => {
    mockApi({ ...anonymousViewer, 'GET /organizations/khong-co': fail(404, 'not_found') });
    const { wrapper } = await mountApp('/organizations/khong-co');
    expect(wrapper.get('[data-state="notFound"] h1').text()).toBe('Không tìm thấy tổ chức');
  });
});

describe('organization list states', () => {
  it('marks an unlisted organization with the "Ẩn" chip and leaves listed ones without it', async () => {
    mockApi({
      ...anonymousViewer,
      'GET /organizations': page([
        organizationItem({ isUnlisted: true }),
        organizationItem({ id: 'o2', slug: 'hcmus', isUnlisted: false }),
      ]),
    });
    const { wrapper } = await mountApp('/organizations');
    const [hidden, listed] = wrapper.findAll('[data-testid="organization-card"]');
    expect(hidden!.text()).toContain('Ẩn');
    expect(listed!.text()).not.toContain('Ẩn');
  });
  it('offers the next page of organizations when there are more than one page', async () => {
    mockApi({
      ...anonymousViewer,
      'GET /organizations': page([organizationItem()], { page: 1, pageSize: 100, total: 250 }),
    });
    const { wrapper } = await mountApp('/organizations');
    const pager = wrapper.get('nav[aria-label="Trang tổ chức"]');
    expect(pager.find('a[aria-label="Trang sau"]').exists()).toBe(true);
  });
  it('says there are no organizations when the list is empty', async () => {
    mockApi({ ...anonymousViewer, 'GET /organizations': page([]) });
    const { wrapper } = await mountApp('/organizations');
    expect(wrapper.findAll('[data-testid="organization-card"]')).toHaveLength(0);
    expect(wrapper.text()).toContain('Chưa có tổ chức công khai');
  });
});

describe('organization members', () => {
  it('shows each top member’s display name beside the username', async () => {
    mockApi({
      ...anonymousViewer,
      ...organizationRoutes(organizationDetail()),
      'GET /organizations/lhp/members': page(
        [member(1, 'tuanlq', { displayName: 'Lê Quang Tuấn' })],
        { pageSize: 5, total: 1 },
      ),
    });
    const { wrapper } = await mountApp('/organizations/lhp');
    const topMembers = wrapper.get('[data-testid="top-members"]');
    expect(topMembers.text()).toContain('tuanlq');
    expect(topMembers.text()).toContain('Lê Quang Tuấn');
  });
});
