import { describe, expect, it } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { fail, mockApi, page } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { confirmDialog, staffViewer } from '@/test/admin-routes';
import {
  anonymousViewer,
  signedInViewer,
  submissionListRoutes,
  submissionPageRoutes,
} from '@/test/problem-routes';
import { submissionDetail, submissionItem } from '@/test/fixtures';

const GONE = { code: 'duongdi', name: 'Đường đi ngắn nhất', isDeleted: true };
const tombstoned = submissionDetail({
  problem: GONE,
  cases: [],
  batches: null,
  totalCases: null,
  viewer: { canAbort: false, canRejudge: true, canReject: true },
});

describe('a submission of a deleted problem', () => {
  it('shows the tombstone instead of the cases, keeps the source and asks nothing about the problem', async () => {
    const calls = mockApi({ ...signedInViewer(), ...submissionPageRoutes(tombstoned) });
    const { wrapper } = await mountApp(`/submissions/${tombstoned.id}`);
    await flushPromises();
    const notice = wrapper.get('[data-testid="deleted-problem-notice"]');
    expect(notice.text()).toContain('Bài đã bị xóa');
    expect(notice.find('[data-testid="inline-bit"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="cases-card"]').exists()).toBe(false);
    expect(wrapper.find('a[href="/problems/duongdi"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('Đường đi ngắn nhất');
    expect(calls.some((call) => call.path === '/problems/duongdi')).toBe(false);
    expect(wrapper.text()).toContain('int main');
  });

  it('marks the row in the submission list without a link', async () => {
    mockApi({
      ...signedInViewer(),
      ...submissionListRoutes,
      'GET /submissions': page([submissionItem({ problem: GONE })]),
    });
    const { wrapper } = await mountApp('/submissions');
    await flushPromises();
    const row = wrapper.get('tbody tr');
    expect(row.text()).toContain('Đã xóa');
    expect(row.find('a[href="/problems/duongdi"]').exists()).toBe(false);
  });

  it('turns a refused rejudge (409 problem_deleted) into its own text', async () => {
    mockApi({
      ...staffViewer(['judge.rejudge_submission']),
      ...submissionPageRoutes(tombstoned),
      [`POST /submissions/${tombstoned.id}/rejudge`]: fail(409, 'problem_deleted'),
    });
    const { wrapper } = await mountApp(`/submissions/${tombstoned.id}`);
    await flushPromises();
    const button = wrapper
      .findAll('[data-testid="staff-panel"] button')
      .find((candidate) => candidate.text() === 'Chấm lại')!;
    await button.trigger('click');
    await flushPromises();
    await confirmDialog('Chấm lại');
    expect(wrapper.get('[data-testid="staff-panel"] [role="alert"]').text()).toContain(
      'đã bị xóa nên không chấm lại',
    );
  });

  it('a deleted problem’s own page is the crying-Bit 404', async () => {
    mockApi({ ...anonymousViewer, 'GET /problems/duongdi': fail(404, 'not_found') });
    const { wrapper } = await mountApp('/problems/duongdi');
    await flushPromises();
    expect(wrapper.get('h1').text()).toBe('Không tìm thấy trang');
  });
});
