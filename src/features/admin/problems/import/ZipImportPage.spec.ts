import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mockApi, ok, page, sequence } from '@/test/mock-api';
import { organizationItem, sessionUser, signedIn } from '@/test/fixtures';
import { mountApp } from '@/test/mount';
import { staffViewer } from '@/test/admin-routes';
import { problemEditingMeta } from '@/test/admin-fixtures/problems';

const PERMS = ['judge.add_problem'];
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

  it('disables a mode the viewer may not use and says which permission it needs', async () => {
    mockApi({
      ...staffViewer(['judge.edit_own_problem']),
      'GET /problems/meta': ok(problemEditingMeta()),
    });
    const { wrapper } = await mountApp('/admin/problems/import');
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="polygon-file"] input').exists()).toBe(true),
    );
    const radios = wrapper.findAll('input[name="import-mode"]');
    expect(radios.map((radio) => (radio.element as HTMLInputElement).disabled)).toEqual([
      true,
      false,
    ]);
    expect(wrapper.text()).toContain('Cần quyền “Tạo bài”');
    expect(wrapper.text()).not.toContain('Cần quyền “Sửa bài của mình”');
  });

  it('imports into the only administered organization for a teacher without judge.add_problem', async () => {
    const teacher = sessionUser({
      isStaff: true,
      permissions: ['judge.create_organization_problem'],
      adminCapabilities: {
        organizations: true,
        problemCreation: { site: false, organizations: true },
        contestCreation: { site: false, organizations: false },
      },
    });
    const calls = mockApi({
      ...staffViewer(),
      'GET /auth/me': signedIn({ user: teacher }),
      'GET /organizations': page([organizationItem()]),
      'GET /problems/meta': ok(problemEditingMeta()),
      'POST /problems/imports': { status: 202, body: { data: { jobId: 'job-1' } } },
      'GET /problems/imports/job-1': job('active'),
    });
    const { wrapper } = await mountApp('/admin/problems/import');
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="problem-code-prefix"]').exists()).toBe(true),
    );
    expect(wrapper.get('[data-testid="creation-owner"]').text()).toContain('THPT A');
    expect(wrapper.text()).not.toContain('Không thuộc tổ chức');
    await start(wrapper);
    const post = calls.find((call) => call.method === 'POST');
    expect(post?.query.get('organization')).toBe('thpt-a');
    expect(post?.query.get('code')).toBe('thpta_hcmus41c');
  });

  it('imports a site problem without an organization for a site creator', async () => {
    const calls = mockApi({
      ...staffViewer(PERMS),
      'GET /problems/meta': ok(problemEditingMeta()),
      'POST /problems/imports': { status: 202, body: { data: { jobId: 'job-1' } } },
      'GET /problems/imports/job-1': job('active'),
    });
    const { wrapper } = await mountApp('/admin/problems/import');
    await start(wrapper);
    const post = calls.find((call) => call.method === 'POST');
    expect(post?.query.has('organization')).toBe(false);
    expect(post?.query.get('code')).toBe('hcmus41c');
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
