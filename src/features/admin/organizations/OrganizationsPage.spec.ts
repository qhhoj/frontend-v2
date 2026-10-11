import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { fail, failWithCode, mockApi, ok, page } from '@/test/mock-api';
import type { ApiCall } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { cancelDialog, confirmDialog, openDialog, staffViewer } from '@/test/admin-routes';
import { TEXT_DEBOUNCE_MS } from '@/lib/use-debounced-text';
import {
  communityId,
  joinRequest,
  member,
  organizationDetail,
  organizationItem,
} from '@/test/community-fixtures';

const ALL = ['judge.edit_all_organization', 'judge.add_organization'];
const QUEUE = '/admin/organization-requests';
const detail = organizationDetail({
  about: 'Trường THPT chuyên…',
  slots: 200,
  viewer: { isMember: false, canAdminister: true, pendingRequestId: null },
});
const request = joinRequest({ organizationSlug: 'lhp' });
const ngocanh = member(1, 'ngocanh');
const routes = (extra = {}, viewer = staffViewer(ALL)) => ({
  ...viewer,
  'GET /organizations': page([
    organizationItem(),
    organizationItem({ slug: 'ntt-club', name: 'CLB Tin học', isUnlisted: true }),
  ]),
  'GET /organizations/lhp': ok(detail),
  'GET /organizations/lhp/requests': page([request]),
  'GET /organizations/lhp/members': page([ngocanh]),
  'GET /organizations/lhp/revisions': page([]),
  'POST /organizations/render-preview': ok({ html: '<p>Trường THPT chuyên…</p>' }),
  [`GET ${QUEUE}`]: page([]),
  ...extra,
});
type Mounted = Awaited<ReturnType<typeof mountApp>>;
const hasButton = (wrapper: Mounted['wrapper'], text: string) =>
  wrapper.findAll('button').some((button) => button.text() === text);

/** AdminShell and the screens load lazily: wait until the screen's own content is in the DOM. */
const mountScreen = async (path: string, isReady: (wrapper: Mounted['wrapper']) => boolean) => {
  const mounted = await mountApp(path);
  await vi.waitFor(() => {
    if (!isReady(mounted.wrapper)) throw new Error('screen not yet');
  });
  return mounted;
};
const mountList = (path: string) =>
  mountScreen(path, (wrapper) => hasButton(wrapper, 'Tạo tổ chức'));
const mountWithButton = (path: string, text: string) =>
  mountScreen(path, (wrapper) => hasButton(wrapper, text));
const click = async (wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper'], text: string) => {
  await wrapper
    .findAll('button')
    .find((button) => button.text() === text)!
    .trigger('click');
  await flushPromises();
};

