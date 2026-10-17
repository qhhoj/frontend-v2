import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { joinRequest, organizationDetail } from '@/test/community-fixtures';
import { organizationRoutes } from '@/test/community-routes';
import { fail, mockApi, ok, sequence } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import Modal from '@/components/ui/Modal.vue';
import { signedInViewer } from '@/test/problem-routes';

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

const panelButton = (wrapper: Pick<VueWrapper, 'get'>, name: string) =>
  wrapper
    .get('[data-testid="membership-panel"]')
    .findAll('button')
    .find((button) => button.text() === name)!;

describe('membership panel: requests', () => {
  it('sends a join request with the reason, then shows it pending', async () => {
    const pending = hcmus({
      isMember: false,
      canAdminister: false,
      canCreateProblem: false,
      canCreateContest: false,
      pendingRequestId: joinRequest().id,
    });
    const calls = mockApi({
      ...signedInViewer(),
      ...organizationRoutes(
        hcmus({
          isMember: false,
          canAdminister: false,
          canCreateProblem: false,
          canCreateContest: false,
          pendingRequestId: null,
        }),
      ),
      'GET /organizations/hcmus': sequence(
        ok(
          hcmus({
            isMember: false,
            canAdminister: false,
            canCreateProblem: false,
            canCreateContest: false,
            pendingRequestId: null,
          }),
        ),
        ok(pending),
      ),
      'POST /organizations/hcmus/requests': ok(joinRequest()),
      [`GET /organizations/hcmus/requests/${joinRequest().id}`]: ok(joinRequest()),
    });
    const { wrapper } = await mountApp('/organizations/hcmus');
    await panelButton(wrapper, 'Gửi yêu cầu tham gia').trigger('click');
    await flushPromises();
    const dialog = document.body.querySelector('[role="dialog"]')!;
    const textarea = dialog.querySelector('textarea')!;
    textarea.value = '  Em muốn tham gia đội tuyển.  ';
    textarea.dispatchEvent(new Event('input'));
    await flushPromises();
    dialog.querySelector('form')!.dispatchEvent(new Event('submit'));
    await flushPromises();
    expect(calls.find((call) => call.method === 'POST')!.body).toEqual({
      reason: 'Em muốn tham gia đội tuyển.',
    });
    expect(wrapper.get('[data-testid="membership-chip"]').text()).toBe('Đang chờ duyệt');
    expect(wrapper.findComponent(Modal).props('visible')).toBe(false);
  });
});

const MEMBER = {
  isMember: true,
  canAdminister: false,
  canCreateProblem: false,
  canCreateContest: false,
  pendingRequestId: null,
};
const OUTSIDER = { ...MEMBER, isMember: false };

describe('membership header: member and join', () => {
  it('names a member with a chip, no panel, and puts leaving behind ⋯ and a confirm', async () => {
    const lhp = organizationDetail({ viewer: MEMBER });
    const calls = mockApi({
      ...signedInViewer(),
      ...organizationRoutes(lhp),
      'GET /organizations/lhp': sequence(ok(lhp), ok(organizationDetail({ viewer: OUTSIDER }))),
      'POST /organizations/lhp/leave': { status: 204 },
    });
    const { wrapper } = await mountApp('/organizations/lhp');
    expect(wrapper.get('[data-testid="membership-chip"]').text()).toBe('Thành viên');
    expect(wrapper.find('[data-testid="membership-panel"]').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('Rời tổ chức');
    await wrapper.get('[data-testid="organization-menu"] button').trigger('click');
    await flushPromises();
    const leaveItem = [...document.body.querySelectorAll('[role="menuitem"]')].find((item) =>
      item.textContent?.includes('Rời tổ chức'),
    ) as HTMLElement;
    // PrimeVue's menu item listens on its content element, the menuitem's first child.
    (leaveItem.firstElementChild as HTMLElement).click();
    await flushPromises();
    expect(calls.some((call) => call.method === 'POST')).toBe(false);
    const dialog = document.body.querySelector('[role="dialog"]')!;
    expect(dialog.textContent).toContain('Rời ');
    dialog.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await flushPromises();
    expect(calls.filter((call) => call.method === 'POST').map((call) => call.path)).toEqual([
      '/organizations/lhp/leave',
    ]);
    await vi.waitFor(() => expect(document.body.textContent).toContain('Đã rời'));
  });

  it('turns a join into a chip and a toast, not a panel', async () => {
    const lhp = organizationDetail({ viewer: OUTSIDER });
    mockApi({
      ...signedInViewer(),
      ...organizationRoutes(lhp),
      'GET /organizations/lhp': sequence(ok(lhp), ok(organizationDetail({ viewer: MEMBER }))),
      'POST /organizations/lhp/join': { status: 204 },
    });
    const { wrapper } = await mountApp('/organizations/lhp');
    await panelButton(wrapper, 'Tham gia tổ chức').trigger('click');
    await flushPromises();
    await vi.waitFor(() =>
      expect(wrapper.get('[data-testid="membership-chip"]').text()).toBe('Thành viên'),
    );
    expect(wrapper.find('[data-testid="membership-panel"]').exists()).toBe(false);
    expect(document.body.querySelector('[data-testid="admin-toasts"]')!.textContent).toContain(
      'Đã tham gia',
    );
  });
});

describe('membership panel: official contest', () => {
  const officialSite = { 'GET /site': ok({ config: {}, officialMode: true }) };

  it('locks joining an open organization, says why and sends nothing', async () => {
    const lhp = organizationDetail({
      viewer: {
        isMember: false,
        canAdminister: false,
        canCreateProblem: false,
        canCreateContest: false,
        pendingRequestId: null,
      },
    });
    const calls = mockApi({ ...signedInViewer(), ...organizationRoutes(lhp), ...officialSite });
    const { wrapper } = await mountApp('/organizations/lhp');
    const panel = wrapper.get('[data-testid="membership-panel"]');
    const join = panelButton(wrapper, 'Tham gia tổ chức');
    const note = panel.get('[data-testid="official-lock-note"]');
    expect(join.attributes('aria-disabled')).toBe('true');
    expect(join.attributes('aria-describedby')).toBe(note.attributes('id'));
    await join.trigger('click');
    await flushPromises();
    expect(calls.some((call) => call.method === 'POST')).toBe(false);
  });

  it('explains a lock the server reports while the site record still said off', async () => {
    const lhp = organizationDetail({
      viewer: {
        isMember: false,
        canAdminister: false,
        canCreateProblem: false,
        canCreateContest: false,
        pendingRequestId: null,
      },
    });
    mockApi({
      ...signedInViewer(),
      ...organizationRoutes(lhp),
      'POST /organizations/lhp/join': fail(403, 'locked_in_official_contest'),
    });
    const { wrapper } = await mountApp('/organizations/lhp');
    await panelButton(wrapper, 'Tham gia tổ chức').trigger('click');
    await flushPromises();
    expect(wrapper.get('[data-testid="membership-panel"]').text()).toContain(
      'Đang trong kỳ thi chính thức',
    );
  });
});
