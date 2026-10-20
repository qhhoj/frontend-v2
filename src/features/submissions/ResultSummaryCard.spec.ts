import { describe, expect, it } from 'vitest';
import { submissionCase } from '@/test/fixtures';
import { mountComponent } from '@/test/mount';
import ResultSummaryCard from './ResultSummaryCard.vue';

const WRONG = [3, 5, 7, 9];
const cases = (wrong: number[]) =>
  Array.from({ length: 10 }, (_unused, index) =>
    submissionCase({
      position: index + 1,
      ...(wrong.includes(index + 1)
        ? { status: 'WA', points: 0, feedback: `wrong at ${index + 1}` }
        : {}),
    }),
  );
const mountCard = (wrong: number[], extra: Record<string, unknown> = {}) =>
  mountComponent(ResultSummaryCard, {
    props: { cases: cases(wrong), batches: null, totalCases: 10, running: false, ...extra },
  });
const openTests = (wrapper: ReturnType<typeof mountCard>) =>
  wrapper.findAll('[data-testid="result-open-case"]').map((row) => row.text());
const tile = (wrapper: ReturnType<typeof mountCard>, position: number) =>
  wrapper.findAll('[data-testid="result-tile"]')[position - 1]!;

describe('ResultSummaryCard', () => {
  it('opens the first three tests that lost points with their feedback and counts the rest', () => {
    const wrapper = mountCard(WRONG);
    expect(openTests(wrapper)).toEqual([
      expect.stringContaining('wrong at 3'),
      expect.stringContaining('wrong at 5'),
      expect.stringContaining('wrong at 7'),
    ]);
    expect(wrapper.get('a[href="#cases"]').text()).toContain('+1');
    expect(wrapper.text()).toContain('6/10 test đúng');
  });

  it('opens or closes a test in place when its tile is tapped', async () => {
    const wrapper = mountCard(WRONG);
    await tile(wrapper, 9).trigger('click');
    expect(tile(wrapper, 9).attributes('aria-expanded')).toBe('true');
    expect(openTests(wrapper).at(-1)).toContain('wrong at 9');
    expect(wrapper.get('a[href="#cases"]').text()).not.toContain('+');
    await tile(wrapper, 3).trigger('click');
    expect(tile(wrapper, 3).attributes('aria-expanded')).toBe('false');
    expect(openTests(wrapper).join()).not.toContain('wrong at 3');
  });

  it('sums an all-correct result up in one line with nothing opened', () => {
    const wrapper = mountCard([]);
    expect(openTests(wrapper)).toEqual([]);
    expect(wrapper.text()).toContain('Tất cả 10 test đúng · lâu nhất 0.01s · 3.2 MB');
  });

  it('never says all correct when fewer tests were graded than the problem has', () => {
    const wrapper = mountCard([], { totalCases: 20 });
    expect(wrapper.text()).toContain('10/20 test đúng');
    expect(wrapper.text()).not.toContain('Tất cả');
  });

  it('shows the tests still waiting while the grading goes on, not as buttons', () => {
    const wrapper = mountComponent(ResultSummaryCard, {
      props: { cases: cases([]).slice(0, 4), batches: null, totalCases: 10, running: true },
    });
    expect(wrapper.findAll('[data-testid="result-tile"]')).toHaveLength(4);
    expect(wrapper.findAll('li[aria-label$="Chờ chấm"]')).toHaveLength(6);
    expect(wrapper.text()).not.toContain('Tất cả');
  });
});
