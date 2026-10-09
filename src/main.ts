import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import { appPlugins } from './app-plugins';
import { createQueryClient } from './api/query-client';
import { createAppRouter } from './router';
import { useLocaleStore } from './stores/locale.store';
import { useAppearanceStore } from './theme/appearance.store';
import { useLowPowerStore } from './theme/low-power.store';
import { useThemeStore } from './theme/theme.store';
import './theme/styles.css';

const app = createApp(App);
const pinia = createPinia();
for (const [plugin, ...options] of appPlugins({
  pinia,
  router: createAppRouter(),
  queryClient: createQueryClient(),
}))
  app.use(plugin, ...options);
useThemeStore(pinia);
useAppearanceStore(pinia);
useLowPowerStore(pinia);
useLocaleStore(pinia);
app.mount('#app');
