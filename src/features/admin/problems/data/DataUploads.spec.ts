import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { confirmDialog, staffViewer } from '@/test/admin-routes';
import { problemData, problemEditorRoutes } from '@/test/admin-fixtures/problems';

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

describe('test data uploads', () => {
  // The first mount loads the lazy admin shell chunk.
  vi.setConfig({ testTimeout: 20_000 });

  it('removes the custom checker only after confirming', async () => {
    const calls = mockApi({
      ...staffViewer(EDIT),
      ...problemEditorRoutes(),
      'GET /problems/hcmus41c/data': ok(
        problemData({ customChecker: 'checker.cpp', checker: 'bridged' }),
      ),
      // The server clears only the file's setting: the checker stays `bridged`.
      'DELETE /problems/hcmus41c/data/files/customChecker': ok(
        problemData({ customChecker: null, checker: 'bridged' }),
      ),
    });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/data');
    await wrapper.get('button[aria-label="Xóa checker.cpp"]').trigger('click');
    await flushPromises();
    expect(calls.some((call) => call.method === 'DELETE')).toBe(false);
    await confirmDialog('Xóa');
    expect(calls.some((call) => call.method === 'DELETE')).toBe(true);
    expect(wrapper.get('[data-testid="source-customChecker"]').text()).toContain('Chưa có');
  });

  it('offers no generator slot (the judge runs none) unless a file is stored, and then only to delete it', async () => {
    mockApi({
      ...staffViewer(EDIT),
      ...problemEditorRoutes(),
      'GET /problems/hcmus41c/data': ok(problemData({ generator: null })),
    });
    const none = await mountAdmin('/admin/problems/hcmus41c/data?view=advanced');
    expect(none.wrapper.find('[data-testid="source-generator"]').exists()).toBe(false);
    none.wrapper.unmount();

    mockApi({
      ...staffViewer(EDIT),
      ...problemEditorRoutes(),
      'GET /problems/hcmus41c/data': ok(problemData({ generator: 'gen.cpp' })),
    });
    const stored = await mountAdmin('/admin/problems/hcmus41c/data?view=advanced');
    const row = stored.wrapper.get('[data-testid="source-generator"]');
    expect(row.text()).toContain('gen.cpp');
    expect(row.find('input[type="file"]').exists()).toBe(false);
    expect(row.find('button[aria-label="Xóa gen.cpp"]').exists()).toBe(true);
  });
});
