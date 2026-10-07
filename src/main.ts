import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import { appPlugins } from './app-plugins';
import { createQueryClient } from './api/query-client';
import { createAppRouter } from './router';
import { useLocaleStore } from './stores/locale.store';
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
useLocaleStore(pinia);
app.mount('#app');
