import { describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { invalidatedKeys, seedCache } from '@/test/cache-probe';
import { staffViewer } from '@/test/admin-routes';
import { editableProblem, problemEditorRoutes } from '@/test/admin-fixtures/problems';

/** The shell and the editorial tab load lazily: wait until the publish box is on the page. */
const mountAdmin = async (path: string) => {
  const mounted = await mountApp(path);
  await vi.waitFor(
    () => {
      if (!mounted.wrapper.find('#editorial-publishOn').exists()) throw new Error('tab not yet');
    },
    { timeout: 5000 },
  );
  await flushPromises();
  return mounted;
};

describe('ProblemEditorialTab', () => {
  it('seeds the stored editorial and saves the public flag, time, author ids and content', async () => {
    const problem = editableProblem();
    problem.editor!.solution = {
      isPublic: false,
      publishOn: '2026-10-08T06:00:00.000Z',
      authors: [{ id: 'id-thayhung', username: 'thayhung', rating: null }],
      content: 'Gọi $d[v][j]$…',
    };
    const calls = mockApi({
      ...staffViewer(['judge.edit_own_problem']),
      ...problemEditorRoutes(problem),
      'POST /problems/render-preview': ok({ html: '' }),
      'PUT /problems/hcmus41c/editorial': { status: 204 },
    });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/editorial');
    await wrapper.get('#editorial-isPublic').setValue(true);
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Lưu lời giải')!
      .trigger('click');
    await flushPromises();
    expect(calls.find((call) => call.method === 'PUT')?.body).toEqual({
      isPublic: true,
      publishOn: '2026-10-08T06:00:00.000Z',
      authors: ['id-thayhung'],
      content: 'Gọi $d[v][j]$…',
    });
  });

  it('treats CRLF content handed back as LF as unchanged and sends the stored text back', async () => {
    const problem = editableProblem();
    problem.editor!.solution = {
      isPublic: false,
      publishOn: '2026-10-08T06:00:00.000Z',
      authors: [],
      content: 'Dòng 1\r\nDòng 2',
    };
    const calls = mockApi({
      ...staffViewer(['judge.edit_own_problem']),
      ...problemEditorRoutes(problem),
      'POST /problems/render-preview': ok({ html: '' }),
      'PUT /problems/hcmus41c/editorial': { status: 204 },
    });
    const { wrapper } = await mountAdmin('/admin/problems/hcmus41c/editorial');
    const save = () =>
      wrapper.findAll('button').find((button) => button.text() === 'Lưu lời giải')!;
    await wrapper.get('textarea').setValue('Dòng 1\nDòng 2');
    expect(save().attributes('aria-disabled')).toBe('true');
    await wrapper.get('#editorial-isPublic').setValue(true);
    await save().trigger('click');
    await flushPromises();
    expect(calls.find((call) => call.method === 'PUT')?.body).toMatchObject({
      isPublic: true,
      content: 'Dòng 1\r\nDòng 2',
    });
  });

  it('marks the public problem pages stale after saving the editorial', async () => {
    mockApi({
      ...staffViewer(['judge.edit_own_problem']),
      ...problemEditorRoutes(),
      'POST /problems/render-preview': ok({ html: '' }),
      'PUT /problems/hcmus41c/editorial': { status: 204 },
    });
    const { wrapper, queryClient } = await mountAdmin('/admin/problems/hcmus41c/editorial');
    seedCache(queryClient, [['problems', 'editorial', 'probe']]);
    await wrapper.get('textarea').setValue('Lời giải mới');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Lưu lời giải')!
      .trigger('click');
    await flushPromises();
    expect(invalidatedKeys(queryClient, [['problems', 'editorial', 'probe']])).toHaveLength(1);
  });
});
