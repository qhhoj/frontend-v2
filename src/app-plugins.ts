import { VueQueryPlugin } from '@tanstack/vue-query';
import type { QueryClient } from '@tanstack/vue-query';
import type { Pinia } from 'pinia';
import type { Plugin } from 'vue';
import PrimeVue from 'primevue/config';
import type { Router } from 'vue-router';
import { i18n } from './i18n';
import { primeVuePreset } from './theme/primevue-preset';

export type PluginEntry = [Plugin, ...unknown[]];

/** Every plugin the app installs, in order; main.ts and the test mount helper both use this list. */
export const appPlugins = ({
  pinia,
  router,
  queryClient,
}: {
  pinia: Pinia;
  router: Router;
  queryClient: QueryClient;
}): PluginEntry[] => [
  [pinia],
  [router],
  [i18n],
  [VueQueryPlugin, { queryClient }],
  [PrimeVue, { unstyled: true, pt: primeVuePreset }],
];
