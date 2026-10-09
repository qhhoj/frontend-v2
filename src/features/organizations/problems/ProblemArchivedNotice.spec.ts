import { describe, expect, it } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer, problemPageRoutes, signedInViewer } from '@/test/problem-routes';
import { problemDetail } from '@/test/fixtures';
import { f4Id } from '@/test/f4-fixtures';

const ORG_PROBLEM = problemDetail({ organizations: [f4Id(301)] });
const ARCHIVED_IN = `GET /problems/${ORG_PROBLEM.code}/archived-in`;

describe('ProblemArchivedNotice', () => {
  it('asks nothing while signed out', async () => {
    const calls = mockApi({ ...anonymousViewer, ...problemPageRoutes(ORG_PROBLEM) });
    await mountApp(`/problems/${ORG_PROBLEM.code}`);
    await flushPromises();
    expect(calls.some((call) => call.path.endsWith('/archived-in'))).toBe(false);
  });

  it('asks nothing for a problem without an organization', async () => {
    const calls = mockApi({
      ...signedInViewer(),
      ...problemPageRoutes(problemDetail({ organizations: [] })),
    });
    await mountApp('/problems/duongdi');
    await flushPromises();
    expect(calls.some((call) => call.path.endsWith('/archived-in'))).toBe(false);
  });

  it('names the organizations that archived it, with the asleep Bit', async () => {
    mockApi({
      ...signedInViewer(),
      ...problemPageRoutes(ORG_PROBLEM),
      [ARCHIVED_IN]: ok({
        organizations: [
          { slug: 'lhp', name: 'LHP' },
          { slug: 'ntt', name: 'NTT' },
        ],
      }),
    });
    const { wrapper } = await mountApp(`/problems/${ORG_PROBLEM.code}`);
    await flushPromises();
    const notice = wrapper.get('[data-testid="archived-notice"]');
    expect(notice.text()).toContain('Bài này đã được lưu trữ bởi tổ chức LHP, NTT');
    expect(notice.text()).toContain('vẫn xem và nộp bài được');
    expect(notice.find('[data-testid="inline-bit"]').exists()).toBe(true);
  });

  it('shows nothing when no organization of the viewer archived it', async () => {
    mockApi({
      ...signedInViewer(),
      ...problemPageRoutes(ORG_PROBLEM),
      [ARCHIVED_IN]: ok({ organizations: [] }),
    });
    const { wrapper } = await mountApp(`/problems/${ORG_PROBLEM.code}`);
    await flushPromises();
    expect(wrapper.find('[data-testid="archived-notice"]').exists()).toBe(false);
  });
});
