import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import { mountComponent } from './mount';
import { cancelDialog, confirmDialog } from './admin-routes';

const open = (extra: Record<string, unknown> = {}) =>
  mountComponent(ConfirmDialog, {
    props: { title: 'Chấm lại?', confirmLabel: 'Chấm lại', visible: true, ...extra },
  });

describe('confirmDialog helper', () => {
  it('presses the confirm button named by its label, not the cancel button', async () => {
    const wrapper = open();
    await flushPromises();
    await confirmDialog('Chấm lại');
    expect(wrapper.emitted('confirm')).toHaveLength(1);
  });

  it('throws when no confirm button has that label', async () => {
    open();
    await flushPromises();
    await expect(confirmDialog('Xóa')).rejects.toThrow('No confirm button "Xóa"');
  });

  it('cancels without confirming', async () => {
    const wrapper = open();
    await flushPromises();
    await cancelDialog();
    expect(wrapper.emitted('confirm')).toBeUndefined();
    expect(wrapper.emitted('update:visible')).toEqual([[false]]);
  });
});
