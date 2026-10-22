import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { confirmDialog, staffViewer } from '@/test/admin-routes';
import { problemData, problemEditorRoutes } from '@/test/admin-fixtures/problems';

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

const pick = async (input: ReturnType<Mounted['wrapper']['get']>, file: File) => {
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true });
  await input.trigger('change');
  await flushPromises();
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

  it('refuses a source file over 1 MiB on this side, without sending it', async () => {
    const calls = mockApi({
      ...staffViewer(EDIT),
      ...problemEditorRoutes(),
      'GET /problems/hcmus41c/data': ok(problemData()),
    });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/data?view=advanced');
    await pick(
      wrapper.get('[data-testid="source-generator"] input[type="file"]'),
      new File([new Uint8Array(1024 * 1024 + 1)], 'gen.cpp'),
    );
    expect(calls.some((call) => call.path.includes('/files/generator'))).toBe(false);
    expect(wrapper.get('[data-testid="source-generator"]').text()).toContain(
      'Tệp quá lớn (tối đa 1.0 MB).',
    );
  });
});
