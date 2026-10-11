import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { joinRequest, organizationDetail } from '@/test/community-fixtures';
import { organizationRoutes } from '@/test/community-routes';
import { fail, mockApi, ok, sequence } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
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
    await wrapper.get('textarea').setValue('  Em muốn tham gia đội tuyển.  ');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(calls.find((call) => call.method === 'POST')!.body).toEqual({
      reason: 'Em muốn tham gia đội tuyển.',
    });
    expect(wrapper.get('[data-testid="membership-panel"]').text()).toContain('Đang chờ duyệt');
  });
});

describe('membership panel: official contest', () => {
  const officialSite = { 'GET /site': ok({ config: {}, officialMode: true }) };
  const panelButton = (wrapper: Pick<VueWrapper, 'get'>, name: string) =>
    wrapper
      .get('[data-testid="membership-panel"]')
      .findAll('button')
      .find((button) => button.text() === name)!;

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
