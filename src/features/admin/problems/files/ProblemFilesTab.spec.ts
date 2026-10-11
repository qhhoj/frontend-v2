import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { invalidatedKeys, seedCache } from '@/test/cache-probe';
import { staffViewer } from '@/test/admin-routes';
import { problemEditorRoutes } from '@/test/admin-fixtures/problems';

type Mounted = Awaited<ReturnType<typeof mountApp>>;

/** The shell and the files tab load lazily: wait until the image card is on the page. */
const mountAdmin = async (path: string) => {
  const mounted = await mountApp(path);
  await vi.waitFor(
    () => {
      if (!mounted.wrapper.find('[data-testid="upload-image"]').exists())
        throw new Error('tab not yet');
    },
    { timeout: 5000 },
  );
  await flushPromises();
  return mounted;
};

const pick = async (wrapper: Mounted['wrapper'], testId: string, file: File) => {
  const input = wrapper.get(`[data-testid="${testId}"] input`);
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true });
  await input.trigger('change');
  await flushPromises();
};

describe('ProblemFilesTab', () => {
  it('refuses a PDF over 5 MiB without sending it, and hides PDF upload without its permission', async () => {
    const calls = mockApi({
      ...staffViewer(['judge.edit_own_problem', 'judge.upload_file_statement']),
      ...problemEditorRoutes(),
    });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/files');
    const big = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'big.pdf');
    await pick(wrapper, 'upload-pdf', big);
    expect(calls.some((call) => call.path.endsWith('/statement'))).toBe(false);
    expect(wrapper.get('[data-testid="upload-pdf"]').text()).toContain(
      'Tệp quá lớn (tối đa 5.0 MB).',
    );
    expect(wrapper.get('[data-testid="upload-material"]').text()).toContain(
      'Cần quyền judge.upload_problem_material',
    );
  });

  it('replaces the PDF, marks public problem pages stale, and reads the problem again so the stored address is the new one', async () => {
    const calls = mockApi({
      ...staffViewer(['judge.edit_own_problem', 'judge.upload_file_statement']),
      ...problemEditorRoutes(),
      'POST /problems/hcmus41c/statement': ok({ url: '/media/pdf/hcmus41c-v2.pdf' }),
    });
    const { wrapper, queryClient } = await mountAdmin('/admin/problems/hcmus41c/files');
    seedCache(queryClient, [['problems', 'detail', 'probe']]);
    await pick(wrapper, 'upload-pdf', new File(['%PDF'], 'new.pdf'));
    expect(wrapper.get('[data-testid="upload-pdf"]').text()).toContain(
      '/media/pdf/hcmus41c-v2.pdf',
    );
    expect(invalidatedKeys(queryClient, [['problems', 'detail', 'probe']])).toHaveLength(1);
    expect(
      calls.filter((call) => call.method === 'GET' && call.path === '/problems/hcmus41c'),
    ).toHaveLength(2);
  });
});
