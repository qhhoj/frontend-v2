import { afterEach } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createMemoryHistory } from 'vue-router';
import type { RouterHistory } from 'vue-router';
import App from '@/App.vue';
import { appPlugins } from '@/app-plugins';
import { createQueryClient } from '@/api/query-client';
import { createAppRouter } from '@/router';
import { useLocaleStore } from '@/stores/locale.store';
import { useAppearanceStore } from '@/theme/appearance.store';
import { useLowPowerStore } from '@/theme/low-power.store';
import { useThemeStore } from '@/theme/theme.store';

/** Mounts the whole app at `path` like main.ts does (memory history unless one is given, no query retries). Mock the API first. */
export async function mountApp(path: string, history: RouterHistory = createMemoryHistory()) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const router = createAppRouter(history);
  const queryClient = createQueryClient();
  queryClient.setDefaultOptions({
    queries: { ...queryClient.getDefaultOptions().queries, retry: false },
  });
  useThemeStore();
  useAppearanceStore();
  useLowPowerStore();
  useLocaleStore();
  await router.push(path);
  const wrapper = mount(App, {
    attachTo: document.body,
    // Real transitions: PrimeVue overlays emit show/hide from transition hooks; a stubbed TransitionGroup renders no `tag` element.
    global: {
      plugins: appPlugins({ pinia, router, queryClient }),
      stubs: { transition: false, 'transition-group': false },
    },
  });
  await flushPromises();
  return { wrapper, router, queryClient };
}

const mounted: VueWrapper[] = [];
afterEach(() => mounted.splice(0).forEach((wrapper) => wrapper.unmount()));

/** Mounts one component with the app's plugins (router not navigated). */
export function mountComponent(
  component: Parameters<typeof mount>[0],
  options: { props?: Record<string, unknown>; slots?: Record<string, string> } = {},
) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const router = createAppRouter(createMemoryHistory());
  const queryClient = createQueryClient();
  const wrapper = mount(component, {
    ...options,
    attachTo: document.body,
    global: {
      plugins: appPlugins({ pinia, router, queryClient }),
      stubs: { transition: false, 'transition-group': false },
    },
  });
  mounted.push(wrapper);
  return wrapper;
}