describe('OrganizationsPage', () => {
  it('reads an already decided request as taken by someone else and reloads the requests', async () => {
    const calls = mockApi(
      routes({
        [`POST /organizations/lhp/requests/${request.id}/decide`]: DECIDED_CODE,
      }),
    );
    const { wrapper } = await mountWithButton('/admin/organizations?org=lhp', 'Chấp nhận');
    const requestLoads = () => calls.filter((call) => call.path === '/organizations/lhp/requests');
    const before = requestLoads().length;
    await click(wrapper, 'Chấp nhận');
    expect(wrapper.get('[data-testid="join-requests"] [role="alert"]').text()).toContain(
      'đã được người khác xử lý',
    );
    expect(requestLoads().length).toBeGreaterThan(before);
  });

  it('kicks a member only after confirming', async () => {
    const calls = mockApi(routes({ 'POST /organizations/lhp/kick': { status: 204 } }));
    const { wrapper } = await mountWithButton('/admin/organizations?org=lhp', 'Đuổi');
    await click(wrapper, 'Đuổi');
    expect(calls.some((call) => call.path.endsWith('/kick'))).toBe(false);
    await confirmDialog('Đuổi');
    expect(calls.find((call) => call.path.endsWith('/kick'))?.body).toEqual({
      userId: ngocanh.id,
    });
  });

  it('does not show an earlier kick error when the dialog opens for another member', async () => {
    mockApi(routes({ 'POST /organizations/lhp/kick': fail(409, 'conflict') }));
    const { wrapper } = await mountWithButton('/admin/organizations?org=lhp', 'Đuổi');
    await click(wrapper, 'Đuổi');
    await confirmDialog('Đuổi');
    expect(openDialog().querySelector('[role="alert"]')).not.toBeNull();
    await cancelDialog('Hủy');
    await click(wrapper, 'Đuổi');
    expect(openDialog().querySelector('[role="alert"]')).toBeNull();
  });

  it('offers the delete to superusers only, not to staff who may edit every organization', async () => {
    mockApi(routes());
    const { wrapper } = await mountWithButton('/admin/organizations?org=lhp', 'Đuổi');
    await vi.waitFor(() => {
      if (!wrapper.find<HTMLInputElement>('#org-name').element.value) throw new Error('no detail');
    });
    await flushPromises();
    expect(wrapper.find('[data-testid="delete-organization"]').exists()).toBe(false);
  });

  it('deletes only once the address is typed, then leaves the editor', async () => {
    const calls = mockApi(
      routes(
        { 'DELETE /organizations/lhp': { status: 204 } },
        staffViewer(ALL, { isSuperuser: true }),
      ),
    );
    const { wrapper, router } = await mountWithButton(
      '/admin/organizations?org=lhp',
      'Xoá tổ chức',
    );
    await wrapper.get('[data-testid="delete-organization"]').trigger('click');
    await flushPromises();
    await confirmDialog('Xoá');
    expect(calls.some((call) => call.method === 'DELETE')).toBe(false);
    const input = openDialog().querySelector<HTMLInputElement>('#org-delete-slug')!;
    input.value = 'lhp';
    input.dispatchEvent(new Event('input'));
    await flushPromises();
    await confirmDialog('Xoá');
    expect(calls.filter((call) => call.method === 'DELETE').map((call) => call.path)).toEqual([
      '/organizations/lhp',
    ]);
    expect(router.currentRoute.value.query.org).toBeUndefined();
  });

  it('shows no join requests or members to a member who may not administer the organization', async () => {
    const calls = mockApi(
      routes({
        'GET /organizations/lhp': ok({
          ...detail,
          viewer: { isMember: true, canAdminister: false, pendingRequestId: null },
        }),
      }),
    );
    const { wrapper } = await mountScreen('/admin/organizations?org=lhp', (mounted) =>
      mounted.text().includes('không quản trị tổ chức này'),
    );
    await flushPromises();
    expect(wrapper.find('#org-name').exists()).toBe(false);
    expect(wrapper.find('[data-testid="join-requests"]').exists()).toBe(false);
    expect(
      calls.some((call) => call.path.endsWith('/requests') || call.path.endsWith('/members')),
    ).toBe(false);
  });
});

const queued = [
  joinRequest({ id: communityId(511), organizationSlug: 'lhp', username: 'bichphuong' }),
  joinRequest({ id: communityId(512), organizationSlug: 'hcmus-team', username: 'anh_khoa' }),
];
const queueRoutes = (extra = {}) =>
  routes({
    [`GET ${QUEUE}`]: ({ query }: ApiCall) =>
      query.get('state') === 'P'
        ? page(queued, { pageSize: 50, total: 4 })
        : page([], { pageSize: 50, total: 0 }),
    ...extra,
  });
const queueCalls = (calls: ReturnType<typeof mockApi>) =>
  calls.filter((call) => call.path === QUEUE);
const FULL_CODE = failWithCode(409, 'organization', 'organization_full');
const DECIDED_CODE = failWithCode(409, 'state', 'request_already_decided');
const decideCalls = (calls: ReturnType<typeof mockApi>) =>
  calls.filter((call) => call.path.endsWith('/decide'));

/** Wraps the mocked fetch so every decision stays in flight until the returned function is called. */
function holdDecisions(): () => void {
  const answer = globalThis.fetch;
  let release = () => {};
  const gate = new Promise<void>((resolve) => (release = resolve));
  vi.stubGlobal('fetch', (input: string, init?: RequestInit) =>
    input.includes('/decide') ? gate.then(() => answer(input, init)) : answer(input, init),
  );
  return release;
}
const acceptButtonOf = (row: ReturnType<Mounted['wrapper']['find']>) =>
  row.findAll('button').find((button) => button.text() === 'Chấp nhận')!;

describe('OrganizationsPage search', () => {
  afterEach(() => vi.useRealTimers());

  it('returns to the first page when the search term changes', async () => {
    const calls = mockApi(routes());
    const { wrapper } = await mountList('/admin/organizations?page=3');
    const listCalls = () => calls.filter((call) => call.path === '/organizations');
    expect(listCalls().at(-1)!.query.get('page')).toBe('3');
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await wrapper.get('input[type="search"]').setValue('cl');
    await vi.advanceTimersByTimeAsync(TEXT_DEBOUNCE_MS);
    await flushPromises();
    expect(listCalls().at(-1)!.query.get('search')).toBe('cl');
    expect(listCalls().at(-1)!.query.get('page')).toBe('1');
  });
});

