import { flushPromises, mount } from '@vue/test-utils';
import { computed, defineComponent, h, ref } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import FilterBar from './FilterBar.vue';

const Blank = { render: () => h('div') };

/** A list page: the search text lives in `search` (the URL's role), and the exact match follows it. */
async function mountBar() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: Blank },
      { path: '/open', component: Blank },
    ],
  });
  await router.push('/');
  const search = ref('');
  const Host = defineComponent({
    setup: () => {
      const exact = computed(() =>
        search.value
          ? { label: `Mở ${search.value}`, to: { path: '/open', query: { user: search.value } } }
          : null,
      );
      return () =>
        h(FilterBar, {
          search: search.value,
          'onUpdate:search': (text: string) => (search.value = text),
          searchLabel: 'Tìm',
          exact: exact.value,
        });
    },
  });
  const wrapper = mount(Host, { global: { plugins: [router] } });
  return { wrapper, router, search };
}

describe('FilterBar exact match', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('opens the exact match for text typed just before Enter, not an older prefix', async () => {
    const { wrapper, router } = await mountBar();
    const input = wrapper.get('input');
    await input.setValue('users_');
    vi.advanceTimersByTime(300);
    await flushPromises();
    await input.setValue('users_va');
    await input.trigger('keydown.enter');
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/open');
    expect(router.currentRoute.value.query.user).toBe('users_va');
  });

  it('opens straight away when the box text was already applied', async () => {
    const { wrapper, router } = await mountBar();
    const input = wrapper.get('input');
    await input.setValue('users_a');
    vi.advanceTimersByTime(300);
    await flushPromises();
    await input.trigger('keydown.enter');
    await flushPromises();
    expect(router.currentRoute.value.query.user).toBe('users_a');
  });
});
