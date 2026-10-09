import { describe, expect, it } from 'vitest';
import { mountComponent } from '@/test/mount';
import RejudgeCountPanel from './RejudgeCountPanel.vue';
import type { RejudgeCountState } from './use-rejudge-count';

const COUNTED_AT = '2026-10-09T07:52:31.000Z';
const render = (state: RejudgeCountState) =>
  mountComponent(RejudgeCountPanel, { props: { state } });

describe('RejudgeCountPanel', () => {
  it('draws nothing before a count starts', () => {
    expect(render({ kind: 'idle' }).text()).toBe('');
  });

  it('says it is counting and that nothing was reset', () => {
    const wrapper = render({ kind: 'counting' });
    expect(wrapper.get('[role="status"]').attributes('aria-busy')).toBe('true');
    expect(wrapper.text()).toContain('Đang đếm');
    expect(wrapper.text()).toContain('Chưa có gì bị đặt lại.');
  });

  it('shows the count, that the run is allowed, and when it was counted', () => {
    const wrapper = render({ kind: 'ready', count: 1340, allowed: true, countedAt: COUNTED_AT });
    expect(wrapper.text()).toContain('1.340');
    expect(wrapper.text()).toContain('Được phép chạy');
    expect(wrapper.text()).toContain('Đếm lúc');
    expect(wrapper.get('[role="status"]').attributes('aria-busy')).toBeUndefined();
  });

  it('names the permission when the count is over the limit', () => {
    const wrapper = render({ kind: 'ready', count: 1340, allowed: false, countedAt: COUNTED_AT });
    expect(wrapper.text()).toContain('Cần quyền riêng');
    expect(wrapper.text()).toContain('vượt giới hạn 10');
    expect(wrapper.text()).toContain('judge.rejudge_submission_lot');
    expect(wrapper.text()).not.toContain('Được phép chạy');
  });

  it('says nothing matches instead of offering a rejudge of zero', () => {
    const wrapper = render({ kind: 'ready', count: 0, allowed: true, countedAt: COUNTED_AT });
    expect(wrapper.text()).toContain('Không có bài nộp nào khớp bộ lọc.');
    expect(wrapper.text()).not.toContain('Được phép chạy');
  });

  it('shows a failed count as an alert line', () => {
    const wrapper = render({ kind: 'failed', text: 'Bạn không có quyền làm việc này.' });
    expect(wrapper.get('[role="alert"]').text()).toContain('Bạn không có quyền làm việc này.');
  });
});
