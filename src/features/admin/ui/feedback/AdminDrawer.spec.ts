import { describe, expect, it } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { defineComponent, h, nextTick, ref } from 'vue';
import { mountComponent } from '@/test/mount';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import AdminDrawer from '../AdminDrawer.vue';

const isOpen = ref(false);
const isConfirming = ref(false);
const Host = defineComponent({
  setup: () => () => [
    h('button', { id: 'opener', onClick: () => (isOpen.value = true) }, 'Sửa'),
    h(
      AdminDrawer,
      {
        title: 'tuan_k',
        visible: isOpen.value,
        'onUpdate:visible': (next: boolean) => (isOpen.value = next),
      },
      { default: () => h('p', 'Hồ sơ') },
    ),
    h(ConfirmDialog, {
      title: 'Xóa?',
      confirmLabel: 'Xóa',
      visible: isConfirming.value,
      'onUpdate:visible': (next: boolean) => (isConfirming.value = next),
    }),
  ],
});

const settle = async () => {
  await flushPromises();
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 50));
  await flushPromises();
};

describe('AdminDrawer', () => {
  it('is a dialog named by its title, starts on the title, and gives focus back on Escape', async () => {
    isOpen.value = false;
    mountComponent(Host);
    const opener = document.getElementById('opener')!;
    opener.focus();
    opener.click();
    await settle();
    const dialog = document.querySelector('[role="dialog"]')!;
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(document.getElementById(dialog.getAttribute('aria-labelledby')!)!.textContent).toContain(
      'tuan_k',
    );
    expect(document.activeElement?.textContent).toContain('tuan_k');
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape' }));
    await settle();
    expect(isOpen.value).toBe(false);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it('closes one overlay per Escape: a confirm dialog over the drawer first, then the drawer', async () => {
    isOpen.value = false;
    isConfirming.value = false;
    mountComponent(Host);
    isOpen.value = true;
    await settle();
    isConfirming.value = true;
    await settle();
    const escape = () =>
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', key: 'Escape' }));
    escape();
    await settle();
    expect(isConfirming.value).toBe(false);
    expect(isOpen.value).toBe(true);
    escape();
    await settle();
    expect(isOpen.value).toBe(false);
  });
});
