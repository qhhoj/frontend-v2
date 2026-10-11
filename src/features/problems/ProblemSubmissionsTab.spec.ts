import { describe, expect, it, vi } from 'vitest';
import { submissionItem } from '@/test/fixtures';
import { mockApi, page } from '@/test/mock-api';
import type { ApiCall } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer, problemPageRoutes, signedInViewer } from '@/test/problem-routes';

const TAB_PATH = '/problems/duongdi?tab=submissions';
const submissionCalls = (calls: ApiCall[]) => calls.filter((call) => call.path === '/submissions');

describe('the problem Submissions tab', () => {
  it('asks for this problem and this user and shows rows without a Problem column', async () => {
    const calls = mockApi({
      ...signedInViewer(),
      ...problemPageRoutes(),
      'GET /submissions': page([
        submissionItem({
          problem: { code: 'duongdi', name: 'Đường đi', isDeleted: false, points: 100 },
        }),
      ]),
    });
    const { wrapper } = await mountApp(TAB_PATH);
    await vi.waitFor(() =>
      expect(wrapper.find('#problem-panel-submissions tbody tr').exists()).toBe(true),
    );
    const call = submissionCalls(calls)[0]!;
    expect([call.query.get('problem'), call.query.get('user')]).toEqual(['duongdi', 'user_01']);
    const headers = wrapper
      .findAll('#problem-panel-submissions thead th')
      .map((cell) => cell.text());
    expect(headers).toHaveLength(6);
    expect(headers).not.toContain('Bài');
  });

  it('sends an anonymous viewer to sign in without asking for anything', async () => {
    const calls = mockApi({ ...anonymousViewer, ...problemPageRoutes() });
    const { wrapper } = await mountApp(TAB_PATH);
    await vi.waitFor(() =>
      expect(wrapper.find('#problem-panel-submissions a[href^="/login"]').exists()).toBe(true),
    );
    expect(submissionCalls(calls)).toHaveLength(0);
  });
});
