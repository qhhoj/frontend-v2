import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { contestDetail, contestProblem, viewerResult } from '@/test/fixtures';
import { fail, mockApi, ok } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import { anonymousViewer } from '@/test/problem-routes';
import ContestProblemSwitcher from './ContestProblemSwitcher.vue';

const contest = contestDetail({
  problems: [
    contestProblem(0, { viewerResult: viewerResult({ isSolved: true, attempts: 1 }) }),
    contestProblem(1, { viewerResult: viewerResult({ attempts: 2 }) }),
    contestProblem(2, { viewerResult: viewerResult() }),
  ],
});
const mountSwitcher = async (currentCode: string) => {
  const wrapper = mountComponent(ContestProblemSwitcher, {
    props: { contestKey: 'r42', currentCode },
  });
  await flushPromises();
  return wrapper;
};

describe('contest problem switcher', () => {
  it('links every contest problem in order and marks the open one as the current page', async () => {
    mockApi({ ...anonymousViewer, 'GET /contests/r42': ok(contest) });
    const wrapper = await mountSwitcher('r42b');
    const links = wrapper.findAll('nav li a');
    expect(links.map((link) => link.attributes('href'))).toEqual([
      '/problems/r42a',
      '/problems/r42b',
      '/problems/r42c',
    ]);
    expect(links.map((link) => link.attributes('aria-current') ?? null)).toEqual([
      null,
      'page',
      null,
    ]);
    expect(links[0]!.text()).toContain('Đã giải');
    expect(links[1]!.text()).toContain('Đã nộp, chưa đúng');
    expect(links[2]!.text()).toContain('Chưa nộp');
    expect(wrapper.get('nav').attributes('aria-label')).toBe('Bài trong kỳ thi');
  });

  it('draws nothing when the contest does not list the problem, and nothing on an error', async () => {
    mockApi({ ...anonymousViewer, 'GET /contests/r42': ok(contest) });
    expect((await mountSwitcher('other')).find('nav').exists()).toBe(false);
    mockApi({ ...anonymousViewer, 'GET /contests/r42': fail(500, 'generic') });
    expect((await mountSwitcher('r42a')).find('nav').exists()).toBe(false);
  });
});
