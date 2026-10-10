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
    expect(headers).toHaveLength(8);
    expect(headers).not.toContain('Bài');
  });

  it('links to the full list of this problem, narrowed to the viewer (the tab lists their own rows)', async () => {
    mockApi({
      ...signedInViewer(),
      ...problemPageRoutes(),
      'GET /submissions': page([submissionItem()]),
    });
    const { wrapper } = await mountApp(TAB_PATH);
    await vi.waitFor(() =>
      expect(wrapper.find('#problem-panel-submissions tbody tr').exists()).toBe(true),
    );
    const link = wrapper.get('#problem-panel-submissions a[href^="/submissions?"]');
    expect(link.attributes('href')).toBe('/submissions?problem=duongdi&user=user_01');
    expect(link.text()).toBe('Xem tất cả');
  });

  it('sends an anonymous viewer to sign in without asking for anything', async () => {
    const calls = mockApi({ ...anonymousViewer, ...problemPageRoutes() });
    const { wrapper } = await mountApp(TAB_PATH);
    await vi.waitFor(() =>
      expect(wrapper.find('#problem-panel-submissions a[href^="/login"]').exists()).toBe(true),
    );
    expect(submissionCalls(calls)).toHaveLength(0);
  });

  it('shows the empty text when the viewer has not submitted yet', async () => {
    mockApi({ ...signedInViewer(), ...problemPageRoutes(), 'GET /submissions': page([]) });
    const { wrapper } = await mountApp(TAB_PATH);
    await vi.waitFor(() =>
      expect(wrapper.get('#problem-panel-submissions').text()).toContain('Bạn chưa nộp bài này.'),
    );
    expect(wrapper.get('#problem-panel-submissions [role="img"]').attributes('aria-label')).toBe(
      'Bit ngủ trong mũ ngủ',
    );
  });

  it('does not ask for submissions while another tab is open', async () => {
    const calls = mockApi({ ...signedInViewer(), ...problemPageRoutes() });
    const { wrapper } = await mountApp('/problems/duongdi');
    await vi.waitFor(() => expect(wrapper.find('[role="tabpanel"]').exists()).toBe(true));
    expect(submissionCalls(calls)).toHaveLength(0);
  });
});
