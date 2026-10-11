import { describe, expect, it } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { fail, mockApi } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { confirmDialog, staffViewer } from '@/test/admin-routes';
import { signedInViewer, submissionPageRoutes } from '@/test/problem-routes';
import { submissionDetail } from '@/test/fixtures';

const GONE = { code: 'duongdi', name: 'Đường đi ngắn nhất', isDeleted: true, points: 100 };
const tombstoned = submissionDetail({
  problem: GONE,
  cases: [],
  batches: null,
  totalCases: null,
  viewer: {
    canAbort: false,
    canRejudge: true,
    canReject: true,
    canLock: false,
    canOverrideScore: false,
  },
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
    await wrapper.get('[data-testid="source-expand"]').trigger('click');
    expect(wrapper.text()).toContain('int main');
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
});
