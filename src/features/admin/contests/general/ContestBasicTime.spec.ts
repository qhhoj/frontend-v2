import { describe, expect, it } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';
import { provideDateValidity } from '@/components/ui/date-validity';
import { emptyContestForm } from '../contest-form';
import { mountComponent } from '@/test/mount';
import ContestBasicTime from './ContestBasicTime.vue';

describe('ContestBasicTime quick length', () => {
  it('leaves an unreadable start as typed, with the save still refused', async () => {
    const form = ref({
      ...emptyContestForm(),
      startTime: '2026-11-20T01:00:00.000Z',
      endTime: '2026-11-20T03:00:00.000Z',
    });
    let validity!: ReturnType<typeof provideDateValidity>;
    const Host = defineComponent({
      setup() {
        validity = provideDateValidity();
        return () =>
          h(ContestBasicTime, {
            modelValue: form.value,
            'onUpdate:modelValue': (next: typeof form.value) => (form.value = next),
            errors: {},
          });
      },
    });
    const wrapper = mountComponent(Host);
    await flushPromises();
    const start = wrapper.get('#contest-startTime');
    await start.setValue('25/11/2026 14.00');
    await start.trigger('blur');
    await wrapper.get('[data-testid="contest-quick-45"]').trigger('click');
    await flushPromises();
    expect((start.element as HTMLInputElement).value).toBe('25/11/2026 14.00');
    expect((wrapper.get('#contest-endTime').element as HTMLInputElement).value).toBe(
      '20/11/2026 10:00',
    );
    expect(validity.hasUnreadableDate.value).toBe(true);
  });
});
