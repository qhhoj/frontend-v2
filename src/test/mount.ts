import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createMemoryHistory } from 'vue-router';
import App from '@/App.vue';
import { appPlugins } from '@/app-plugins';
import { createQueryClient } from '@/api/query-client';
import { createAppRouter } from '@/router';
import { useLocaleStore } from '@/stores/locale.store';
import { useThemeStore } from '@/theme/theme.store';

/** Mounts the whole app at `path` like main.ts does (memory history, no query retries). Mock the API first. */
export async function mountApp(path: string) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const router = createAppRouter(createMemoryHistory());
  const queryClient = createQueryClient();
  queryClient.setDefaultOptions({
    queries: { ...queryClient.getDefaultOptions().queries, retry: false },
  });
  useThemeStore();
  useLocaleStore();
  await router.push(path);
  const wrapper = mount(App, {
    attachTo: document.body,
    global: { plugins: appPlugins({ pinia, router, queryClient }) },
  });
  await flushPromises();
  return { wrapper, router, queryClient };
}
