import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import type { PolygonSyncRun } from '@/api/types/polygon';
import { mockApi, ok, page } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { staffViewer } from '@/test/admin-routes';
import { polygonProblem } from '@/test/admin-fixtures/polygon';

type Wrapper = Awaited<ReturnType<typeof mountApp>>['wrapper'];

const run = (overrides: Partial<PolygonSyncRun> = {}): PolygonSyncRun => ({
  id: 'run-1',
  problemId: 'p-1',
  code: 'xau_doi_xung',
  polygonProblemId: 415660,
  polygonName: 'xau-doi-xung',
  revision: 11,
  packageId: 7,
  packageCreatedAt: '2026-10-02T03:00:00Z',
  purpose: 'sync',
  trigger: 'manual',
  requestedBy: { id: 'u-1', username: 'thu.tran', rating: null },
  result: 'ok',
  failedStep: null,
  error: null,
  finishedAt: '2026-10-03T03:00:00Z',
  ...overrides,
});
const routes = (permissions: string[]) => ({
  ...staffViewer(['judge.import_polygon_package', ...permissions]),
  'GET /polygon/status': ok({ connected: true, accountName: 'qhhoj' }),
  'GET /polygon/problems': ok([polygonProblem()]),
  'GET /polygon/syncs': page([
    run({
      id: 'run-2',
      trigger: 'auto',
      result: 'failed',
      failedStep: 'tests',
      error: 'too many tests',
    }),
    run(),
  ]),
});
const mountWizard = async () => {
  const mounted = await mountApp('/admin/problems/polygon');
  await vi.waitFor(() => expect(mounted.wrapper.find('[data-polygon-id]').exists()).toBe(true), {
    timeout: 5000,
  });
  return mounted.wrapper;
};
const openAllSyncs = async (wrapper: Wrapper) => {
  const details = wrapper.get('[data-testid="polygon-all-syncs"]');
  (details.element as HTMLDetailsElement).open = true;
  await details.trigger('toggle');
  await vi.waitFor(() => expect(wrapper.findAll('[data-run-result]')).toHaveLength(2), {
    timeout: 5000,
  });
};

describe('Polygon sync history on the wizard page', () => {
  it('lists every run with its problem, and says where a failed one stopped and why', async () => {
    const calls = mockApi(routes(['judge.edit_all_problem']));
    const wrapper = await mountWizard();
    expect(calls.some((call) => call.path.startsWith('/polygon/syncs'))).toBe(false);
    await openAllSyncs(wrapper);
    const [failed, succeeded] = wrapper.findAll('[data-run-result]');
    expect(failed!.attributes('data-run-result')).toBe('failed');
    expect(failed!.text()).toContain('xau_doi_xung');
    expect(failed!.text()).toContain('Tự động');
    expect(failed!.text()).toContain('Dừng ở bước: tải test lên.');
    expect(failed!.text()).toContain('too many tests');
    expect(succeeded!.text()).toContain('Thủ công');
    expect(succeeded!.text()).not.toContain('Dừng ở bước');
  });

  it('is not offered without judge.edit_all_problem', async () => {
    mockApi(routes([]));
    const wrapper = await mountWizard();
    await flushPromises();
    expect(wrapper.find('[data-testid="polygon-all-syncs"]').exists()).toBe(false);
  });
});
