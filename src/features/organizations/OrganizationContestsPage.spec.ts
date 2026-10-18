import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mockApi, page } from '@/test/mock-api';
import type { ApiCall } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { contestItem } from '@/test/fixtures';
import { organizationDetail } from '@/test/community-fixtures';
import { organizationRoutes } from '@/test/community-routes';
import { signedInViewer } from '@/test/problem-routes';
import { ADMIN_STATE, MEMBER_STATE } from '@/test/f4-routes';

const PATH = '/organizations/lhp/contests';
const EDITABLE = contestItem({
  key: 'lhp_mock',
  name: 'Kiểm tra giữa kỳ',
  phase: 'upcoming',
  startTime: '2099-01-01T08:00:00Z',
  endTime: '2099-01-01T10:00:00Z',
  editor: { isVisible: false, lockedAfter: null, pendingCount: null },
});
const READ_ONLY = contestItem({
  key: 'lhp_open',
  name: 'Luyện tập tuần',
  phase: 'upcoming',
  startTime: '2099-01-02T08:00:00Z',
  endTime: '2099-01-02T10:00:00Z',
});

async function mountTab(viewer: typeof ADMIN_STATE, contests: ReturnType<typeof contestItem>[]) {
  mockApi({
    ...signedInViewer(),
    ...organizationRoutes(organizationDetail({ viewer })),
    // Each phase group asks on its own; these contests are all upcoming, and the "any contest" probe has no phase.
    'GET /contests': (call: ApiCall) =>
      page(['upcoming', null].includes(call.query.get('phase')) ? contests : []),
  });
  const mounted = await mountApp(PATH);
  await vi.waitFor(() => {
    const ready = mounted.wrapper.find(
      contests.length ? '[data-testid="upcoming-contest"]' : '[data-testid="org-contests-empty"]',
    );
    if (!ready.exists()) throw new Error('tab not ready');
  });
  await flushPromises();
  return mounted.wrapper;
}

describe('OrganizationContestsPage (P-32 B)', () => {
  it('offers a contest creator "Tạo kỳ thi" for this organization and a pencil on the contests they edit', async () => {
    const wrapper = await mountTab({ ...ADMIN_STATE, canCreateContest: true }, [
      EDITABLE,
      READ_ONLY,
    ]);
    expect(wrapper.get('[data-testid="org-tab-create-contest"]').attributes('href')).toBe(
      '/admin/contests/new?organization=lhp',
    );
    const pencils = wrapper.findAll('[data-testid="contest-edit"]');
    expect(pencils.map((pencil) => pencil.attributes('href'))).toEqual([
      '/admin/contests/lhp_mock/general',
    ]);
  });

  it('turns an empty tab into a first step for a creator, and only says it is empty to members', async () => {
    const creator = await mountTab({ ...ADMIN_STATE, canCreateContest: true }, []);
    expect(creator.text()).toContain('Tạo kỳ thi đầu tiên cho thành viên');
    expect(creator.find('[data-testid="org-tab-create-contest"]').exists()).toBe(true);
    const member = await mountTab(MEMBER_STATE, []);
    expect(member.text()).toContain('Tổ chức chưa có kỳ thi nào');
    expect(member.find('[data-testid="org-tab-create-contest"]').exists()).toBe(false);
  });
});
