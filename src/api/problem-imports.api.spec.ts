import { describe, expect, it } from 'vitest';
import { mockApi, ok } from '@/test/mock-api';
import { fetchImportJob, startPolygonImport } from './problem-imports.api';

describe('startPolygonImport', () => {
  it('puts the options in the query string and only the file in the body', async () => {
    const calls = mockApi({
      'POST /problems/imports': { status: 202, body: { data: { jobId: 'job-1' } } },
    });
    const result = await startPolygonImport(
      {
        code: 'hcmus41c',
        mode: 'create',
        authors: ['a1', 'a2'],
        curators: [],
        typeIds: [],
        statementLanguages: ['vietnamese=vi', 'english=en'],
        ignoreZeroPointBatches: true,
        ignoreZeroPointCases: false,
        appendMainSolution: false,
      },
      new File(['zip'], 'p.zip'),
    );
    expect(result).toEqual({ jobId: 'job-1' });
    const call = calls[0]!;
    expect(call.query.getAll('authors')).toEqual(['a1', 'a2']);
    expect(call.query.getAll('statementLanguages')).toEqual(['vietnamese=vi', 'english=en']);
    expect(call.query.get('ignoreZeroPointBatches')).toBe('true');
    expect(call.query.has('curators')).toBe(false);
    expect([...(call.body as FormData).keys()]).toEqual(['file']);
  });
});

describe('fetchImportJob', () => {
  it('asks for the job by its encoded id', async () => {
    const calls = mockApi({
      'GET /problems/imports/j%2F1': ok({ id: 'j/1', state: 'active', result: null, error: null }),
    });
    const job = await fetchImportJob('j/1');
    expect(calls[0]!.path).toBe('/problems/imports/j%2F1');
    expect(job.state).toBe('active');
  });
});
