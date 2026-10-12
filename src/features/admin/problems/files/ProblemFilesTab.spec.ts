import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mockApi, noContent, ok, sequence } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { invalidatedKeys, seedCache } from '@/test/cache-probe';
import { confirmDialog, staffViewer } from '@/test/admin-routes';
import {
  editableProblem,
  problemEditor,
  problemEditorRoutes,
} from '@/test/admin-fixtures/problems';

/** The server's upload rights for the viewer (`editor.canUpload*`): the permissions, or administering the problem's organizations. */
const withUploadRights = (rights: { pdf: boolean; material: boolean }, overrides = {}) =>
  editableProblem({
    editor: {
      ...problemEditor(),
      canUploadPdfStatement: rights.pdf,
      canUploadMaterial: rights.material,
    },
    ...overrides,
  });
/** An organization administrator: no upload permission of their own. */
const ORG_ADMIN = ['judge.edit_own_problem', 'judge.create_organization_problem'];

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
  it('refuses a PDF over 5 MiB without sending it, and locks the tile the server does not allow', async () => {
    const calls = mockApi({
      ...staffViewer(['judge.edit_own_problem', 'judge.upload_file_statement']),
      ...problemEditorRoutes(withUploadRights({ pdf: true, material: false })),
    });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/files');
    const big = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'big.pdf');
    await pick(wrapper, 'upload-pdf', big);
    expect(calls.some((call) => call.path.endsWith('/statement'))).toBe(false);
    expect(wrapper.get('[data-testid="upload-pdf"]').text()).toContain(
      'Tệp quá lớn (tối đa 5.0 MB).',
    );
    expect(wrapper.get('[data-testid="upload-material"]').text()).toContain(
      'Cần quyền “Tải lên tài liệu của bài”',
    );
  });

  it('replaces the PDF, marks public problem pages stale, and reads the problem again so the stored address is the new one', async () => {
    const calls = mockApi({
      ...staffViewer(['judge.edit_own_problem', 'judge.upload_file_statement']),
      ...problemEditorRoutes(withUploadRights({ pdf: true, material: false })),
      'POST /problems/hcmus41c/statement': ok({ url: '/media/pdf/hcmus41c-v2.pdf' }),
    });
    const { wrapper, queryClient } = await mountAdmin('/admin/problems/hcmus41c/files');
    seedCache(queryClient, [['problems', 'detail', 'probe']]);
    await pick(wrapper, 'upload-pdf', new File(['%PDF'], 'new.pdf'));
    expect(wrapper.get('[data-testid="upload-pdf"] a').attributes('href')).toBe(
      '/media/pdf/hcmus41c-v2.pdf',
    );
    expect(invalidatedKeys(queryClient, [['problems', 'detail', 'probe']])).toHaveLength(1);
    expect(
      calls.filter((call) => call.method === 'GET' && call.path === '/problems/hcmus41c'),
    ).toHaveLength(2);
  });

  it('offers both uploads to an organization administrator the server allows, picking any material type it accepts', async () => {
    mockApi({
      ...staffViewer(ORG_ADMIN),
      ...problemEditorRoutes(withUploadRights({ pdf: true, material: true })),
    });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/files');
    for (const testId of ['upload-pdf', 'upload-material'])
      expect(wrapper.get(`[data-testid="${testId}"]`).text()).not.toContain('Cần quyền');
    expect(
      wrapper.get('[data-testid="upload-material"] input[type="file"]').attributes('accept'),
    ).toBe('.zip,.pdf,.docx');
  });

  it('removes the material only after confirming, and reads the problem again', async () => {
    const stored = { material: true, pdf: true };
    const calls = mockApi({
      ...staffViewer(ORG_ADMIN),
      ...problemEditorRoutes(),
      'GET /problems/hcmus41c': sequence(
        ok(withUploadRights(stored, { materialUrl: '/media/materials/p/de.docx' })),
        ok(withUploadRights(stored, { materialUrl: null })),
      ),
      'DELETE /problems/hcmus41c/material': noContent(),
    });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/files');
    const tile = () => wrapper.get('[data-testid="upload-material"]');
    await tile().get('button[aria-label="Gỡ de.docx"]').trigger('click');
    await flushPromises();
    expect(calls.some((call) => call.method === 'DELETE')).toBe(false);
    await confirmDialog('Gỡ tệp');
    expect(calls.filter((call) => call.method === 'DELETE').map((call) => call.path)).toEqual([
      '/problems/hcmus41c/material',
    ]);
    expect(tile().text()).toContain('Chưa có tệp');
  });
});
