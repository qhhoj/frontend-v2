import { flushPromises } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { mountComponent } from '@/test/mount';
import Popover from './Popover.vue';

const byId = (id: string) => document.getElementById(id)!;
const popoverEl = () => document.body.querySelector<HTMLElement>('[role="dialog"]');

/** An opener, a control outside the popover, and a popover holding two buttons; `afterHide` runs after the second closes it. */
const host = (afterHide: () => void = () => {}) =>
  defineComponent({
    setup() {
      const popover = ref<InstanceType<typeof Popover>>();
      return () =>
        h('div', [
          h('button', { id: 'opener', onClick: (event: Event) => popover.value?.toggle(event) }),
          h('button', { id: 'outside' }),
          h(Popover, { ref: popover, label: 'Bộ lọc' }, () => [
            h('button', { id: 'first' }),
            h('button', {
              id: 'second',
              onClick: () => {
                popover.value?.hide();
                afterHide();
              },
            }),
          ]),
        ]);
    },
  });

async function open(afterHide?: () => void) {
  mountComponent(host(afterHide));
  await flushPromises(); // PrimeVue's overlay only reacts to its first open once it has mounted its portal
  byId('opener').focus();
  byId('opener').click();
  await flushPromises();
}

describe('Popover', () => {
  it('is a named dialog whose first control takes focus when it opens', async () => {
    await open();
    expect(popoverEl()?.getAttribute('aria-label')).toBe('Bộ lọc');
    expect(document.activeElement).toBe(byId('first'));
  });

  it('gives focus back to its opener when Escape closes it', async () => {
    await open();
    byId('first').dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true }));
    await vi.waitFor(() => expect(popoverEl()).toBeNull());
    expect(document.activeElement).toBe(byId('opener'));
  });

  it('gives focus back to its opener when one of its own buttons closes it', async () => {
    await open();
    byId('second').click();
    await vi.waitFor(() => expect(popoverEl()).toBeNull());
    expect(document.activeElement).toBe(byId('opener'));
  });

  it('leaves focus where the closing action sent it', async () => {
    await open(() => byId('outside').focus());
    byId('second').click();
    await vi.waitFor(() => expect(popoverEl()).toBeNull());
    expect(document.activeElement).toBe(byId('outside'));
  });

  it('does not take focus from a control outside it when it closes by a click elsewhere', async () => {
    await open();
    byId('outside').focus();
    byId('outside').click();
    await vi.waitFor(() => expect(popoverEl()).toBeNull());
    expect(document.activeElement).toBe(byId('outside'));
  });
});
