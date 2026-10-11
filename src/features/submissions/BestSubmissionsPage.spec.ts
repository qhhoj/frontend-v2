import { describe, expect, it, vi } from 'vitest';
import { problemDetail, submissionItem } from '@/test/fixtures';
import { mockApi, page } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer, problemPageRoutes } from '@/test/problem-routes';

const BEST = 'GET /problems/duongdi/best-submissions';

describe('the best submissions page', () => {
  it('numbers the rows from the page it shows and asks the API for that page', async () => {
    const calls = mockApi({
      ...anonymousViewer,
      ...problemPageRoutes(problemDetail()),
      [BEST]: page([submissionItem({ id: 'a' }), submissionItem({ id: 'b' })], {
        page: 2,
        total: 52,
      }),
    });
    const { wrapper } = await mountApp('/problems/duongdi/best?page=2');
    await vi.waitFor(() => expect(wrapper.find('tbody tr').exists()).toBe(true));
    const ranks = wrapper.findAll('tbody tr').map((row) => row.findAll('td')[0]!.text());
    expect(ranks).toEqual(['51', '52']);
    const asked = calls.find((call) => call.path === '/problems/duongdi/best-submissions');
    expect(asked?.query.get('page')).toBe('2');
    expect(asked?.query.get('pageSize')).toBe('50');
    const firstPage = wrapper.findAll('nav a[href="/problems/duongdi/best"]');
    expect(firstPage.map((link) => link.text())).toContain('1');
  });

  it('says so when no submission has scored', async () => {
    mockApi({ ...anonymousViewer, ...problemPageRoutes(problemDetail()), [BEST]: page([]) });
    const { wrapper } = await mountApp('/problems/duongdi/best');
    await vi.waitFor(() => expect(wrapper.text()).toContain('Chưa có bài nộp nào được điểm.'));
  });
});
