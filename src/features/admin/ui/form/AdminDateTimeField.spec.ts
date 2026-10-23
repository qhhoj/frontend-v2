import { describe, expect, it } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { mountComponent } from '@/test/mount';
import AdminDateTimeField from './AdminDateTimeField.vue';
import { provideDateValidity } from './date-validity';

const mountField = (modelValue: string | null) =>
  mountComponent(AdminDateTimeField, { props: { modelValue, label: 'Bắt đầu' } });

describe('AdminDateTimeField', () => {
  it('shows the instant on the site clock with the zone', () => {
    const wrapper = mountField('2026-10-08T06:00:00.000Z');
    expect(wrapper.get('input').element.value).toBe('08/10/2026 13:00');
    expect(wrapper.text()).toContain('GMT+7');
  });

  it('sends the typed site time as a UTC instant', async () => {
    const wrapper = mountField(null);
    await wrapper.get('input').setValue('09/10/2026 08:30');
    expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['2026-10-09T01:30:00.000Z']);
  });

  it('keeps the model and says why when the text is not a date', async () => {
    const wrapper = mountField('2026-10-08T06:00:00.000Z');
    const input = wrapper.get('input');
    await input.setValue('31/02/2026 10:00');
    await input.trigger('blur');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(input.attributes('aria-invalid')).toBe('true');
    expect(wrapper.text()).toContain('dd/mm/yyyy hh:mm');
  });

  it('rewrites the box when the model changes from outside', async () => {
    const wrapper = mountField('2026-10-08T06:00:00.000Z');
    await wrapper.setProps({ modelValue: '2026-10-08T07:15:00.000Z' } as Record<string, unknown>);
    expect(wrapper.get('input').element.value).toBe('08/10/2026 14:15');
  });

  it('offers "Bây giờ" unless the field takes a day alone', () => {
    expect(mountField(null).text()).toContain('Bây giờ');
    const dayField = mountComponent(AdminDateTimeField, {
      props: { modelValue: null, label: 'Từ ngày', dateOnly: true },
    });
    expect(dayField.text()).not.toContain('Bây giờ');
  });

  describe('as a day box', () => {
    const mountDay = (modelValue: string | null) =>
      mountComponent(AdminDateTimeField, {
        props: { modelValue, label: 'Từ ngày', dateOnly: true },
      });

    it('shows the site day as dd/mm/yyyy', () => {
      expect(mountDay('2026-10-08T17:00:00.000Z').get('input').element.value).toBe('09/10/2026');
    });

    it('sends the typed day as the instant that day starts on the site clock', async () => {
      const wrapper = mountDay(null);
      await wrapper.get('input').setValue('09/10/2026');
      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['2026-10-08T17:00:00.000Z']);
    });

    it('refuses a time of day', async () => {
      const wrapper = mountDay(null);
      const input = wrapper.get('input');
      await input.setValue('09/10/2026 08:30');
      await input.trigger('blur');
      expect(wrapper.emitted('update:modelValue')).toBeUndefined();
      expect(input.attributes('aria-invalid')).toBe('true');
    });
  });

  describe('telling the form about unreadable text', () => {
    /** A form that owns the save: it renders whether a save would be refused. */
    const isShown = ref(true);
    let resetForm = () => undefined as void;
    const Form = defineComponent({
      setup() {
        const { hasUnreadableDate, resetDates } = provideDateValidity();
        resetForm = resetDates;
        return () =>
          h('div', [
            isShown.value ? h(AdminDateTimeField, { modelValue: null, label: 'Từ' }) : null,
            h('output', hasUnreadableDate.value ? 'refused' : 'ok'),
          ]);
      },
    });
    const mountForm = () => mountComponent(Form);

    it('flags the form from the first unreadable keystroke and clears it when the text reads', async () => {
      const wrapper = mountForm();
      await wrapper.get('input').setValue('abc');
      expect(wrapper.get('output').text()).toBe('refused');
      await wrapper.get('input').setValue('09/10/2026 08:30');
      expect(wrapper.get('output').text()).toBe('ok');
    });

    it('stays flagged after blur and shows the error under the box', async () => {
      const wrapper = mountForm();
      await wrapper.get('input').setValue('abc');
      await wrapper.get('input').trigger('blur');
      expect(wrapper.get('output').text()).toBe('refused');
      expect(wrapper.get('input').attributes('aria-invalid')).toBe('true');
    });

    it('says why on Enter, before the form submits', async () => {
      const wrapper = mountForm();
      await wrapper.get('input').setValue('abc');
      await wrapper.get('input').trigger('keydown', { key: 'Enter' });
      expect(wrapper.text()).toContain('dd/mm/yyyy hh:mm');
    });

    it('treats an emptied box as a readable "no date"', async () => {
      const wrapper = mountForm();
      await wrapper.get('input').setValue('abc');
      await wrapper.get('input').setValue('');
      expect(wrapper.get('output').text()).toBe('ok');
    });

    it('shows the model again with no error when the form resets, even if the model did not change', async () => {
      const wrapper = mountForm();
      await wrapper.get('input').setValue('abc');
      await wrapper.get('input').trigger('blur');
      expect(wrapper.get('output').text()).toBe('refused');
      resetForm();
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();
      expect(wrapper.get('input').element.value).toBe('');
      expect(wrapper.get('input').attributes('aria-invalid')).toBe('false');
      expect(wrapper.get('output').text()).toBe('ok');
    });

    it('stops blocking the form once the field is gone', async () => {
      isShown.value = true;
      const wrapper = mountForm();
      await wrapper.get('input').setValue('abc');
      isShown.value = false;
      await wrapper.vm.$nextTick();
      expect(wrapper.get('output').text()).toBe('ok');
    });
  });
});
