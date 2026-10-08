import { describe, expect, it } from 'vitest';
import { verdictOf } from '@/lib/verdicts';
import { submissionDetail } from '@/test/fixtures';
import { mountComponent } from '@/test/mount';
import SubmissionSummary from './SubmissionSummary.vue';
import SubmissionSummarySkeleton from './SubmissionSummarySkeleton.vue';
import { AUTHOR_FACT_KEY, SUMMARY_FACT_KEYS } from './summary-facts';

const mountSummary = () =>
  mountComponent(SubmissionSummary, {
    props: {
      submission: submissionDetail(),
      verdict: verdictOf({ status: 'D', result: 'WA' }),
      problemName: null,
      problemPoints: 100,
      isProblemLoading: false,
      isLive: false,
    },
  });

/** The value cell that follows each label, in the order the labels are rendered. */
const valueCellOf = (label: Element) => label.nextElementSibling;

describe('submission summary facts', () => {
  it('renders its fact rows in the order of the shared list', () => {
    const labels = mountSummary()
      .findAll('dt[data-fact]')
      .map((label) => label.attributes('data-fact'));
    expect(labels).toEqual([...SUMMARY_FACT_KEYS]);
  });

  it('puts the author avatar, at 32 px, in the author row', () => {
    const author = mountSummary().find(`dt[data-fact="${AUTHOR_FACT_KEY}"]`).element;
    const avatar = valueCellOf(author)!.querySelector('svg');
    expect(avatar?.getAttribute('width')).toBe('32');
  });

  it('reserves a 32 px square in the skeleton author row and nowhere else', () => {
    const skeleton = mountComponent(SubmissionSummarySkeleton);
    const values = skeleton
      .findAll('dt[data-skeleton-region="fact"]')
      .map((label) => valueCellOf(label.element));
    const authorIndex = SUMMARY_FACT_KEYS.indexOf(AUTHOR_FACT_KEY);
    values.forEach((value, index) => {
      const hasSquare = value!.querySelector('.size-8') !== null;
      expect(hasSquare).toBe(index === authorIndex);
    });
  });
});
