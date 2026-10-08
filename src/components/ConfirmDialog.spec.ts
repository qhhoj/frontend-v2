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

describe('ConfirmDialog', () => {
  it('shows its title, body and confirm label', async () => {
    mountComponent(ConfirmDialog, { props: { ...ASK, visible: true } });
    await flushPromises();
    expect(dialog().textContent).toContain('Rời kỳ thi?');
    expect(dialog().textContent).toContain('Điểm giữ nguyên.');
    expect(buttonNamed('Rời kỳ thi')).toBeDefined();
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
    expect(buttonNamed('Rời kỳ thi').getAttribute('aria-disabled')).toBe('true');
  });

  it('closes without confirming when cancelled', async () => {
    const wrapper = mountComponent(ConfirmDialog, { props: { ...ASK, visible: true } });
    await flushPromises();
    buttonNamed('Hủy').click();
    await flushPromises();
    expect(wrapper.emitted('update:visible')).toEqual([[false]]);
    expect(wrapper.emitted('confirm')).toBeUndefined();
  });
});
