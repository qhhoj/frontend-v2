import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mockApi, ok, rateLimited, sequence } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { staffViewer } from '@/test/admin-routes';
import { problemEditingMeta } from '@/test/admin-fixtures/problems';

const PERMS = ['judge.import_polygon_package', 'judge.add_problem'];
const STEP_OF: Record<string, string> = {
  active: 'statements',
  completed: 'done',
  failed: 'failed',
};
const job = (state: string, extra = {}) =>
  ok({
    id: 'job-1',
    state,
    step: STEP_OF[state] ?? 'queued',
    progress: null,
    result: null,
    error: null,
    ...extra,
  });

const start = async (wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper']) => {
  /** The screen is a lazy route: the form is there once its chunk has loaded. */
  await vi.waitFor(() =>
    expect(wrapper.find('[data-testid="polygon-file"] input').exists()).toBe(true),
  );
  const input = wrapper.get('[data-testid="polygon-file"] input');
  Object.defineProperty(input.element, 'files', { value: [new File(['zip'], 'p.zip')] });
  await input.trigger('change');
  await wrapper.get('#import-code').setValue('hcmus41c');
  await wrapper.get('form').trigger('submit');
  await flushPromises();
};

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => vi.useRealTimers());

describe('ZipImportPage', () => {
  it('shows the job step (no download for a zip), keeps polling every 2 s and links the problem when done', async () => {
    const calls = mockApi({
      ...staffViewer(PERMS),
      'GET /problems/meta': ok(problemEditingMeta()),
      'POST /problems/imports': { status: 202, body: { data: { jobId: 'job-1' } } },
      'GET /problems/imports/job-1': sequence(
        job('delayed'),
        job('active'),
        job('completed', { result: { problemId: 'p', code: 'hcmus41c' } }),
      ),
    });
    const { wrapper } = await mountApp('/admin/problems/import');
    await start(wrapper);
    expect(wrapper.get('[aria-current="step"]').text()).toContain('Đã xếp hàng');
    expect(wrapper.find('[data-step="downloading"]').exists()).toBe(false);
    await vi.advanceTimersByTimeAsync(2000);
    await flushPromises();
    expect(wrapper.get('[aria-current="step"]').text()).toContain('Chuyển đề bài');
    await vi.advanceTimersByTimeAsync(2000);
    await flushPromises();
    expect(wrapper.get('a[href="/admin/problems/hcmus41c/general"]').text()).toBe('Mở hcmus41c');
    const polls = calls.filter((call) => call.path === '/problems/imports/job-1').length;
    await vi.advanceTimersByTimeAsync(6000);
    expect(calls.filter((call) => call.path === '/problems/imports/job-1')).toHaveLength(polls);
  });

  it('shows the importer error, or a generic line when the error is null, never "null"', async () => {
    mockApi({
      ...staffViewer(PERMS),
      'GET /problems/meta': ok(problemEditingMeta()),
      'POST /problems/imports': { status: 202, body: { data: { jobId: 'job-1' } } },
      'GET /problems/imports/job-1': job('failed', { error: null }),
    });
    const { wrapper } = await mountApp('/admin/problems/import');
    await start(wrapper);
    expect(wrapper.get('[role="alert"]').text()).toContain(
      'Không nhập được. Hệ thống không cho biết thêm lý do.',
    );
    expect(wrapper.text()).not.toContain('null');
  });

  it('says the hourly import limit and how long to wait when starting is refused with 429', async () => {
    mockApi({
      ...staffViewer(PERMS),
      'GET /problems/meta': ok(problemEditingMeta()),
      'POST /problems/imports': rateLimited(1500),
    });
    const { wrapper } = await mountApp('/admin/problems/import');
    await start(wrapper);
    expect(wrapper.get('[role="alert"]').text()).toContain('Tối đa 10 lượt nhập mỗi giờ.');
    expect(wrapper.get('[role="alert"]').text()).toContain('Thử lại sau 1500 giây.');
  });

  it('stops polling when the page is left', async () => {
    const calls = mockApi({
      ...staffViewer(PERMS),
      'GET /problems/meta': ok(problemEditingMeta()),
      'POST /problems/imports': { status: 202, body: { data: { jobId: 'job-1' } } },
      'GET /problems/imports/job-1': job('active'),
    });
    const { wrapper, router } = await mountApp('/admin/problems/import');
    await start(wrapper);
    await router.push('/admin');
    await flushPromises();
    const polls = calls.filter((call) => call.path === '/problems/imports/job-1').length;
    await vi.advanceTimersByTimeAsync(6000);
    expect(calls.filter((call) => call.path === '/problems/imports/job-1')).toHaveLength(polls);
  });

  it('disables a mode the viewer may not use, says which permission it needs, and sends nothing', async () => {
    const calls = mockApi({
      ...staffViewer(['judge.import_polygon_package']),
      'GET /problems/meta': ok(problemEditingMeta()),
      'POST /problems/imports': { status: 202, body: { data: { jobId: 'job-1' } } },
    });
    const { wrapper } = await mountApp('/admin/problems/import');
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="polygon-file"] input').exists()).toBe(true),
    );
    const radios = wrapper.findAll('input[name="import-mode"]');
    expect(radios.map((radio) => (radio.element as HTMLInputElement).disabled)).toEqual([
      true,
      true,
    ]);
    expect(wrapper.text()).toContain('Cần quyền judge.add_problem');
    expect(wrapper.text()).toContain('Cần quyền judge.edit_own_problem');
    await start(wrapper);
    expect(calls.filter((call) => call.method === 'POST')).toHaveLength(0);
  });

  it('starts on update for a viewer who may only edit, and leaves create disabled', async () => {
    mockApi({
      ...staffViewer(['judge.import_polygon_package', 'judge.edit_own_problem']),
      'GET /problems/meta': ok(problemEditingMeta()),
    });
    const { wrapper } = await mountApp('/admin/problems/import');
    await vi.waitFor(() => expect(wrapper.find('input[name="import-mode"]').exists()).toBe(true));
    const [create, update] = wrapper
      .findAll('input[name="import-mode"]')
      .map((radio) => radio.element as HTMLInputElement);
    expect(create!.disabled).toBe(true);
    expect(update!.checked).toBe(true);
  });

  it('stops polling on a 404 and says the import was not found', async () => {
    const calls = mockApi({
      ...staffViewer(PERMS),
      'GET /problems/meta': ok(problemEditingMeta()),
      'POST /problems/imports': { status: 202, body: { data: { jobId: 'job-1' } } },
      'GET /problems/imports/job-1': {
        status: 404,
        body: { error: { code: 'not_found', message: 'No such import' } },
      },
    });
    const { wrapper } = await mountApp('/admin/problems/import');
    await start(wrapper);
    expect(wrapper.get('[role="alert"]').text()).toContain('Không tìm thấy lượt nhập này.');
    const polls = calls.filter((call) => call.path === '/problems/imports/job-1').length;
    await vi.advanceTimersByTimeAsync(10000);
    expect(calls.filter((call) => call.path === '/problems/imports/job-1')).toHaveLength(polls);
  });
});
