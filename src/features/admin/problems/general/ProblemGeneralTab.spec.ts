import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mockApi, ok, page } from '@/test/mock-api';
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
      if (!mounted.wrapper.find('#problem-code').exists()) throw new Error('form not yet');
    },
    { timeout: 5000 },
  );
  await flushPromises();
  return mounted;
};

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
    await buttonLabelled(wrapper, 'Lưu thay đổi').trigger('click');
    expect(wrapper.get('fieldset').attributes('disabled')).toBeDefined();
    await flushPromises();
    expect(calls.find((call) => call.method === 'PATCH')?.body).toEqual({ points: 1500 });
    expect(wrapper.get('[data-testid="problem-save-bar"]').text()).toContain('Đã lưu lúc');
  });

  it('locks the staff-only basics (summary, og image, date, license) without judge.edit_all_problem, and unlocks them with it', async () => {
    mockApi({ ...staffViewer(EDIT), ...problemEditorRoutes() });
    const own = await mountAdmin('/admin/problems/hcmus41c/general');
    for (const id of ['#problem-summary', '#problem-ogImage', '#problem-date', '#problem-license'])
      expect(own.wrapper.get(id).attributes('disabled'), id).toBeDefined();
    own.wrapper.unmount();
    mockApi({ ...staffViewer(ALL), ...problemEditorRoutes() });
    const all = await mountAdmin('/admin/problems/hcmus41c/general');
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
    await buttonLabelled(wrapper, 'Lưu thay đổi').trigger('click');
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
    await buttonLabelled(wrapper, 'Lưu thay đổi').trigger('click');
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
    await buttonLabelled(saved.wrapper, 'Lưu thay đổi').trigger('click');
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
    const tickPublic = (wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper']) =>
      wrapper.get('#problem-isPublic').setValue(true);

    it('warns when the problem has no test cases, without blocking the save', async () => {
      mockApi({
        ...staffViewer(PUBLISH),
        ...problemEditorRoutes(),
        'GET /problems/hcmus41c/data': ok(problemData({ cases: [] })),
      });
      const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/general');
      await tickPublic(wrapper);
      await flushPromises();
      const note = wrapper.get('[data-testid="publish-readiness"]');
      expect(note.text()).toContain('chưa có test nào');
      expect(buttonLabelled(wrapper, 'Lưu thay đổi').attributes('aria-disabled')).toBeUndefined();
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
      expect(wrapper.get('#problem-isPublic').attributes('disabled')).toBeUndefined();
      expect(wrapper.text()).toContain('chỉ thành viên tổ chức thấy');
      await tickPublic(wrapper);
      await buttonLabelled(wrapper, 'Lưu thay đổi').trigger('click');
      await flushPromises();
      expect(calls.find((call) => call.method === 'PATCH')?.body).toEqual({ isPublic: true });
    });

    it('keeps Public locked without the permission or the flag', async () => {
      mockApi({ ...staffViewer(EDIT), ...problemEditorRoutes() });
      const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/general');
      expect(wrapper.get('#problem-isPublic').attributes('disabled')).toBeDefined();
    });

    it('says nothing when the cases carry points', async () => {
      mockApi({
        ...staffViewer(PUBLISH),
        ...problemEditorRoutes(),
        'GET /problems/hcmus41c/data': ok(problemData()),
      });
      const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/general');
      await tickPublic(wrapper);
      await flushPromises();
      expect(wrapper.find('[data-testid="publish-readiness"]').exists()).toBe(false);
    });
  });
});
