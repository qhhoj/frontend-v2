import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { cancelDialog, confirmDialog, openDialog, staffViewer } from '@/test/admin-routes';
import { problemData, problemEditorRoutes, testCase } from '@/test/admin-fixtures/problems';

type Mounted = Awaited<ReturnType<typeof mountApp>>;
const EDIT = ['judge.edit_own_problem'];

/** The shell and the data tab load lazily: wait until the checker box is on the page. */
const mountAdmin = async (path: string) => {
  const mounted = await mountApp(path);
  await vi.waitFor(
    () => {
      if (!mounted.wrapper.find('[data-testid="data-save-bar"]').exists())
        throw new Error('tab not yet');
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
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/data?view=advanced');
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

  it('sends a migrated configuration back unchanged apart from the edit', async () => {
    // As the migration stored it: grader args `{}`, a custom checker with its legacy args.
    const migrated = problemData({
      customChecker: 'chk.cpp',
      checker: 'bridged',
      checkerArgs: { files: 'chk.cpp', lang: 'CPP17', type: 'testlib' },
      graderArgs: {},
    });
    const calls = mockApi({
      ...staffViewer(EDIT),
      ...problemEditorRoutes(),
      'GET /problems/hcmus41c/data': ok(migrated),
      'PUT /problems/hcmus41c/data': ok(migrated),
    });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/data?view=advanced');
    await wrapper.get('#data-unicode').setValue(true);
    await saveConfig(wrapper);
    const body = calls.find((call) => call.method === 'PUT')!.body;
    expect(body).toEqual({
      checker: 'bridged',
      checkerArgs: migrated.checkerArgs,
      grader: 'standard',
      graderArgs: {},
      outputPrefix: null,
      outputLimit: null,
      unicode: true,
      nobigmath: false,
      cases: migrated.cases,
    });
  });

  /** The configuration a Polygon sync leaves: other tests and checker. The GET answers `before` until `synced` is set. */
  const syncedData = problemData({
    checker: 'floats',
    checkerArgs: { precision: 6 },
    cases: [testCase({ type: 'C', input: 'p/1.in', output: 'p/1.out', points: 100 })],
    archiveFiles: ['p/1.in', 'p/1.out'],
  });
  const syncRoutes = () => {
    const server = { data: problemData() };
    const calls = mockApi({
      ...staffViewer(EDIT),
      ...problemEditorRoutes(),
      'GET /problems/hcmus41c/data': () => ok(server.data),
      'PUT /problems/hcmus41c/data': (call) => ok({ ...server.data, ...(call.body as object) }),
    });
    return { server, calls };
  };
  /** What the Polygon card does when a sync ends: every admin query is read again. */
  const finishSync = async (queryClient: Mounted['queryClient']) => {
    await queryClient.invalidateQueries({ queryKey: ['admin'] });
    await flushPromises();
  };

  it('follows a sync while the form is clean, so the next save keeps the synced tests and checker', async () => {
    const { server, calls } = syncRoutes();
    const { wrapper, queryClient } = await mountAdmin(
      '/admin/problems/hcmus41c/data?view=advanced',
    );
    server.data = syncedData;
    await finishSync(queryClient);
    await wrapper.get('#data-unicode').setValue(true);
    await saveConfig(wrapper);
    const body = calls.find((call) => call.method === 'PUT')!.body as {
      checker: string;
      cases: unknown[];
    };
    expect(body.checker).toBe('floats');
    expect(body.cases).toEqual(syncedData.cases);
  });

  it('keeps an unsaved edit when a sync ends', async () => {
    const { server, calls } = syncRoutes();
    const { wrapper, queryClient } = await mountAdmin(
      '/admin/problems/hcmus41c/data?view=advanced',
    );
    await wrapper.get('#data-unicode').setValue(true);
    server.data = syncedData;
    await finishSync(queryClient);
    expect((wrapper.get('#data-unicode').element as HTMLInputElement).checked).toBe(true);
    await saveConfig(wrapper);
    const body = calls.find((call) => call.method === 'PUT')!.body as { unicode: boolean };
    expect(body.unicode).toBe(true);
  });

  it('sets file I/O from the controls and refuses to save a name the judge would reject', async () => {
    const calls = mockApi({
      ...staffViewer(EDIT),
      ...problemEditorRoutes(),
      'GET /problems/hcmus41c/data': ok(problemData()),
      'PUT /problems/hcmus41c/data': ok(problemData()),
    });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/data');
    await wrapper.get('[data-testid="data-io-method-file"] input').setValue(true);
    await wrapper.get('#data-io_input_file').setValue('../SUM.INP');
    await wrapper.get('#data-io_output_file').setValue('SUM.OUT');
    await saveConfig(wrapper);
    expect(calls.some((call) => call.method === 'PUT')).toBe(false);
    await wrapper.get('#data-io_input_file').setValue('SUM.INP');
    await saveConfig(wrapper);
    const body = calls.find((call) => call.method === 'PUT')!.body as { graderArgs: unknown };
    expect(body.graderArgs).toEqual({
      io_method: 'file',
      io_input_file: 'SUM.INP',
      io_output_file: 'SUM.OUT',
    });
  });

  it('sends nothing while the configuration is unchanged', async () => {
    const calls = mockApi({
      ...staffViewer(EDIT),
      ...problemEditorRoutes(),
      'GET /problems/hcmus41c/data': ok(problemData()),
    });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/data');
    await saveConfig(wrapper);
    expect(calls.some((call) => call.method === 'PUT')).toBe(false);
  });

  it('asks before a route leave with unsaved configuration, and Stay keeps it', async () => {
    mockApi({
      'GET /problems': { body: { data: [], meta: { page: 1, pageSize: 20, total: 0 } } },
      ...staffViewer(EDIT),
      ...problemEditorRoutes(),
      'GET /problems/hcmus41c/data': ok(problemData()),
    });
    const { wrapper, router } = await mountAdmin('/admin/problems/hcmus41c/data?view=advanced');
    await wrapper.get('#data-unicode').setValue(true);
    await router.push('/admin/problems');
    await flushPromises();
    expect(openDialog().textContent).toContain('Rời trang?');
    await cancelDialog('Ở lại');
    expect(router.currentRoute.value.fullPath).toBe('/admin/problems/hcmus41c/data?view=advanced');
    await router.push('/admin/problems');
    await flushPromises();
    await confirmDialog('Rời trang');
    await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/admin/problems'), {
      timeout: 10_000,
    });
  });

  it('brings the Advanced view up when a save is blocked by one of its options, and flags it', async () => {
    const calls = mockApi({
      ...staffViewer(EDIT),
      ...problemEditorRoutes(),
      'GET /problems/hcmus41c/data': ok(
        problemData({ checker: 'floats', checkerArgs: { precision: 99 } }),
      ),
    });
    const { wrapper, router } = await mountAdmin('/admin/problems/hcmus41c/data');
    await wrapper.get('[data-testid="data-io-method-file"] input').setValue(true);
    await wrapper.get('#data-io_input_file').setValue('BAI.INP');
    await wrapper.get('#data-io_output_file').setValue('BAI.OUT');
    await saveConfig(wrapper);
    expect(calls.some((call) => call.method === 'PUT')).toBe(false);
    expect(router.currentRoute.value.query.view).toBe('advanced');
    expect(wrapper.get('#data-checker-precision').attributes('aria-invalid')).toBe('true');
    expect(wrapper.find('[data-testid="editor-view-advanced-alert"]').exists()).toBe(true);
  });

  it('counts a non-default Advanced option on the Advanced tab while showing the Basic view', async () => {
    mockApi({
      ...staffViewer(EDIT),
      ...problemEditorRoutes(),
      'GET /problems/hcmus41c/data': ok(problemData({ unicode: true })),
    });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/data');
    expect(wrapper.get('[data-testid="editor-view-advanced-count"]').text()).toBe('1');
  });
});
