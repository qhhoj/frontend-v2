import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { mountComponent } from '@/test/mount';
import FormField from './FormField.vue';
import SelectField from './SelectField.vue';
import TextInput from './TextInput.vue';

type FieldProps = InstanceType<typeof FormField>['$props'];

/** A field around a control that is dropped in without slot props. */
const fieldWith = (control: object, props: FieldProps) =>
  defineComponent({ render: () => h(FormField, props, { default: () => h(control) }) });

describe('FormField', () => {
  it('describes the control by the hint, and by the error alone once there is one', () => {
    const hinted = mountComponent(fieldWith(TextInput, { label: 'Tên', hint: 'Tối đa 20 ký tự' }));
    const input = hinted.get('input');
    expect(hinted.get(`#${input.attributes('aria-describedby')}`).text()).toBe('Tối đa 20 ký tự');
    expect(input.attributes('aria-invalid')).toBeUndefined();

    const failed = mountComponent(
      fieldWith(TextInput, { label: 'Tên', hint: 'Tối đa 20 ký tự', error: 'Cần điền.' }),
    );
    const invalidInput = failed.get('input');
    expect(failed.text()).not.toContain('Tối đa 20 ký tự');
    expect(failed.get(`#${invalidInput.attributes('aria-describedby')}`).text()).toBe('Cần điền.');
    expect(invalidInput.attributes('aria-invalid')).toBe('true');
  });

  it('gives an injected control the label, and appends extra describing ids', () => {
    const field = mountComponent(
      fieldWith(SelectField, { label: 'Ngôn ngữ', inputId: 'lang', describedBy: 'meter' }),
    );
    const select = field.get('select');
    expect(select.attributes('id')).toBe('lang');
    expect(field.get('label').attributes('for')).toBe('lang');
    expect(select.attributes('aria-describedby')).toBe('meter');
  });

  it('names required and optional fields in the label', () => {
    const required = mountComponent(fieldWith(TextInput, { label: 'Tên', required: true }));
    expect(required.get('label').text()).toBe('Tên*bắt buộc');
    const optional = mountComponent(fieldWith(TextInput, { label: 'Trường', optional: true }));
    expect(optional.get('label').text()).toBe('Trường (tùy chọn)');
  });

  it('hands slot props to a control that binds them itself', () => {
    const field = mountComponent(
      defineComponent({
        render: () =>
          h(
            FormField,
            { label: 'Mô tả', error: 'Quá dài.' },
            {
              default: (control: { id: string; invalid?: string }) =>
                h('textarea', { id: control.id, 'aria-invalid': control.invalid }),
            },
          ),
      }),
    );
    const box = field.get('textarea');
    expect(field.get('label').attributes('for')).toBe(box.attributes('id'));
    expect(box.attributes('aria-invalid')).toBe('true');
  });
});
