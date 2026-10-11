import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { cancelDialog, confirmDialog, openDialog, staffViewer } from '@/test/admin-routes';
import { problemData, problemEditorRoutes } from '@/test/admin-fixtures/problems';

type Mounted = Awaited<ReturnType<typeof mountApp>>;
const EDIT = ['judge.edit_own_problem'];

/** The shell and the data tab load lazily: wait until the checker box is on the page. */
const mountAdmin = async (path: string) => {
  const mounted = await mountApp(path);
  await vi.waitFor(
    () => {
      if (!mounted.wrapper.find('#data-checkerArgs').exists()) throw new Error('tab not yet');
    },
    { timeout: 5000 },
  );
  await flushPromises();
  return mounted;
};

const buttonLabelled = (wrapper: Mounted['wrapper'], label: string) =>
  wrapper.findAll('button').find((button) => button.text() === label)!;
const saveConfig = async (wrapper: Mounted['wrapper']) => {
  await buttonLabelled(wrapper, 'Lưu cấu hình').trigger('click');
  await flushPromises();
};

describe('ProblemDataTab', () => {
  // The first mount loads the lazy admin shell chunk.
  vi.setConfig({ testTimeout: 20_000 });

  afterEach(() => vi.unstubAllGlobals());

  it('PUTs the whole configuration and shows the new feedback from the answer', async () => {
    const calls = mockApi({
      ...staffViewer(EDIT),
      ...problemEditorRoutes(),
      'GET /problems/hcmus41c/data': ok(problemData()),
      'PUT /problems/hcmus41c/data': ok(problemData({ unicode: true })),
    });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/data');
    await wrapper.get('#data-unicode').setValue(true);
    await saveConfig(wrapper);
    const body = calls.find((call) => call.method === 'PUT')!.body as {
      unicode: boolean;
      cases: unknown[];
    };
    expect(body.unicode).toBe(true);
    expect(body.cases).toHaveLength(5);
    expect(wrapper.get('[data-testid="data-save-bar"]').text()).toContain('Đã lưu lúc');
  });

  it('asks before a route leave with unsaved configuration, and Stay keeps it', async () => {
    mockApi({
      'GET /problems': { body: { data: [], meta: { page: 1, pageSize: 20, total: 0 } } },
      ...staffViewer(EDIT),
      ...problemEditorRoutes(),
      'GET /problems/hcmus41c/data': ok(problemData()),
    });
    const { wrapper, router } = await mountAdmin('/admin/problems/hcmus41c/data');
    await wrapper.get('#data-unicode').setValue(true);
    await router.push('/admin/problems');
    await flushPromises();
    expect(openDialog().textContent).toContain('Rời trang?');
    await cancelDialog('Ở lại');
    expect(router.currentRoute.value.fullPath).toBe('/admin/problems/hcmus41c/data');
    await router.push('/admin/problems');
    await flushPromises();
    await confirmDialog('Rời trang');
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/admin/problems'), {
      timeout: 10_000,
    });
  });
});
