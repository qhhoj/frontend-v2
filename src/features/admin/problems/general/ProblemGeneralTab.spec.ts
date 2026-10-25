import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { invalid, issue, mockApi, ok, page } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { invalidatedKeys, seedCache } from '@/test/cache-probe';
import { staffViewer } from '@/test/admin-routes';
import { organizationItem, profile, sessionUser, signedIn } from '@/test/fixtures';
import {
  editableProblem,
  problemEditingMeta,
  problemData,
  problemEditor,
  problemEditorRoutes,
  TYPE_GRAPH,
} from '@/test/admin-fixtures/problems';

const EDIT = ['judge.edit_own_problem'];
const STALE_AFTER_WRITE = [
  ['problems', 'list', 'probe'],
  ['admin', 'index', 'problems', 'probe'],
];
const ALL = [...EDIT, 'judge.edit_all_problem'];

/** The shell, the editor and the tab load lazily: wait until the form field the test uses is on the page. */
const mountAdmin = async (path: string) => {
  const mounted = await mountApp(path);
  await vi.waitFor(
    () => {
      if (!mounted.wrapper.find('#problem-code, [data-testid="editor-view-basic"]').exists())
        throw new Error('form not yet');
    },
    { timeout: 5000 },
  );
  await flushPromises();
  return mounted;
};

const buttonLabelledIn = (root: HTMLElement, label: string) =>
  [...root.querySelectorAll('button')].find((button) => button.textContent?.trim() === label)!;