describe('OrganizationsPage request queue', () => {
  it('shows no queue tab, and sends no queue request, to a viewer who may only create organizations', async () => {
    const calls = mockApi(queueRoutes(staffViewer(['judge.add_organization'])));
    const { wrapper } = await mountList('/admin/organizations?view=requests');
    expect(wrapper.find('[data-testid="view-requests"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="org-list"]').exists()).toBe(true);
    expect(queueCalls(calls)).toHaveLength(0);
  });

  it('accepts a request in its own organization, refreshes the queue and marks that organization’s lists stale', async () => {
    const calls = mockApi(
      queueRoutes({
        [`POST /organizations/lhp/requests/${queued[0]!.id}/decide`]: ok({
          ...queued[0],
          state: 'A',
        }),
      }),
    );
    const { wrapper, queryClient } = await mountScreen(
      '/admin/organizations?view=requests',
      (mounted) => mounted.findAll('[data-testid="queue-row"]').length > 0,
    );
    queryClient.setQueryData(['organizations', 'requests', 'lhp', 'P', 1], {
      items: [],
      meta: { page: 1, pageSize: 50 },
    });
    await wrapper
      .findAll('[data-testid="queue-row"]')[0]!
      .findAll('button')
      .find((button) => button.text() === 'Chấp nhận')!
      .trigger('click');
    await flushPromises();
    expect(calls.find((call) => call.path.endsWith('/decide'))?.body).toEqual({ state: 'A' });
    expect(queueCalls(calls)).toHaveLength(2);
    expect(
      queryClient.getQueryState(['organizations', 'requests', 'lhp', 'P', 1])?.isInvalidated,
    ).toBe(true);
  });

  it('says an already decided request was taken by someone else and refreshes the queue', async () => {
    const calls = mockApi(
      queueRoutes({
        [`POST /organizations/lhp/requests/${queued[0]!.id}/decide`]: DECIDED_CODE,
      }),
    );
    const { wrapper } = await mountScreen(
      '/admin/organizations?view=requests',
      (mounted) => mounted.findAll('[data-testid="queue-row"]').length > 0,
    );
    await acceptButtonOf(wrapper.findAll('[data-testid="queue-row"]')[0]!).trigger('click');
    await flushPromises();
    const alert = wrapper.get('[data-testid="queue-row"] [role="alert"]').text();
    expect(alert).toContain('đã được người khác xử lý');
    expect(alert).not.toContain('đủ chỗ');
    expect(queueCalls(calls)).toHaveLength(2);
  });

  it('keeps a full organization out of the refresh', async () => {
    const calls = mockApi(
      queueRoutes({
        [`POST /organizations/lhp/requests/${queued[0]!.id}/decide`]: FULL_CODE,
      }),
    );
    const { wrapper } = await mountScreen(
      '/admin/organizations?view=requests',
      (mounted) => mounted.findAll('[data-testid="queue-row"]').length > 0,
    );
    await acceptButtonOf(wrapper.findAll('[data-testid="queue-row"]')[0]!).trigger('click');
    await flushPromises();
    expect(wrapper.get('[data-testid="queue-row"] [role="alert"]').text()).toContain('đủ chỗ');
    expect(queueCalls(calls)).toHaveLength(1);
  });

  it('ignores a click on another row while a decision is in flight', async () => {
    const calls = mockApi(
      queueRoutes({
        [`POST /organizations/lhp/requests/${queued[0]!.id}/decide`]: FULL_CODE,
      }),
    );
    const { wrapper } = await mountScreen(
      '/admin/organizations?view=requests',
      (mounted) => mounted.findAll('[data-testid="queue-row"]').length > 0,
    );
    const release = holdDecisions();
    const rows = wrapper.findAll('[data-testid="queue-row"]');
    await acceptButtonOf(rows[0]!).trigger('click');
    await acceptButtonOf(rows[1]!).trigger('click');
    release();
    await flushPromises();
    expect(decideCalls(calls)).toHaveLength(1);
    expect(rows[0]!.get('[role="alert"]').text()).toContain('đủ chỗ');
    expect(rows[1]!.find('[role="alert"]').exists()).toBe(false);
  });
});
