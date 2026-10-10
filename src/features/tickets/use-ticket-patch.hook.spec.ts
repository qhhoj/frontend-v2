import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';
import { mockApi, ok } from '@/test/mock-api';
import { useTicketPatch } from './use-ticket-patch';

describe('useTicketPatch', () => {
  it('runs the onSaved of every call, even when a second patch starts before the first lands', async () => {
    mockApi({ 'PATCH /tickets/t1': ok({}) });
    const wrapper = mount(
      defineComponent({ setup: () => ({ hook: useTicketPatch('t1') }), render: () => null }),
      { global: { plugins: [[VueQueryPlugin, { queryClient: new QueryClient() }]] } },
    );
    const { patch } = (wrapper.vm as unknown as { hook: ReturnType<typeof useTicketPatch> }).hook;
    const first = vi.fn();
    const second = vi.fn();
    patch({ isOpen: false }, first);
    patch({ isOpen: true }, second);
    await flushPromises();
    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
  });
});
