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

describe('problem people, status and clone', () => {
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

  it('clones under a new code, links to the copy, marks lists stale; a taken code shows under the box', async () => {
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
    expect(wrapper.get('a[href="/admin/problems/hcmus41c_copy/general"]').text()).toBe(
      'Mở hcmus41c_copy',
    );
    isTaken = true;
    await buttonLabelled(wrapper, 'Nhân bản').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('That code is taken.');
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
});
