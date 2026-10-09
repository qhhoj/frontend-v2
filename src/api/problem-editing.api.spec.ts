import { describe, expect, it } from 'vitest';
import { mockApi, ok } from '@/test/mock-api';
import {
  cloneProblem,
  createProblem,
  fetchEditableProblem,
  fetchProblemEditingMeta,
  putEditorial,
  putTranslation,
  suggestProblem,
  updateProblem,
  uploadMaterial,
  uploadProblemImage,
  uploadStatementPdf,
} from './problem-editing.api';
import { editableProblem, problemEditor } from '@/test/admin-fixtures/problems';

describe('problem editing API', () => {
  it('reads the base-language name from the editor block, whatever language the detail name is in', async () => {
    const calls = mockApi({
      'GET /problems/hcmus41c': ok(
        editableProblem({
          name: 'Bản dịch tiếng Việt',
          editor: { ...problemEditor(), baseName: 'Base name' },
        }),
      ),
    });
    const problem = await fetchEditableProblem('hcmus41c');
    expect(calls[0]!.query.has('lang')).toBe(false);
    expect(problem.editor?.baseName).toBe('Base name');
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

  it('creates and suggests a problem with the body unchanged and reads the catalogue', async () => {
    const calls = mockApi({
      'POST /problems': ok(editableProblem()),
      'POST /problems/suggest': ok(editableProblem()),
      'GET /problems/meta': ok({ types: [], groups: [], licenses: [], languages: [] }),
    });
    const body = {
      code: 'new1',
      name: 'N',
      timeLimit: 1,
      memoryLimit: 262144,
      points: 100,
      typeIds: ['t1'],
      groupId: 'g1',
    };
    await createProblem(body);
    await suggestProblem(body);
    await fetchProblemEditingMeta();
    expect(calls.map((call) => [call.method, call.path])).toEqual([
      ['POST', '/problems'],
      ['POST', '/problems/suggest'],
      ['GET', '/problems/meta'],
    ]);
    expect(calls[0]!.body).toEqual(body);
  });

  it('PUTs the editorial draft', async () => {
    const calls = mockApi({ 'PUT /problems/a%2Fb/editorial': { status: 204 } });
    const body = { isPublic: true, publishOn: '2026-01-01T00:00:00Z', authors: [], content: 'c' };
    await putEditorial('a/b', body);
    expect(calls[0]!.path).toBe('/problems/a%2Fb/editorial');
    expect(calls[0]!.body).toEqual(body);
  });

  it('uploads an image and a material file as one multipart file part and returns the url', async () => {
    const calls = mockApi({
      'POST /problems/uploads/image': ok({ url: '/media/i.png' }),
      'POST /problems/hcmus41c/material': ok({ url: '/media/m.zip' }),
    });
    expect(await uploadProblemImage(new File(['i'], 'i.png'))).toBe('/media/i.png');
    expect(await uploadMaterial('hcmus41c', new File(['m'], 'm.zip'))).toBe('/media/m.zip');
    expect((calls[0]!.body as FormData).get('file')).toBeInstanceOf(File);
    expect((calls[1]!.body as FormData).get('file')).toBeInstanceOf(File);
  });
});
