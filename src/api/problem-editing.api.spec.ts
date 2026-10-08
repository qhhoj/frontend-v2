import { describe, expect, it } from 'vitest';
import { mockApi, ok } from '@/test/mock-api';
import {
  cloneProblem,
  fetchEditableProblem,
  putTranslation,
  updateProblem,
  uploadStatementPdf,
} from './problem-editing.api';
import { editableProblem } from '@/test/admin-fixtures/problems';

describe('problem editing API', () => {
  it('reads the editable detail with the base-language texts on top, not a translation', async () => {
    mockApi({
      'GET /problems/hcmus41c': ({ query }) =>
        ok(
          editableProblem({
            name: query.get('lang') === 'vi' ? 'Bản dịch tiếng Việt' : 'Base name',
          }),
        ),
    });
    const problem = await fetchEditableProblem('hcmus41c');
    expect(problem.name).toBe('Base name');
    expect(problem.editor?.testers.map((tester) => tester.username)).toEqual(['khoa.tester']);
  });

  it('sends a PATCH with only the fields given', async () => {
    const calls = mockApi({ 'PATCH /problems/hcmus41c': ok(editableProblem()) });
    await updateProblem('hcmus41c', { points: 1200 });
    expect(calls[0]!.body).toEqual({ points: 1200 });
  });

  it('PUTs a translation per language and posts the clone code', async () => {
    const calls = mockApi({
      'PUT /problems/hcmus41c/translations/en': { status: 204 },
      'POST /problems/hcmus41c/clone': ok(editableProblem({ code: 'copy1' })),
    });
    await putTranslation('hcmus41c', 'en', { name: 'N', description: 'D' });
    const clone = await cloneProblem('hcmus41c', 'copy1');
    expect(clone.code).toBe('copy1');
    expect(calls.map((call) => [call.method, call.path, call.body])).toEqual([
      ['PUT', '/problems/hcmus41c/translations/en', { name: 'N', description: 'D' }],
      ['POST', '/problems/hcmus41c/clone', { code: 'copy1' }],
    ]);
  });

  it('uploads one multipart part named file', async () => {
    const calls = mockApi({
      'POST /problems/hcmus41c/statement': ok({ url: '/media/pdf/hcmus41c.pdf' }),
    });
    const url = await uploadStatementPdf(
      'hcmus41c',
      new File(['%PDF'], 'a.pdf', { type: 'application/pdf' }),
    );
    expect(url).toBe('/media/pdf/hcmus41c.pdf');
    expect((calls[0]!.body as FormData).get('file')).toBeInstanceOf(File);
  });
});
