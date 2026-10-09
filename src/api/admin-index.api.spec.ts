import { describe, expect, it } from 'vitest';
import { mockApi } from '@/test/mock-api';
import { fetchAdminProblems } from './admin-index.api';

describe('fetchAdminProblems', () => {
  it('asks for private problems too, and sends no q when there is none', async () => {
    const calls = mockApi({
      'GET /problems': { body: { data: [], meta: { page: 2, pageSize: 20, total: 0 } } },
    });
    await fetchAdminProblems({ page: 2, pageSize: 20, lang: 'vi', q: '' });
    expect(Object.fromEntries(calls[0]!.query)).toEqual({
      visibility: 'all',
      page: '2',
      pageSize: '20',
      lang: 'vi',
    });
  });

  it('sends the typed text as q', async () => {
    const calls = mockApi({
      'GET /problems': { body: { data: [], meta: { page: 1, pageSize: 20, total: 0 } } },
    });
    await fetchAdminProblems({ page: 1, pageSize: 20, lang: 'en', q: 'hcmus' });
    expect(calls[0]!.query.get('q')).toBe('hcmus');
  });
});
