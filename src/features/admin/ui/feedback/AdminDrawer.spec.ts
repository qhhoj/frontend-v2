import { describe, expect, it } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { defineComponent, h, nextTick, ref } from 'vue';
import { mountComponent } from '@/test/mount';
import AdminDrawer from '../AdminDrawer.vue';

const isOpen = ref(false);
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
});
