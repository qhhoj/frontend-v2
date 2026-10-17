import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { fail, mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { invalidatedKeys, seedCache } from '@/test/cache-probe';
import { confirmDialog, openDialog, staffViewer } from '@/test/admin-routes';
import { editableProblem, problemData, problemEditorRoutes } from '@/test/admin-fixtures/problems';

type Mounted = Awaited<ReturnType<typeof mountApp>>;
const mountedApps: Mounted[] = [];
afterEach(() => mountedApps.splice(0).forEach(({ wrapper }) => wrapper.unmount()));

/** The shell and the general tab load lazily: wait until the form field the tests use is on the page. */
const mountAdmin = async (path: string) => {
  const mounted = await mountApp(path);
  mountedApps.push(mounted);
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

/** "Thêm" in the editor header, then "Nhân bản bài…" in its menu (both menus render into `document.body`). */
async function openClone(wrapper: Mounted['wrapper']) {
  await wrapper
    .findAll('button')
    .find((button) => button.text() === 'Thêm')!
    .trigger('click');
  await flushPromises();
  [...document.body.querySelectorAll('button')]
    .find((button) => button.textContent?.trim() === 'Nhân bản bài…')!
    .click();
  // The menu is a popover (also `role="dialog"`): wait until only the clone dialog is left.
  await vi.waitFor(() => {
    const dialogs = document.body.querySelectorAll('[role="dialog"]');
    if (dialogs.length !== 1 || !dialogs[0]!.querySelector('#problem-clone-code'))
      throw new Error('clone dialog not alone yet');
  });
}

async function typeCloneCode(code: string) {
  const box = document.body.querySelector<HTMLInputElement>('#problem-clone-code')!;
  box.value = code;
  box.dispatchEvent(new Event('input'));
  await flushPromises();
}

describe('problem people, status and clone', () => {
  it('locks authors, curators and banned users without judge.edit_all_problem, and offers no organization to a viewer who manages none', async () => {
    mockApi({ ...staffViewer(['judge.edit_own_problem']), ...problemEditorRoutes() });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/general?view=advanced');
    expect(wrapper.find('[data-testid="people-organizations"] select').exists()).toBe(false);
    for (const list of ['authors', 'curators', 'bannedUsers'])
      expect(
        wrapper.get(`[data-testid="people-${list}"] input`).attributes('disabled'),
        list,
      ).toBeDefined();
    expect(
      wrapper.get('[data-testid="people-testers"] input').attributes('disabled'),
    ).toBeUndefined();
  });

  it('locks each status checkbox behind its own permission', async () => {
    mockApi({
      ...staffViewer(['judge.edit_own_problem', 'judge.change_public_visibility']),
      ...problemEditorRoutes(),
    });
    const { wrapper, router } = await mountAdmin('/admin/problems/hcmus41c/general?view=advanced');
    expect(wrapper.get('#problem-isManuallyManaged').attributes('disabled')).toBeDefined();
    expect(wrapper.get('#problem-isFullMarkup').attributes('disabled')).toBeDefined();
    await router.push('/admin/problems/hcmus41c/general');
    await flushPromises();
    expect(wrapper.find('[data-testid="problem-visibility-open"]').exists()).toBe(true);
  });

  it('clones under a new code from the header menu and opens the copy; a taken code shows under the box', async () => {
    let isTaken = true;
    mockApi({
      ...staffViewer(['judge.edit_own_problem', 'judge.clone_problem']),
      ...problemEditorRoutes(),
      // The backend answers a taken code with `fields.code` only (English text, no issue code).
      'POST /problems/hcmus41c/clone': () =>
        isTaken
          ? fail(400, 'validation_failed', { code: ['That code is taken.'] })
          : ok(editableProblem({ code: 'hcmus41c_copy' })),
      'GET /problems/hcmus41c_copy': ok(editableProblem({ code: 'hcmus41c_copy' })),
      'GET /problems/hcmus41c_copy/data': ok(problemData()),
    });
    const { wrapper, queryClient, router } = await mountAdmin('/admin/problems/hcmus41c/general');
    const keys = [
      ['problems', 'list', 'probe'],
      ['admin', 'index', 'problems', 'probe'],
    ];
    seedCache(queryClient, keys);
    await openClone(wrapper);
    await typeCloneCode('hcmus41c_copy');
    await confirmDialog('Nhân bản');
    expect(openDialog().textContent).toContain('That code is taken.');
    isTaken = false;
    await confirmDialog('Nhân bản');
    expect(invalidatedKeys(queryClient, keys)).toEqual(keys);
    expect(router.currentRoute.value.fullPath).toBe('/admin/problems/hcmus41c_copy/general');
  });

  it('hides clone without judge.clone_problem', async () => {
    mockApi({ ...staffViewer(['judge.edit_own_problem']), ...problemEditorRoutes() });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/general');
    expect(wrapper.findAll('button').some((button) => button.text() === 'Thêm')).toBe(false);
  });

  it('keeps the clone box out of the save form, so Enter there can never save the problem', async () => {
    const calls = mockApi({
      ...staffViewer(['judge.edit_own_problem', 'judge.clone_problem']),
      ...problemEditorRoutes(),
      'POST /problems/hcmus41c/clone': ok(editableProblem({ code: 'hcmus41c_copy' })),
      'GET /problems/hcmus41c_copy': ok(editableProblem({ code: 'hcmus41c_copy' })),
      'GET /problems/hcmus41c_copy/data': ok(problemData()),
    });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/general');
    await openClone(wrapper);
    const box = document.body.querySelector<HTMLInputElement>('#problem-clone-code')!;
    expect(box.closest('#problem-general-form')).toBeNull();
    await typeCloneCode('hcmus41c_copy');
    box.form!.requestSubmit();
    await flushPromises();
    expect(calls.some((call) => call.method === 'PATCH')).toBe(false);
    expect(calls.some((call) => call.path === '/problems/hcmus41c/clone')).toBe(true);
  });
});
