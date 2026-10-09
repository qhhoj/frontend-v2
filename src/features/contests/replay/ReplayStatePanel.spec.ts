import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { mountComponent } from '@/test/mount';
import ReplayStatePanel from './ReplayStatePanel.vue';
import type { ReplayPanelState } from './replay-bits';

const panel = async (state: ReplayPanelState) => {
  const wrapper = mountComponent(ReplayStatePanel, { props: { state, contestKey: 'r41' } });
  await flushPromises();
  return wrapper;
};

describe('ReplayStatePanel', () => {
  it.each([
    ['building', 'judging', 'Đang dựng bản phát lại…', 'status'],
    ['notReady', 'asleep', 'Bản phát lại chưa sẵn sàng', undefined],
    ['notEnded', 'contest', 'Kỳ thi chưa kết thúc', undefined],
    ['unsupported', 'sweat', 'Không hỗ trợ cho định dạng này', undefined],
    ['frozen', 'security', 'Bảng đang đóng băng', 'alert'],
    ['forbidden', 'security', 'Bạn không xem được bảng này', 'alert'],
    ['error', 'sweat', 'Không tải được bản phát lại', 'alert'],
    ['empty', 'asleep', 'Chưa có thí sinh', undefined],
  ] as const)(
    '%s shows Bit %s, its heading and the right role',
    async (state, variant, title, role) => {
      const wrapper = await panel(state);
      expect(wrapper.get('[data-bit-variant]').attributes('data-bit-variant')).toBe(variant);
      expect(wrapper.get('h2').text()).toBe(title);
      expect(wrapper.get('[data-testid="replay-state"]').attributes('role')).toBe(role);
    },
  );

  it('offers a retry on an error and nowhere else', async () => {
    const wrapper = await panel('error');
    await wrapper.get('button').trigger('click');
    expect(wrapper.emitted('retry')).toHaveLength(1);
    expect((await panel('building')).find('button').exists()).toBe(false);
  });

  it('links back to the ranking when the replay cannot be shown but the contest can', async () => {
    const wrapper = await panel('frozen');
    expect(wrapper.get('a').attributes('href')).toBe('/contests/r41/ranking');
  });
});
