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
const mountEditor = (path: string) =>
  mountScreen(
    path,
    (wrapper) =>
      (wrapper.find('#org-name').element as HTMLInputElement | undefined)?.value ===
      'THPT chuyên Lê Hồng Phong',
  );
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
  it('lists organizations with open, closed and hidden states and opens one for editing', async () => {
    mockApi(routes());
    const { wrapper } = await mountEditor('/admin/organizations?org=lhp');
    expect(wrapper.get('[data-testid="org-list"]').text()).toContain('Ẩn');
    expect((wrapper.get('#org-name').element as HTMLInputElement).value).toBe(
      'THPT chuyên Lê Hồng Phong',
    );
  });

  it('saves only what changed', async () => {
    const calls = mockApi(routes({ 'PATCH /organizations/lhp': ok({ ...detail, name: 'Mới' }) }));
    const { wrapper } = await mountEditor('/admin/organizations?org=lhp');
    await wrapper.get('#org-name').setValue('Mới');
    await click(wrapper, 'Lưu thay đổi');
    expect(calls.find((call) => call.method === 'PATCH')?.body).toEqual({ name: 'Mới' });
  });

  it('accepts and refuses join requests', async () => {
    const calls = mockApi(
      routes({
        [`POST /organizations/lhp/requests/${request.id}/decide`]: ok({
          ...request,
          state: 'A',
        }),
      }),
    );
    const { wrapper } = await mountWithButton('/admin/organizations?org=lhp', 'Chấp nhận');
    await click(wrapper, 'Chấp nhận');
    expect(calls.find((call) => call.path.endsWith('/decide'))?.body).toEqual({ state: 'A' });
  });

  it('shows a full organization as a refusal inside that request', async () => {
    mockApi(
      routes({
        [`POST /organizations/lhp/requests/${request.id}/decide`]: FULL_CODE,
      }),
    );
    const { wrapper } = await mountWithButton('/admin/organizations?org=lhp', 'Chấp nhận');
    await click(wrapper, 'Chấp nhận');
    expect(wrapper.get('[data-testid="join-requests"] [role="alert"]').text()).toContain(
      'Tổ chức đã đủ chỗ.',
    );
  });

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

  it('creates an organization as staff, sending the staff fields they set', async () => {
    const created = { ...detail, slug: 'moi', name: 'Mới' };
    const calls = mockApi(
      routes({
        'POST /organizations': ok(created),
        'GET /organizations/moi': ok(created),
        'GET /organizations/moi/requests': page([]),
        'GET /organizations/moi/members': page([]),
      }),
    );
    const { wrapper, router } = await mountList('/admin/organizations');
    await click(wrapper, 'Tạo tổ chức');
    await wrapper.get('#org-name').setValue('Mới');
    await wrapper.get('#org-slug').setValue('moi');
    await click(wrapper, 'Tạo tổ chức mới');
    const body = calls.find((call) => call.method === 'POST')?.body;
    expect(body).toMatchObject({ name: 'Mới', slug: 'moi', isOpen: false, isUnlisted: true });
    expect(body).not.toHaveProperty('shortName');
    expect(router.currentRoute.value.query.org).toBe('moi');
  });

  it('creates an organization as a plain creator without any staff field, which the backend would refuse', async () => {
    const created = { ...detail, slug: 'moi', name: 'Mới' };
    const calls = mockApi(
      routes(
        {
          'POST /organizations': ok(created),
          'GET /organizations/moi': ok(created),
          'GET /organizations/moi/requests': page([]),
          'GET /organizations/moi/members': page([]),
        },
        staffViewer(['judge.add_organization']),
      ),
    );
    const { wrapper } = await mountList('/admin/organizations');
    await click(wrapper, 'Tạo tổ chức');
    await wrapper.get('#org-name').setValue('Mới');
    await wrapper.get('#org-slug').setValue('moi');
    await click(wrapper, 'Tạo tổ chức mới');
    const body = calls.find((call) => call.method === 'POST')?.body;
    expect(body).toEqual({ name: 'Mới', slug: 'moi', isOpen: false });
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

  it('opens the editor of an organization whose about is hidden (null) as an empty box', async () => {
    mockApi(routes({ 'GET /organizations/lhp': ok({ ...detail, about: null }) }));
    const { wrapper } = await mountEditor('/admin/organizations?org=lhp');
    expect((wrapper.get('#org-about').element as HTMLTextAreaElement).value).toBe('');
  });

  it('moves focus to the members panel after a member is kicked', async () => {
    mockApi(routes({ 'POST /organizations/lhp/kick': { status: 204 } }));
    const { wrapper } = await mountWithButton('/admin/organizations?org=lhp', 'Đuổi');
    await click(wrapper, 'Đuổi');
    await confirmDialog('Đuổi');
    await vi.waitFor(() =>
      expect(document.activeElement?.getAttribute('aria-label')).toBe('Thành viên'),
    );
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

  it('sends the typed text trimmed, marks the match and counts the matches', async () => {
    const calls = mockApi(
      routes({
        'GET /organizations': ({ query }: ApiCall) =>
          query.get('search')
            ? page([organizationItem({ slug: 'ntt-club', name: 'CLB Tin học' })], { total: 4 })
            : page([
                organizationItem(),
                organizationItem({ slug: 'ntt-club', name: 'CLB Tin học' }),
              ]),
      }),
    );
    const { wrapper } = await mountList('/admin/organizations');
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    await wrapper.get('input[type="search"]').setValue(' cl ');
    await vi.advanceTimersByTimeAsync(TEXT_DEBOUNCE_MS);
    await flushPromises();
    expect(
      calls
        .filter((call) => call.path === '/organizations')
        .at(-1)!
        .query.get('search'),
    ).toBe('cl');
    expect(wrapper.get('[data-testid="org-list"] mark').text()).toBe('CL');
    expect(wrapper.text()).toContain('1 / 4 tổ chức khớp “cl”');
  });

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

  it('says what an empty search found', async () => {
    mockApi(routes({ 'GET /organizations': page([], { total: 0 }) }));
    const { wrapper } = await mountScreen('/admin/organizations?q=olympic', (mounted) =>
      mounted.text().includes('Không có tổ chức nào khớp “olympic”.'),
    );
    expect(wrapper.text()).toContain('Không có tổ chức nào khớp “olympic”.');
  });
});

describe('OrganizationsPage request queue', () => {
  it('offers the queue tab with the pending count to a viewer with judge.edit_all_organization', async () => {
    mockApi(queueRoutes());
    const { wrapper } = await mountWithButton('/admin/organizations', 'Tạo tổ chức');
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="pending-count"]').exists()).toBe(true),
    );
    const tab = wrapper.get('[data-testid="view-requests"]');
    expect(tab.text()).toContain('Yêu cầu tham gia · tất cả tổ chức');
    expect(tab.get('[data-testid="pending-count"]').text()).toBe('4');
  });

  it('shows no queue tab, and sends no queue request, to a viewer who may only create organizations', async () => {
    const calls = mockApi(queueRoutes(staffViewer(['judge.add_organization'])));
    const { wrapper } = await mountList('/admin/organizations?view=requests');
    expect(wrapper.find('[data-testid="view-requests"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="org-list"]').exists()).toBe(true);
    expect(queueCalls(calls)).toHaveLength(0);
  });

  it('lists the pending requests of every organization with the organization named on each row', async () => {
    const calls = mockApi(queueRoutes());
    const { wrapper } = await mountScreen(
      '/admin/organizations?view=requests',
      (mounted) => mounted.findAll('[data-testid="queue-row"]').length > 0,
    );
    const rows = wrapper.findAll('[data-testid="queue-row"]');
    expect(rows.map((row) => row.get('[data-testid="queue-org"]').text())).toEqual([
      'lhp',
      'hcmus-team',
    ]);
    expect(rows[0]!.text()).toContain('bichphuong');
    expect(queueCalls(calls)[0]!.query.get('state')).toBe('P');
    expect(wrapper.text()).toContain('4 yêu cầu chờ duyệt');
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

  it('refuses a full organization inside that row only', async () => {
    mockApi(
      queueRoutes({
        [`POST /organizations/hcmus-team/requests/${queued[1]!.id}/decide`]: FULL_CODE,
      }),
    );
    const { wrapper } = await mountScreen(
      '/admin/organizations?view=requests',
      (mounted) => mounted.findAll('[data-testid="queue-row"]').length > 0,
    );
    const rows = wrapper.findAll('[data-testid="queue-row"]');
    await rows[1]!
      .findAll('button')
      .find((button) => button.text() === 'Chấp nhận')!
      .trigger('click');
    await flushPromises();
    expect(rows[1]!.get('[role="alert"]').text()).toContain('Tổ chức đã đủ chỗ.');
    expect(rows[0]!.find('[role="alert"]').exists()).toBe(false);
  });

  it('reads the decided states without decision buttons and keeps the pending badge', async () => {
    const decided = joinRequest({
      id: communityId(513),
      organizationSlug: 'lhp',
      state: 'A',
      decidedBy: communityId(902),
      decidedAt: '2026-10-08T12:00:00Z',
    });
    const calls = mockApi(
      queueRoutes({
        [`GET ${QUEUE}`]: ({ query }: ApiCall) =>
          query.get('state') === 'A'
            ? page([decided], { pageSize: 50, total: 1 })
            : page(queued, { pageSize: 50, total: 4 }),
      }),
    );
    const { wrapper } = await mountScreen(
      '/admin/organizations?view=requests&state=A',
      (mounted) => mounted.findAll('[data-testid="queue-row"]').length > 0,
    );
    expect(
      queueCalls(calls)
        .map((call) => call.query.get('state'))
        .sort(),
    ).toEqual(['A', 'P']);
    expect(wrapper.get('[data-testid="queue-row"]').findAll('button')).toHaveLength(0);
    expect(wrapper.get('[data-testid="pending-count"]').text()).toBe('4');
  });

  it('refreshes the queue when a request is decided from an organization’s own panel', async () => {
    const calls = mockApi(
      queueRoutes({
        [`POST /organizations/lhp/requests/${request.id}/decide`]: ok({ ...request, state: 'R' }),
      }),
    );
    const { wrapper } = await mountWithButton('/admin/organizations?org=lhp', 'Từ chối');
    await click(wrapper, 'Từ chối');
    expect(queueCalls(calls).length).toBeGreaterThanOrEqual(2);
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

  it('reads the busy-lock 409 as a retry, not as a full organization', async () => {
    mockApi(
      queueRoutes({
        [`POST /organizations/lhp/requests/${queued[0]!.id}/decide`]: failWithCode(
          409,
          'lock',
          'busy',
        ),
      }),
    );
    const { wrapper } = await mountScreen(
      '/admin/organizations?view=requests',
      (mounted) => mounted.findAll('[data-testid="queue-row"]').length > 0,
    );
    await acceptButtonOf(wrapper.findAll('[data-testid="queue-row"]')[0]!).trigger('click');
    await flushPromises();
    const alert = wrapper.get('[data-testid="queue-row"] [role="alert"]').text();
    expect(alert).not.toContain('đủ chỗ');
    expect(alert.length).toBeGreaterThan(0);
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

  it('does not list organizations while the queue tab is showing', async () => {
    const calls = mockApi(queueRoutes());
    await mountScreen(
      '/admin/organizations?view=requests&q=cl',
      (mounted) => mounted.findAll('[data-testid="queue-row"]').length > 0,
    );
    expect(calls.filter((call) => call.path === '/organizations')).toHaveLength(0);
  });
});
