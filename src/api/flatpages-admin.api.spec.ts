import { describe, expect, it } from 'vitest';
import { mockApi, ok, page } from '@/test/mock-api';
import {
  createFlatpage,
  deleteFlatpage,
  fetchDeletedFlatpages,
  fetchFlatpage,
  fetchFlatpageRevisions,
  fetchFlatpages,
  updateFlatpage,
} from './flatpages-admin.api';

describe('flatpage admin calls', () => {
  it('lists pages, deleted pages and one page history by page number', async () => {
    const calls = mockApi({
      'GET /admin/site/pages': page([]),
      'GET /admin/site/pages/deleted': page([]),
      'GET /admin/site/pages/p%2F1/revisions': page([]),
    });
    await fetchFlatpages(2);
    await fetchDeletedFlatpages(3);
    await fetchFlatpageRevisions('p/1', 4);
    expect(calls.map((call) => call.path)).toEqual([
      '/admin/site/pages',
      '/admin/site/pages/deleted',
      '/admin/site/pages/p%2F1/revisions',
    ]);
    expect(calls.map((call) => call.query.get('page'))).toEqual(['2', '3', '4']);
  });

  it('reads, creates, patches and deletes a page by its encoded id', async () => {
    const calls = mockApi({
      'GET /admin/site/pages/p%2F1': ok({}),
      'POST /admin/site/pages': ok({}),
      'PATCH /admin/site/pages/p%2F1': ok({}),
      'DELETE /admin/site/pages/p%2F1': { status: 204 },
    });
    await fetchFlatpage('p/1');
    await createFlatpage({ url: '/a', title: 'A', content: 'x' });
    await updateFlatpage('p/1', { title: 'B' });
    await deleteFlatpage('p/1');
    expect(calls.map((call) => call.method)).toEqual(['GET', 'POST', 'PATCH', 'DELETE']);
    expect(calls[1]!.body).toEqual({ url: '/a', title: 'A', content: 'x' });
    expect(calls[2]!.body).toEqual({ title: 'B' });
  });
});
