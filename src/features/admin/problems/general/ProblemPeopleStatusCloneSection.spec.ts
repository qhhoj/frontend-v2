import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { fail, mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { invalidatedKeys, seedCache } from '@/test/cache-probe';
import { staffViewer, switchNamed } from '@/test/admin-routes';
import { editableProblem, problemEditorRoutes } from '@/test/admin-fixtures/problems';

type Mounted = Awaited<ReturnType<typeof mountApp>>;
const mountedApps: Mounted[] = [];
afterEach(() => mountedApps.splice(0).forEach(({ wrapper }) => wrapper.unmount()));

/** The shell and the general tab load lazily: wait until the form field the tests use is on the page. */
const mountAdmin = async (path: string) => {
  const mounted = await mountApp(path);
  mountedApps.push(mounted);
  await vi.waitFor(
    () => {
      if (!mounted.wrapper.find('#problem-code').exists()) throw new Error('form not yet');
    },
    { timeout: 5000 },
  );
  await flushPromises();
  return mounted;
};

const buttonLabelled = (wrapper: Mounted['wrapper'], label: string) =>
  wrapper.findAll('button').find((button) => button.text() === label)!;

const save = async (wrapper: Mounted['wrapper']) => {
  await buttonLabelled(wrapper, 'Lưu thay đổi').trigger('click');
  await flushPromises();
};

describe('problem people, status and clone', () => {
  it('adds a tester by exact username and PATCHes the tester ids', async () => {
    const calls = mockApi({
      ...staffViewer(['judge.edit_own_problem']),
      ...problemEditorRoutes(),
      'GET /users/ngocanh': ok({ id: 'id-ngocanh', username: 'ngocanh' }),
      'PATCH /problems/hcmus41c': ok(editableProblem()),
    });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/general');
    const testers = wrapper.get('[data-testid="people-testers"] input');
    await testers.setValue('ngocanh');
    await testers.trigger('keydown', { key: 'Enter' });
    await flushPromises();
    await save(wrapper);
    expect(calls.find((call) => call.method === 'PATCH')?.body).toEqual({
      testers: ['0192a000-0000-7000-8000-0000000000bb', 'id-ngocanh'],
    });
  });

  it('locks authors, curators, banned users and organizations without judge.edit_all_problem', async () => {
    mockApi({ ...staffViewer(['judge.edit_own_problem']), ...problemEditorRoutes() });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/general');
    for (const list of ['authors', 'curators', 'bannedUsers', 'organizations'])
      expect(
        wrapper.get(`[data-testid="people-${list}"] input`).attributes('disabled'),
        list,
      ).toBeDefined();
    expect(
      wrapper.get('[data-testid="people-testers"] input').attributes('disabled'),
    ).toBeUndefined();
  });

  it('locks each status switch behind its own permission', async () => {
    mockApi({
      ...staffViewer(['judge.edit_own_problem', 'judge.change_public_visibility']),
      ...problemEditorRoutes(),
    });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/general');
    expect(switchNamed(wrapper, 'Công khai').attributes('aria-disabled')).toBeUndefined();
    expect(switchNamed(wrapper, 'Quản lý thủ công').attributes('aria-disabled')).toBe('true');
    expect(switchNamed(wrapper, 'Cho phép markup đầy đủ').attributes('aria-disabled')).toBe('true');
  });

  it('clones under a new code and links to the copy; a taken code shows under the box', async () => {
    let isTaken = false;
    mockApi({
      ...staffViewer(['judge.edit_own_problem', 'judge.clone_problem']),
      ...problemEditorRoutes(),
      // The backend answers a taken code with `fields.code` only (English text, no issue code).
      'POST /problems/hcmus41c/clone': () =>
        isTaken
          ? fail(400, 'validation_failed', { code: ['That code is taken.'] })
          : ok(editableProblem({ code: 'hcmus41c_copy' })),
    });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/general');
    await wrapper.get('#problem-clone-code').setValue('hcmus41c_copy');
    await buttonLabelled(wrapper, 'Nhân bản').trigger('click');
    await flushPromises();
    expect(wrapper.get('a[href="/admin/problems/hcmus41c_copy/general"]').text()).toBe(
      'Mở hcmus41c_copy',
    );
    isTaken = true;
    await buttonLabelled(wrapper, 'Nhân bản').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('That code is taken.');
  });

  it('refuses a clone code the backend would refuse, sends nothing, and says why under the box', async () => {
    const calls = mockApi({
      ...staffViewer(['judge.edit_own_problem', 'judge.clone_problem']),
      ...problemEditorRoutes(),
    });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/general');
    await wrapper.get('#problem-clone-code').setValue('Bad Code');
    await buttonLabelled(wrapper, 'Nhân bản').trigger('click');
    await flushPromises();
    expect(calls.some((call) => call.path.endsWith('/clone'))).toBe(false);
    expect(wrapper.get('#problem-clone-code').attributes('aria-invalid')).toBe('true');
    expect(wrapper.text()).toContain('Chữ thường, số, gạch dưới, 1 đến 32 ký tự.');
  });

  it('hides clone without judge.clone_problem', async () => {
    mockApi({ ...staffViewer(['judge.edit_own_problem']), ...problemEditorRoutes() });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/general');
    expect(wrapper.find('#problem-clone-code').exists()).toBe(false);
  });

  it('keeps the clone box outside the save form, so Enter there can never save the problem', async () => {
    const calls = mockApi({
      ...staffViewer(['judge.edit_own_problem', 'judge.clone_problem']),
      ...problemEditorRoutes(),
    });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/general');
    expect(wrapper.get('#problem-clone-code').element.closest('form')).toBeNull();
    await wrapper.get('#problem-clone-code').trigger('keydown', { key: 'Enter' });
    expect(calls.some((call) => call.method === 'PATCH')).toBe(false);
  });

  it('sends a status switch that was turned on as true in the PATCH body', async () => {
    const calls = mockApi({
      ...staffViewer(['judge.edit_own_problem', 'judge.change_public_visibility']),
      ...problemEditorRoutes(),
      'PATCH /problems/hcmus41c': ok(editableProblem()),
    });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/general');
    await switchNamed(wrapper, 'Công khai').trigger('click');
    await save(wrapper);
    expect(calls.find((call) => call.method === 'PATCH')?.body).toEqual({ isPublic: true });
  });

  it('adds an organization by exact slug for a viewer who may edit every problem', async () => {
    const calls = mockApi({
      ...staffViewer(['judge.edit_own_problem', 'judge.edit_all_problem']),
      ...problemEditorRoutes(),
      'GET /organizations/thpt-hung-vuong': ok({ id: 'org-a', slug: 'thpt-hung-vuong' }),
      'PATCH /problems/hcmus41c': ok(editableProblem()),
    });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/general');
    const organizations = wrapper.get('[data-testid="people-organizations"] input');
    await organizations.setValue('thpt-hung-vuong');
    await organizations.trigger('keydown', { key: 'Enter' });
    await flushPromises();
    await save(wrapper);
    expect(calls.find((call) => call.method === 'PATCH')?.body).toEqual({
      organizations: ['org-a'],
    });
  });

  it('marks the public problem pages and the admin index stale after a clone', async () => {
    mockApi({
      ...staffViewer(['judge.edit_own_problem', 'judge.clone_problem']),
      ...problemEditorRoutes(),
      'POST /problems/hcmus41c/clone': ok(editableProblem({ code: 'hcmus41c_copy' })),
    });
    const { wrapper, queryClient } = await mountAdmin('/admin/problems/hcmus41c/general');
    const keys = [
      ['problems', 'list', 'probe'],
      ['admin', 'index', 'problems', 'probe'],
    ];
    seedCache(queryClient, keys);
    await wrapper.get('#problem-clone-code').setValue('hcmus41c_copy');
    await buttonLabelled(wrapper, 'Nhân bản').trigger('click');
    await flushPromises();
    expect(invalidatedKeys(queryClient, keys)).toEqual(keys);
  });
});
