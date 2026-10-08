import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { mountComponent } from '@/test/mount';
import ConfirmDialog from './ConfirmDialog.vue';

const ASK = { title: 'Rời kỳ thi?', body: 'Điểm giữ nguyên.', confirmLabel: 'Rời kỳ thi' };
const dialog = () => document.body.querySelector<HTMLElement>('[role="dialog"]')!;
const buttonNamed = (name: string) =>
  [...dialog().querySelectorAll<HTMLButtonElement>('button')].find(
    (button) => button.textContent?.trim() === name,
  )!;
const pressEscape = () =>
  document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true }));

describe('ConfirmDialog', () => {
  it('shows its title, body and labels', async () => {
    mountComponent(ConfirmDialog, { props: { ...ASK, visible: true } });
    await flushPromises();
    expect(dialog().textContent).toContain('Rời kỳ thi?');
    expect(dialog().textContent).toContain('Điểm giữ nguyên.');
    expect(buttonNamed('Rời kỳ thi')).toBeDefined();
    expect(buttonNamed('Hủy')).toBeDefined();
  });

  it('uses the cancel label it is given', async () => {
    mountComponent(ConfirmDialog, { props: { ...ASK, cancelLabel: 'Ở lại', visible: true } });
    await flushPromises();
    expect(buttonNamed('Ở lại')).toBeDefined();
  });

  it('renders the default slot as the body and the error slot inside the dialog', async () => {
    mountComponent(ConfirmDialog, {
      props: { title: 'Nộp', confirmLabel: 'Nộp', visible: true },
      slots: { default: '<p>Nội dung tuỳ chỉnh</p>', error: '<p role="alert">Lỗi</p>' },
    });
    await flushPromises();
    expect(dialog().querySelector('[role="alert"]')!.textContent).toBe('Lỗi');
    expect(dialog().textContent).toContain('Nội dung tuỳ chỉnh');
  });

  it('describes the dialog by its body', async () => {
    mountComponent(ConfirmDialog, { props: { ...ASK, visible: true } });
    await flushPromises();
    const describedBy = dialog().getAttribute('aria-describedby')!;
    expect(describedBy).not.toBe('');
    expect(document.getElementById(describedBy)!.textContent).toContain('Điểm giữ nguyên.');
  });

  it('confirms when the confirm button is pressed', async () => {
    const wrapper = mountComponent(ConfirmDialog, { props: { ...ASK, visible: true } });
    await flushPromises();
    buttonNamed('Rời kỳ thi').click();
    await flushPromises();
    expect(wrapper.emitted('confirm')).toHaveLength(1);
  });

  it('does not confirm while busy', async () => {
    const wrapper = mountComponent(ConfirmDialog, { props: { ...ASK, visible: true, busy: true } });
    await flushPromises();
    buttonNamed('Rời kỳ thi').click();
    await flushPromises();
    expect(wrapper.emitted('confirm')).toBeUndefined();
    expect(buttonNamed('Rời kỳ thi').getAttribute('aria-busy')).toBe('true');
  });

  it('closes without confirming when cancelled', async () => {
    const wrapper = mountComponent(ConfirmDialog, { props: { ...ASK, visible: true } });
    await flushPromises();
    buttonNamed('Hủy').click();
    await flushPromises();
    expect(wrapper.emitted('update:visible')).toEqual([[false]]);
    expect(wrapper.emitted('confirm')).toBeUndefined();
  });

  it('closes on Escape when idle', async () => {
    const wrapper = mountComponent(ConfirmDialog, { props: { ...ASK, visible: true } });
    await flushPromises();
    pressEscape();
    await flushPromises();
    expect(wrapper.emitted('update:visible')).toEqual([[false]]);
  });

  it('blocks Cancel and Escape while busy', async () => {
    const wrapper = mountComponent(ConfirmDialog, { props: { ...ASK, visible: true, busy: true } });
    await flushPromises();
    buttonNamed('Hủy').click();
    pressEscape();
    await flushPromises();
    expect(wrapper.emitted('update:visible')).toBeUndefined();
  });
});
