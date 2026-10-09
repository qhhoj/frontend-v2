import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { staffViewer, switchNamed } from '@/test/admin-routes';
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
const buttonNamed = (wrapper: Mounted['wrapper'], name: string) =>
  wrapper.findAll('button').find((button) => button.attributes('aria-label') === name)!;
const saveConfig = async (wrapper: Mounted['wrapper']) => {
  await buttonLabelled(wrapper, 'Lưu cấu hình').trigger('click');
  await flushPromises();
};

describe('ProblemDataTab', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('lists the archive, links each file for download and shows the last init.yml failure line by line', async () => {
    mockApi({
      ...staffViewer(EDIT),
      ...problemEditorRoutes(),
      'GET /problems/hcmus41c/data': ok(
        problemData({ feedback: 'Test 14: thiếu tệp "sub2/03.out".\nNhóm 2: tổng điểm khác.' }),
      ),
    });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/data');
    expect(wrapper.text()).toContain('hcmus41c.zip');
    expect(wrapper.find('a[href="/api/internal/problems/hcmus41c/data/files/1.in"]').exists()).toBe(
      true,
    );
    const feedback = wrapper.get('[data-testid="data-feedback"]');
    expect(feedback.attributes('role')).toBe('alert');
    expect(feedback.findAll('li').map((line) => line.text())).toEqual([
      'Test 14: thiếu tệp "sub2/03.out".',
      'Nhóm 2: tổng điểm khác.',
    ]);
  });

  it('PUTs the whole configuration and shows the new feedback from the answer', async () => {
    const calls = mockApi({
      ...staffViewer(EDIT),
      ...problemEditorRoutes(),
      'GET /problems/hcmus41c/data': ok(problemData()),
      'PUT /problems/hcmus41c/data': ok(problemData({ unicode: true })),
    });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/data');
    await switchNamed(wrapper, 'Chấp nhận Unicode').trigger('click');
    await saveConfig(wrapper);
    const body = calls.find((call) => call.method === 'PUT')!.body as {
      unicode: boolean;
      cases: unknown[];
    };
    expect(body.unicode).toBe(true);
    expect(body.cases).toHaveLength(5);
    expect(wrapper.get('[role="status"]').text()).toContain('Đã lưu.');
  });

  it('keeps a broken JSON box from being sent and marks it', async () => {
    const calls = mockApi({
      ...staffViewer(EDIT),
      ...problemEditorRoutes(),
      'GET /problems/hcmus41c/data': ok(problemData()),
    });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/data');
    await wrapper.get('#data-checkerArgs').setValue('{ nope');
    await saveConfig(wrapper);
    expect(calls.some((call) => call.method === 'PUT')).toBe(false);
    expect(wrapper.get('#data-checkerArgs').attributes('aria-invalid')).toBe('true');
  });

  it('keeps a broken per-case JSON box from being saved, and marks that box', async () => {
    const calls = mockApi({
      ...staffViewer(EDIT),
      ...problemEditorRoutes(),
      'GET /problems/hcmus41c/data': ok(problemData()),
    });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/data');
    await wrapper.get('#case-2-checkerArgs').setValue('{ nope');
    expect(wrapper.get('#case-2-checkerArgs').attributes('aria-invalid')).toBe('true');
    await saveConfig(wrapper);
    expect(calls.some((call) => call.method === 'PUT')).toBe(false);
    expect(wrapper.get('[role="alert"]').text()).toContain('Sửa JSON chưa hợp lệ');
  });

  it('moves and removes rows by their labelled buttons and PUTs the new order', async () => {
    const calls = mockApi({
      ...staffViewer(EDIT),
      ...problemEditorRoutes(),
      'GET /problems/hcmus41c/data': ok(problemData()),
      'PUT /problems/hcmus41c/data': ok(problemData()),
    });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/data');
    await buttonNamed(wrapper, 'Chuyển test 3 lên').trigger('click');
    await buttonNamed(wrapper, 'Bỏ test 5').trigger('click');
    await saveConfig(wrapper);
    const body = calls.find((call) => call.method === 'PUT')!.body as {
      cases: { type: string; input: string }[];
    };
    expect(body.cases.map((row) => row.type)).toEqual(['C', 'C', 'S', 'C']);
    expect(body.cases[1]!.input).toBe('sub1/01.in');
  });

  it('shows init.yml as text in a dialog', async () => {
    mockApi({
      ...staffViewer(EDIT),
      ...problemEditorRoutes(),
      'GET /problems/hcmus41c/data': ok(problemData()),
    });
    const answer = globalThis.fetch;
    // `vi.stubGlobal` is undone by `afterEach`, so later specs keep the real mock.
    vi.stubGlobal('fetch', (input: string, init?: RequestInit) =>
      String(input).endsWith('/data/init')
        ? Promise.resolve(new Response('archive: hcmus41c.zip\n'))
        : answer(input, init),
    );
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/data');
    await buttonLabelled(wrapper, 'Xem init.yml').trigger('click');
    await flushPromises();
    expect(document.body.querySelector('[role="dialog"] pre')?.textContent).toBe(
      'archive: hcmus41c.zip\n',
    );
  });

  it('says how many tests there are against the soft and hard limits', async () => {
    mockApi({
      ...staffViewer(EDIT),
      ...problemEditorRoutes(),
      'GET /problems/hcmus41c/data': ok(problemData({ limits: { softCases: 2, maxCases: 300 } })),
    });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/data');
    expect(wrapper.text()).toContain('3 test, vượt ngưỡng khuyến nghị 2.');
    expect(wrapper.text()).toContain(
      'Giới hạn cứng 9999 test cần quyền judge.create_mass_testcases',
    );
  });
});
