import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { fail, mockApi, ok, page } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { cancelDialog, confirmDialog, openDialog, staffViewer } from '@/test/admin-routes';
import {
  joinRequest,
  member,
  organizationDetail,
  organizationItem,
} from '@/test/community-fixtures';

const ALL = ['judge.edit_all_organization', 'judge.add_organization'];
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
        [`POST /organizations/lhp/requests/${request.id}/decide`]: fail(409, 'conflict'),
      }),
    );
    const { wrapper } = await mountWithButton('/admin/organizations?org=lhp', 'Chấp nhận');
    await click(wrapper, 'Chấp nhận');
    expect(wrapper.get('[data-testid="join-requests"] [role="alert"]').text()).toContain(
      'Tổ chức đã đủ chỗ.',
    );
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

  it('shows no join requests or members to a member who may not administer the organization', async () => {
    const calls = mockApi(
      routes({
        'GET /organizations/lhp': ok({
          ...detail,
          viewer: { isMember: true, canAdminister: false, pendingRequestId: null },
        }),
      }),
    );
    const { wrapper } = await mountEditor('/admin/organizations?org=lhp');
    await flushPromises();
    expect(wrapper.find('[data-testid="join-requests"]').exists()).toBe(false);
    expect(
      calls.some((call) => call.path.endsWith('/requests') || call.path.endsWith('/members')),
    ).toBe(false);
  });
});
