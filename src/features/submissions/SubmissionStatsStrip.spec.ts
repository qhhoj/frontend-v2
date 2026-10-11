import { beforeEach, describe, expect, it } from 'vitest';
import type { SubmissionStats } from '@/api/types/submissions';
import { submissionStats } from '@/test/fixtures';
import { mockApi } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import { anonymousViewer } from '@/test/problem-routes';
import SubmissionStatsStrip from './SubmissionStatsStrip.vue';

beforeEach(() => mockApi({ ...anonymousViewer }));

describe('the submission stats strip', () => {
  it('shows a dash instead of NaN or 0% when nothing was judged today', () => {
    const wrapper = mountComponent(SubmissionStatsStrip, {
      props: { stats: submissionStats({ judgedToday: 0, acceptedToday: 0 }), live: true },
    });
    expect(wrapper.text()).not.toContain('NaN');
    expect(wrapper.text()).not.toContain('0%');
  });

  it('says in words that no judge is online', () => {
    const wrapper = mountComponent(SubmissionStatsStrip, {
      props: { stats: submissionStats({ judgesOnline: 0 }), live: true },
    });
    expect(wrapper.text()).toContain('0/4');
    expect(wrapper.text()).toContain('không có máy chấm');
  });

  it('does not warn about judges when none are registered at all', () => {
    const wrapper = mountComponent(SubmissionStatsStrip, {
      props: { stats: submissionStats({ judgesOnline: 0, judgesTotal: 0 }), live: true },
    });
    expect(wrapper.text()).not.toContain('không có máy chấm');
  });

  it("draws today's verdicts with a legend of shares that add up to 100%", () => {
    const wrapper = mountComponent(SubmissionStatsStrip, {
      props: { stats: submissionStats(), live: true },
    });
    const legend = wrapper
      .findAll('[data-testid="verdict-distribution"] li')
      .map((item) => item.text());
    expect(legend).toEqual(['AC41%', 'WA37%', 'TLE12%', 'RTE6%', 'CE4%']);
  });

  it('leaves the bar out for a backend that does not send the verdicts', () => {
    const older: Partial<SubmissionStats> = submissionStats();
    delete older.verdictsToday;
    const wrapper = mountComponent(SubmissionStatsStrip, {
      props: { stats: older, live: true },
    });
    expect(wrapper.find('[data-testid="verdict-distribution"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('1.284');
  });
});
