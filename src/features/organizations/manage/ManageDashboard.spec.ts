import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { contestItem } from '@/test/fixtures';
import { joinRequest, member, organizationDetail } from '@/test/community-fixtures';
import { organizationRoutes } from '@/test/community-routes';
import { orgProblem } from '@/test/f4-fixtures';
import { mockApi, page } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { signedInViewer } from '@/test/problem-routes';

const ADMIN_VIEWER = {
  isMember: true,
  canAdminister: true,
  canCreateProblem: true,
  canCreateContest: false,
  pendingRequestId: null,
};
const detail = organizationDetail({ viewer: ADMIN_VIEWER, memberCount: 2 });
const SLUG = detail.slug;

async function mountManage(requests: ReturnType<typeof joinRequest>[]) {
  const calls = mockApi({
    ...signedInViewer(),
    ...organizationRoutes(detail),
    [`GET /organizations/${SLUG}/requests`]: page(requests, { pageSize: 50 }),
    [`GET /organizations/${SLUG}/members`]: page([member(1, 'an'), member(2, 'binh')], {
      pageSize: 10,
    }),
    [`GET /organizations/${SLUG}/problems`]: page(
      [orgProblem({ code: `${SLUG}_a`, name: 'Tổng hai số', isPublic: false })],
      { pageSize: 50 },
    ),
    'GET /contests': page([contestItem({ name: 'Kiểm tra giữa kỳ' })], { pageSize: 5 }),
    [`GET /organizations/${SLUG}/revisions`]: page([], { pageSize: 20 }),
  });
  const { wrapper } = await mountApp(`/organizations/${SLUG}/manage`);
  return { wrapper, calls };
}

describe('organization Quản lý dashboard (4A)', () => {
  it('counts members, waiting requests, problems and contests in the tiles', async () => {
    const { wrapper } = await mountManage([joinRequest({ organizationSlug: SLUG })]);
    const tiles = wrapper.get('[data-testid="manage-summary"] ul').findAll('li');
    expect(tiles.map((tile) => tile.text())).toEqual([
      'Thành viên2',
      'Chờ duyệt1',
      'Bài tập1',
      'Kỳ thi1',
    ]);
    expect(wrapper.get('[data-testid="manage-create-problem"]').attributes('href')).toBe(
      `/admin/problems/new?organization=${SLUG}`,
    );
    expect(wrapper.find('[data-testid="manage-create-contest"]').exists()).toBe(false);
  });

  it('opens with the waiting requests and their approve/reject actions, unfolded', async () => {
    const { wrapper } = await mountManage([joinRequest({ organizationSlug: SLUG })]);
    expect(wrapper.find('[data-testid="requests-fold"]').exists()).toBe(false);
    expect(wrapper.get('[data-testid="join-requests"]').text()).toContain('hieu_cpp');
  });

  it('folds the requests into one line when none is waiting', async () => {
    const { wrapper } = await mountManage([]);
    const fold = wrapper.get('[data-testid="requests-fold"]');
    expect(fold.element.tagName).toBe('DETAILS');
    expect(fold.attributes('open')).toBeUndefined();
    expect(fold.text()).toContain('Không có yêu cầu chờ duyệt');
  });

  it('lists problems and contests, and keeps settings and history folded', async () => {
    const { wrapper } = await mountManage([]);
    expect(wrapper.get('[data-testid="manage-problems"]').text()).toContain('Tổng hai số');
    expect(wrapper.get('[data-testid="manage-problems"]').text()).toContain('Ẩn');
    expect(wrapper.get('[data-testid="manage-contests"]').text()).toContain('Kiểm tra giữa kỳ');
    for (const id of ['settings-fold', 'history-fold'])
      expect(wrapper.get(`[data-testid="${id}"]`).attributes('open')).toBeUndefined();
  });

  it('loads the history only once its fold is opened', async () => {
    const { wrapper, calls } = await mountManage([]);
    const historyCalls = () => calls.filter((call) => call.path.endsWith('/revisions')).length;
    expect(historyCalls()).toBe(0);
    const fold = wrapper.get('[data-testid="history-fold"]');
    expect(fold.find('[data-testid="org-history"]').exists()).toBe(false);
    (fold.element as HTMLDetailsElement).open = true;
    await fold.trigger('toggle');
    await flushPromises();
    expect(fold.find('[data-testid="org-history"]').exists()).toBe(true);
    expect(historyCalls()).toBe(1);
  });

  it('shows the short member list without rank or points columns', async () => {
    const { wrapper } = await mountManage([]);
    const headers = wrapper.findAll('th').map((th) => th.text());
    expect(headers).not.toContain('PP');
    expect(headers).not.toContain('#');
    expect(wrapper.text()).toContain('binh');
  });
});
