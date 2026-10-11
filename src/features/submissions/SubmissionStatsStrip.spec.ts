import { beforeEach, describe, expect, it } from 'vitest';
import { submissionStats } from '@/test/fixtures';
import { mockApi } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import { anonymousViewer } from '@/test/problem-routes';
import SubmissionStatsStrip from './SubmissionStatsStrip.vue';

beforeEach(() => mockApi({ ...anonymousViewer }));

describe('the submission stats strip', () => {
  it('shows a dash instead of NaN or 0% when nothing was judged today', () => {
    const wrapper = mountComponent(SubmissionStatsStrip, {
      props: { stats: submissionStats({ judgedToday: 0, acceptedToday: 0 }) },
    });
    expect(wrapper.text()).not.toContain('NaN');
    expect(wrapper.text()).not.toContain('0%');
  });

  it('says in words that no judge is online', () => {
    const wrapper = mountComponent(SubmissionStatsStrip, {
      props: { stats: submissionStats({ judgesOnline: 0 }) },
    });
    expect(wrapper.text()).toContain('0 / 4');
    expect(wrapper.text()).toContain('không có máy chấm');
  });

  it('does not warn about judges when none are registered at all', () => {
    const wrapper = mountComponent(SubmissionStatsStrip, {
      props: { stats: submissionStats({ judgesOnline: 0, judgesTotal: 0 }) },
    });
    expect(wrapper.text()).not.toContain('không có máy chấm');
  });
});
