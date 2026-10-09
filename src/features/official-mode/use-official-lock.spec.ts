import { flushPromises } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';
import { describe, expect, it } from 'vitest';
import { sessionUser, signedIn } from '@/test/fixtures';
import { mockApi, ok } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import OfficialLockNote from './OfficialLockNote.vue';
import { useOfficialLock } from './use-official-lock';

const clicks = ref(0);
const Probe = defineComponent({
  setup() {
    const lock = useOfficialLock();
    return () =>
      h('div', [
        h(
          'button',
          { ...lock.lockAttrs.value, onClick: () => lock.isLocked.value || (clicks.value += 1) },
          'Rời tổ chức',
        ),
        lock.isLocked.value ? h(OfficialLockNote, { id: lock.noteId }) : null,
      ]);
  },
});

async function mountAs(officialMode: boolean, isSuperuser = false) {
  mockApi({
    'GET /auth/me': signedIn({ user: sessionUser({ isSuperuser }) }),
    'GET /site': ok({ navigation: [], config: {}, officialMode }),
  });
  clicks.value = 0;
  const wrapper = mountComponent(Probe);
  await flushPromises();
  return wrapper;
}

describe('useOfficialLock', () => {
  it('disables the control, points it at the reason and swallows the click', async () => {
    const wrapper = await mountAs(true);
    const button = wrapper.get('button');
    const note = wrapper.get('[data-testid="official-lock-note"]');
    expect(button.attributes('aria-disabled')).toBe('true');
    expect(button.attributes('aria-describedby')).toBe(note.attributes('id'));
    expect(note.text()).toBe('Bị khóa trong kỳ thi chính thức.');
    await button.trigger('click');
    expect(clicks.value).toBe(0);
  });

  it('leaves the control alone while the mode is off and for a superuser', async () => {
    for (const [officialMode, isSuperuser] of [
      [false, false],
      [true, true],
    ] as const) {
      const wrapper = await mountAs(officialMode, isSuperuser);
      expect(wrapper.get('button').attributes('aria-disabled')).toBeUndefined();
      expect(wrapper.find('[data-testid="official-lock-note"]').exists()).toBe(false);
      await wrapper.get('button').trigger('click');
      expect(clicks.value).toBe(1);
      wrapper.unmount();
    }
  });
});