const buttonLabelled = (wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper'], label: string) =>
  wrapper.findAll('button').find((button) => button.text() === label)!;

describe('ProblemGeneralTab', () => {
  it('PATCHes only what changed, locks the fields while in flight and says it saved', async () => {
    const calls = mockApi({
      ...staffViewer(EDIT),
      ...problemEditorRoutes(),
      'PATCH /problems/hcmus41c': ok(editableProblem({ points: 1500 })),
    });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/general');
    await wrapper.get('#problem-points').setValue('1500');
    await buttonLabelled(wrapper, 'Lưu').trigger('click');
    expect(wrapper.get('fieldset').attributes('disabled')).toBeDefined();
    await flushPromises();
    expect(calls.find((call) => call.method === 'PATCH')?.body).toEqual({ points: 1500 });
    expect(wrapper.get('[data-testid="problem-save-bar"]').text()).toContain('Đã lưu lúc');
  });

  it('locks the staff-only basics (summary, og image, date, license) without judge.edit_all_problem, and unlocks them with it', async () => {
    mockApi({ ...staffViewer(EDIT), ...problemEditorRoutes() });
    const own = await mountAdmin('/admin/problems/hcmus41c/general?view=advanced');
    for (const id of ['#problem-summary', '#problem-ogImage', '#problem-date', '#problem-license'])
      expect(own.wrapper.get(id).attributes('disabled'), id).toBeDefined();
    own.wrapper.unmount();
    mockApi({ ...staffViewer(ALL), ...problemEditorRoutes() });
    const all = await mountAdmin('/admin/problems/hcmus41c/general?view=advanced');
    for (const id of ['#problem-summary', '#problem-ogImage', '#problem-date', '#problem-license'])
      expect(all.wrapper.get(id).attributes('disabled'), id).toBeUndefined();
  });

  it('follows a refetch while the form is clean, and keeps the typed value once the viewer has edited', async () => {
    let points = 1200;
    const calls = mockApi({
      ...staffViewer(EDIT),
      ...problemEditorRoutes(),
      'GET /problems/hcmus41c': () => ok(editableProblem({ points })),
      'PATCH /problems/hcmus41c': ok(editableProblem()),
    });
    const { wrapper, queryClient } = await mountAdmin('/admin/problems/hcmus41c/general');
    const pointsBox = () => (wrapper.get('#problem-points').element as HTMLInputElement).value;
    points = 1500;
    await queryClient.invalidateQueries({ queryKey: ['admin', 'problem', 'hcmus41c'] });
    await flushPromises();
    expect(pointsBox()).toBe('1500');
    await buttonLabelled(wrapper, 'Lưu').trigger('click');
    await flushPromises();
    expect(calls.some((call) => call.method === 'PATCH')).toBe(false);

    await wrapper.get('#problem-points').setValue('900');
    points = 1700;
    await queryClient.invalidateQueries({ queryKey: ['admin', 'problem', 'hcmus41c'] });
    await flushPromises();
    expect(pointsBox()).toBe('900');
  });

  it('moves to the new address after the code changes', async () => {
    mockApi({
      ...staffViewer(EDIT),
      ...problemEditorRoutes(),
      'PATCH /problems/hcmus41c': ok(editableProblem({ code: 'hcmus41c2' })),
      'GET /problems/hcmus41c2': ok(editableProblem({ code: 'hcmus41c2' })),
      'GET /problems/hcmus41c2/data': ok(problemData()),
    });
    const { wrapper, router } = await mountAdmin('/admin/problems/hcmus41c/general');
    await wrapper.get('#problem-code').setValue('hcmus41c2');
    await buttonLabelled(wrapper, 'Lưu').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.fullPath).toBe('/admin/problems/hcmus41c2/general');
  });

  it('creates a problem from the new page, or sends a suggestion without judge.add_problem', async () => {
    const calls = mockApi({
      ...staffViewer(['judge.suggest_new_problem']),
      'GET /problems/meta': ok(problemEditingMeta()),
      'POST /problems/suggest': ok(editableProblem({ code: 'newp' })),
    });
    const { wrapper } = await mountAdmin('/admin/problems/new');
    expect(wrapper.findAll('button').some((button) => button.text() === 'Tạo bài')).toBe(false);
    await wrapper.get('#problem-code').setValue('newp');
    await wrapper.get('#problem-name').setValue('New');
    await wrapper.get('#problem-type').setValue(TYPE_GRAPH);
    await buttonLabelled(wrapper, 'Gửi đề xuất bài').trigger('click');
    await flushPromises();
    const body = calls.find((call) => call.path === '/problems/suggest')?.body;
    expect(body).toMatchObject({ code: 'newp', name: 'New', typeIds: [TYPE_GRAPH] });
    for (const field of [
      'authors',
      'curators',
      'bannedUsers',
      'allowedLanguages',
      'organizations',
      'licenseId',
      'summary',
      'date',
    ])
      expect(body, field).not.toHaveProperty(field);
    expect(wrapper.text()).toContain('Đã gửi đề xuất newp.');
  });

  it('creates an organization problem for an org admin without judge.add_problem: fixed prefix, org route', async () => {
    const orgAdmin = sessionUser({
      permissions: ['judge.create_organization_problem', 'judge.edit_own_problem'],
      adminCapabilities: {
        organizations: true,
        problemCreation: { site: false, organizations: true },
        contestCreation: { site: false, organizations: false },
      },
    });
    const calls = mockApi({
      'GET /auth/me': signedIn({ user: orgAdmin }),
      'GET /organizations': page([organizationItem({ problemCodePrefix: 'thpta_' })]),
      'GET /problems/meta': ok(problemEditingMeta()),
      'POST /organizations/thpt-a/problems': ok(editableProblem({ code: 'thpta_bai1' })),
      'GET /problems/thpta_bai1': ok(editableProblem({ code: 'thpta_bai1' })),
      'GET /problems/thpta_bai1/data': ok(problemData({ cases: [] })),
      'GET /profile': ok(profile()),
    });
    const { wrapper } = await mountAdmin('/admin/problems/new?organization=thpt-a');
    await flushPromises();
    expect(wrapper.get('[data-testid="problem-code-prefix"]').text()).toBe('thpta_');
    expect(wrapper.text()).not.toContain('Không thuộc tổ chức');
    expect(wrapper.text()).not.toContain('Gửi đề xuất bài');
    await wrapper.get('#problem-code').setValue('bai1');
    await wrapper.get('#problem-name').setValue('Bài 1');
    await wrapper.get('#problem-type').setValue(TYPE_GRAPH);
    await buttonLabelled(wrapper, 'Tạo bài').trigger('click');
    await flushPromises();
    const post = calls.find((call) => call.method === 'POST');
    expect(post?.path).toBe('/organizations/thpt-a/problems');
    expect(post?.body).toMatchObject({ code: 'thpta_bai1', name: 'Bài 1', typeIds: [TYPE_GRAPH] });
    expect(post?.body).not.toHaveProperty('organizations');
    // The editor opens on the new problem with the setup checklist pointing at the next step.
    await vi.waitFor(() => expect(wrapper.text()).toContain('Tiếp theo:'));
  });

  it('marks the public problem pages and the admin index stale after a save and after a create', async () => {
    mockApi({
      ...staffViewer(EDIT),
      ...problemEditorRoutes(),
      'PATCH /problems/hcmus41c': ok(editableProblem({ points: 1500 })),
    });
    const saved = await mountAdmin('/admin/problems/hcmus41c/general');
    seedCache(saved.queryClient, STALE_AFTER_WRITE);
    await saved.wrapper.get('#problem-points').setValue('1500');
    await buttonLabelled(saved.wrapper, 'Lưu').trigger('click');
    await flushPromises();
    expect(invalidatedKeys(saved.queryClient, STALE_AFTER_WRITE)).toEqual(STALE_AFTER_WRITE);
    saved.wrapper.unmount();

    mockApi({
      ...staffViewer(['judge.add_problem']),
      'GET /problems/meta': ok(problemEditingMeta()),
      'POST /problems': ok(editableProblem({ code: 'newp' })),
    });
    const created = await mountAdmin('/admin/problems/new');
    seedCache(created.queryClient, STALE_AFTER_WRITE);
    await created.wrapper.get('#problem-code').setValue('newp');
    await created.wrapper.get('#problem-name').setValue('New');
    await created.wrapper.get('#problem-type').setValue(TYPE_GRAPH);
    await buttonLabelled(created.wrapper, 'Tạo bài').trigger('click');
    await flushPromises();
    expect(invalidatedKeys(created.queryClient, STALE_AFTER_WRITE)).toEqual(STALE_AFTER_WRITE);
  });

  describe('publishing a private problem', () => {
    const PUBLISH = [...EDIT, 'judge.change_public_visibility'];
    const card = (wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper']) =>
      wrapper.get('[data-testid="problem-visibility"]');
    const openDialog = async (wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper']) => {
      await card(wrapper).get('[data-testid="problem-visibility-open"]').trigger('click');
      await flushPromises();
    };

    it('lists the missing steps and warns before publishing, without blocking it', async () => {
      const calls = mockApi({
        ...staffViewer(PUBLISH),
        ...problemEditorRoutes(),
        'GET /problems/hcmus41c/data': ok(problemData({ cases: [] })),
        'PATCH /problems/hcmus41c': ok(editableProblem({ isPublic: true })),
      });
      const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/general');
      expect(card(wrapper).get('[data-step="tests"]').text()).toBe('Chưa có test');
      expect(card(wrapper).find('[data-step="statement"]').exists()).toBe(false);
      expect(card(wrapper).text()).toContain('Còn thiếu:');
      await openDialog(wrapper);
      expect(document.body.textContent).toContain('Bài chưa xong các bước sau');
      buttonLabelledIn(document.body, 'Vẫn công khai').click();
      await flushPromises();
      expect(calls.find((call) => call.method === 'PATCH')?.body).toEqual({ isPublic: true });
      expect(card(wrapper).text()).toContain('Công khai');
    });

    it('lets an organization creator show an organization-private problem to members without the permission', async () => {
      const orgProblem = editableProblem({
        isOrganizationPrivate: true,
        editor: { ...problemEditor(), canPublishToMembers: true },
      });
      const calls = mockApi({
        ...staffViewer(EDIT),
        ...problemEditorRoutes(orgProblem),
        'PATCH /problems/hcmus41c': ok(editableProblem({ isPublic: true })),
      });
      const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/general');
      expect(card(wrapper).text()).toContain('Hiện cho thành viên');
      await openDialog(wrapper);
      const confirm = [...document.body.querySelectorAll('[role="dialog"] button')].find((button) =>
        /công khai$/i.test(button.textContent?.trim() ?? ''),
      ) as HTMLButtonElement;
      confirm.click();
      await flushPromises();
      expect(calls.find((call) => call.method === 'PATCH')?.body).toEqual({ isPublic: true });
    });

    it('offers no publish button without the permission or the flag', async () => {
      mockApi({ ...staffViewer(EDIT), ...problemEditorRoutes() });
      const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/general');
      expect(card(wrapper).find('[data-testid="problem-visibility-open"]').exists()).toBe(false);
      expect(card(wrapper).text()).toContain('Cần quyền');
    });

    it('publishes without a warning when every step is done', async () => {
      mockApi({
        ...staffViewer(PUBLISH),
        ...problemEditorRoutes(editableProblem({ viewerStatus: 'solved' })),
        'GET /problems/hcmus41c/data': ok(problemData()),
      });
      const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/general');
      await openDialog(wrapper);
      expect(document.body.querySelector('[data-testid="problem-visibility-warning"]')).toBeNull();
    });
  });

  it('brings the Advanced view up when a save is refused for one of its fields', async () => {
    mockApi({
      ...staffViewer(EDIT),
      ...problemEditorRoutes(),
      'PATCH /problems/hcmus41c': invalid(issue('source', 'max_length', 'too long')),
    });
    const { wrapper, router } = await mountAdmin('/admin/problems/hcmus41c/general');
    await wrapper.get('#problem-points').setValue('1500');
    await buttonLabelled(wrapper, 'Lưu').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.query.view).toBe('advanced');
    expect(wrapper.get('#problem-source').attributes('aria-invalid')).toBe('true');
  });

  it('refuses a limit box holding text the browser cannot read instead of sending it', async () => {
    const calls = mockApi({
      ...staffViewer(EDIT),
      ...problemEditorRoutes(),
      'PATCH /problems/hcmus41c': ok(editableProblem()),
    });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/general');
    // A browser reads unparseable text ("256m") in a number box as ''.
    await wrapper.get('#problem-memoryLimit').setValue('');
    await buttonLabelled(wrapper, 'Lưu thay đổi').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('Từ 0 đến 1048576 KiB.');
    expect(calls.some((call) => call.method === 'PATCH')).toBe(false);
  });
});
