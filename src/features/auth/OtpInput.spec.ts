import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { mountComponent } from '@/test/mount';
import OtpInput from './OtpInput.vue';

function mountOtp(initial = '', props: Record<string, unknown> = {}) {
  /** `mountComponent` types any component loosely: a variable passes where an object literal of unknown props would not. */
  const setProps = (changed: Record<string, unknown>) => wrapper.setProps(changed);
  const wrapper = mountComponent(OtpInput, {
    props: {
      modelValue: initial,
      'onUpdate:modelValue': (value: string) => setProps({ modelValue: value }),
      ...props,
    },
  });
  return wrapper;
}
type Otp = ReturnType<typeof mountOtp>;
const boxesOf = (wrapper: Otp) => wrapper.findAll('input');
const shown = (wrapper: Otp) =>
  boxesOf(wrapper)
    .map((box) => (box.element as HTMLInputElement).value)
    .join('');
const paste = async (wrapper: Otp, index: number, text: string) => {
  await boxesOf(wrapper)[index]!.trigger('paste', { clipboardData: { getData: () => text } });
  await flushPromises();
};

describe('OtpInput', () => {
  it('is a labelled group of six numeric boxes named by position, the first one for autofill', () => {
    const wrapper = mountOtp();
    expect(wrapper.get('[role="group"]').attributes('aria-label')).toBe('Mã 6 chữ số');
    const boxes = boxesOf(wrapper);
    expect(boxes.map((box) => box.attributes('aria-label'))).toEqual([
      'Chữ số 1',
      'Chữ số 2',
      'Chữ số 3',
      'Chữ số 4',
      'Chữ số 5',
      'Chữ số 6',
    ]);
    expect(boxes.every((box) => box.attributes('inputmode') === 'numeric')).toBe(true);
    expect(boxes.map((box) => box.attributes('autocomplete'))).toEqual([
      'one-time-code',
      'off',
      'off',
      'off',
      'off',
      'off',
    ]);
  });

  it('takes the group name from its caller when one is given', () => {
    const wrapper = mountOtp('', { label: 'Mã khôi phục' });
    expect(wrapper.get('[role="group"]').attributes('aria-label')).toBe('Mã khôi phục');
  });

  it('moves focus to the next box after each digit', async () => {
    const wrapper = mountOtp();
    await boxesOf(wrapper)[0]!.setValue('4');
    await flushPromises();
    expect(document.activeElement).toBe(boxesOf(wrapper)[1]!.element);
    await boxesOf(wrapper)[1]!.setValue('8');
    await flushPromises();
    expect(shown(wrapper)).toBe('48');
    expect(document.activeElement).toBe(boxesOf(wrapper)[2]!.element);
  });

  it.each(['481 923', '481-923', 'code 481923'])(
    'fills every box from the pasted text %j and completes once',
    async (text) => {
      const wrapper = mountOtp();
      await paste(wrapper, 0, text);
      expect(shown(wrapper)).toBe('481923');
      expect(wrapper.emitted('complete')).toEqual([['481923']]);
    },
  );

  it('puts a partial paste at the focused box', async () => {
    const wrapper = mountOtp('48');
    await paste(wrapper, 2, '17');
    expect(shown(wrapper)).toBe('4817');
    expect(document.activeElement).toBe(boxesOf(wrapper)[4]!.element);
    expect(wrapper.emitted('complete')).toBeUndefined();
  });

  it('refuses a letter and puts the box back', async () => {
    const wrapper = mountOtp();
    await boxesOf(wrapper)[0]!.setValue('a');
    await flushPromises();
    expect(shown(wrapper)).toBe('');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('completes when the sixth digit arrives, not before', async () => {
    const wrapper = mountOtp('12345');
    expect(wrapper.emitted('complete')).toBeUndefined();
    await boxesOf(wrapper)[5]!.setValue('6');
    await flushPromises();
    expect(wrapper.emitted('complete')).toEqual([['123456']]);
  });

  it('clears a digit with backspace and shifts the rest left', async () => {
    const wrapper = mountOtp('481');
    await boxesOf(wrapper)[0]!.setValue('');
    await flushPromises();
    expect(shown(wrapper)).toBe('81');
  });

  it('clears the previous digit when backspace is pressed in an empty box', async () => {
    const wrapper = mountOtp('48');
    await boxesOf(wrapper)[2]!.trigger('keydown', { key: 'Backspace' });
    await flushPromises();
    expect(shown(wrapper)).toBe('4');
    expect(document.activeElement).toBe(boxesOf(wrapper)[1]!.element);
  });

  it('moves with the arrow keys but never past the first empty box', async () => {
    const wrapper = mountOtp('48');
    const boxes = boxesOf(wrapper);
    await boxes[0]!.trigger('keydown', { key: 'ArrowRight' });
    await flushPromises();
    expect(document.activeElement).toBe(boxes[1]!.element);
    await boxes[1]!.trigger('keydown', { key: 'ArrowRight' });
    await flushPromises();
    expect(document.activeElement).toBe(boxes[2]!.element);
    await boxes[2]!.trigger('keydown', { key: 'ArrowRight' });
    await flushPromises();
    expect(document.activeElement).toBe(boxes[2]!.element);
    await boxes[2]!.trigger('keydown', { key: 'ArrowLeft' });
    await flushPromises();
    expect(document.activeElement).toBe(boxes[1]!.element);
  });

  it('sends focus from a later empty box to the first empty one', () => {
    const wrapper = mountOtp('4');
    (boxesOf(wrapper)[4]!.element as HTMLInputElement).focus();
    expect(document.activeElement).toBe(boxesOf(wrapper)[1]!.element);
  });

  it('marks every box invalid and points each at the error text while the code is refused', () => {
    const wrapper = mountOtp('', { invalid: true, describedBy: 'code-error' });
    expect(
      boxesOf(wrapper).every(
        (box) =>
          box.attributes('aria-invalid') === 'true' &&
          box.attributes('aria-describedby') === 'code-error',
      ),
    ).toBe(true);
  });

  it('is read-only while busy but keeps its focus', () => {
    const wrapper = mountOtp('4', { readonly: true });
    expect(boxesOf(wrapper).every((box) => box.attributes('readonly') !== undefined)).toBe(true);
    expect(boxesOf(wrapper).some((box) => box.attributes('disabled') !== undefined)).toBe(false);
  });
});
