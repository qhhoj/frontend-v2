import { describe, expect, it } from 'vitest';
import { contestDetail, contestProblem, viewerResult } from '@/test/fixtures';
import { mountComponent } from '@/test/mount';
import ContestProblemSwitcher from './ContestProblemSwitcher.vue';
import { switcherEntries } from './problem-switcher';

const contest = contestDetail({
  problems: [
    contestProblem(0, { viewerResult: viewerResult({ isSolved: true, attempts: 1 }) }),
    contestProblem(1, { viewerResult: viewerResult({ attempts: 2 }) }),
    contestProblem(2, { viewerResult: viewerResult() }),
  ],
});
const mountSwitcher = (currentCode: string) =>
  mountComponent(ContestProblemSwitcher, {
    props: {
      contestKey: 'r42',
      contestName: contest.name,
      entries: switcherEntries(contest.problems, currentCode) ?? [],
    },
  });

describe('contest problem switcher', () => {
  it('links every contest problem in order and marks the open one as the current page', () => {
    const wrapper = mountSwitcher('r42b');
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
    expect(wrapper.get('nav a').text()).toBe(contest.name);
  });
});
