import { describe, expect, it } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mockApi } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer, problemPageRoutes } from '@/test/problem-routes';
import { problemDetail } from '@/test/fixtures';
import { f4Id } from '@/test/f4-fixtures';

const ORG_PROBLEM = problemDetail({ organizations: [f4Id(301)] });

describe('ProblemArchivedNotice', () => {
  it('asks nothing while signed out', async () => {
    const calls = mockApi({ ...anonymousViewer, ...problemPageRoutes(ORG_PROBLEM) });
    await mountApp(`/problems/${ORG_PROBLEM.code}`);
    await flushPromises();
    expect(calls.some((call) => call.path.endsWith('/archived-in'))).toBe(false);
  });
});
