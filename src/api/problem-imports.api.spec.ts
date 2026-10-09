import { describe, expect, it } from 'vitest';
import { mockApi } from '@/test/mock-api';
import { startPolygonImport } from './problem-imports.api';

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
