import { flushPromises } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { mountComponent } from '@/test/mount';
import Modal from './Modal.vue';
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
  await flushPromises();
  byId('opener').focus();
  byId('opener').click();
  await flushPromises();
}

/** A dismissable Modal holding an opener and its popover, opened; resolves to the Modal's `update:visible` spy. */
async function openInModal() {
  const onUpdate = vi.fn();
  const popover = ref<InstanceType<typeof Popover>>();
  mountComponent(
    defineComponent({
      setup: () => () =>
        h(
          Modal,
          { visible: true, dismissable: true, title: 'A', 'onUpdate:visible': onUpdate },
          () => [
            h('button', { id: 'opener', onClick: (event: Event) => popover.value?.toggle(event) }),
            h(Popover, { ref: popover, label: 'Bộ lọc' }, () => h('button', { id: 'first' })),
          ],
        ),
    }),
  );
  await flushPromises();
  byId('opener').click();
  await flushPromises();
  return onUpdate;
}

describe('Popover', () => {
  it('is a named dialog whose first control takes focus when it opens', async () => {
    await open();
    expect(popoverEl()?.getAttribute('aria-label')).toBe('Bộ lọc');
    expect(document.activeElement).toBe(byId('first'));
  });

  it('gives focus back to its opener when Escape closes it', async () => {
    await open();
    byId('first').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
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

  it('takes Escape for itself inside a dialog: the popover closes, the dialog stays', async () => {
    const onUpdate = await openInModal();
    byId('first').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    await vi.waitFor(() => expect(document.querySelector('[data-popup]')).toBeNull());
    expect(onUpdate).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(byId('opener'));
  });

  it('takes a backdrop click for itself inside a dismissable dialog: the popover closes, the dialog stays', async () => {
    const onUpdate = await openInModal();
    const dialog = document.querySelector('dialog')!;
    const outside = { bubbles: true, clientX: 900, clientY: 900 }; // jsdom lays the dialog out at 0×0
    dialog.dispatchEvent(new MouseEvent('pointerdown', outside));
    dialog.dispatchEvent(new MouseEvent('click', outside));
    await vi.waitFor(() => expect(document.querySelector('[data-popup]')).toBeNull());
    expect(onUpdate).not.toHaveBeenCalled();
  });
});
