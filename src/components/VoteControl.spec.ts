import { flushPromises } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/api/client';
import { mockApi } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import { anonymousViewer } from '@/test/problem-routes';
import VoteControl from './VoteControl.vue';

beforeEach(() => mockApi({ ...anonymousViewer }));

const mountVote = (send: ReturnType<typeof vi.fn>, overrides: object = {}) =>
  mountComponent(VoteControl, {
    props: { score: 58, viewerVote: 0, canVote: true, send, ...overrides },
  });

describe('VoteControl', () => {
  it('votes up, shows the new score at once and the pressed state, then withdraws on a second press', async () => {
    const send = vi
      .fn()
      .mockResolvedValueOnce({ score: 59, viewerVote: 1 })
      .mockResolvedValueOnce({ score: 58, viewerVote: 0 });
    const wrapper = mountVote(send);
    const up = wrapper.get('button[aria-label="Bình chọn lên"]');
    await up.trigger('click');
    expect(wrapper.get('[data-testid="vote-score"]').text()).toBe('59');
    await flushPromises();
    expect(up.attributes('aria-pressed')).toBe('true');
    await up.trigger('click');
    await flushPromises();
    expect(send.mock.calls).toEqual([[1], [0]]);
    expect(wrapper.emitted('voted')).toHaveLength(2);
  });
  it('puts the score back and explains a refusal next to the arrows', async () => {
    const send = vi.fn().mockRejectedValue(new ApiError('forbidden', 403, 'gate'));
    const wrapper = mountVote(send);
    await wrapper.get('button[aria-label="Bình chọn xuống"]').trigger('click');
    await flushPromises();
    expect(wrapper.get('[data-testid="vote-score"]').text()).toBe('58');
    expect(wrapper.get('[role="alert"]').text()).toBe('Cần giải ít nhất 5 bài để bình chọn.');
  });
  it('sends nothing for a viewer who may not vote, and says so to assistive technology', async () => {
    const send = vi.fn();
    const wrapper = mountVote(send, { canVote: false });
    const up = wrapper.get('button[aria-label="Bình chọn lên"]');
    expect(up.attributes('aria-disabled')).toBe('true');
    await up.trigger('click');
    expect(send).not.toHaveBeenCalled();
  });
});
