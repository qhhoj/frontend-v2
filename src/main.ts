import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import { i18n } from './i18n';
import { useLocaleStore } from './stores/locale.store';
import { useThemeStore } from './theme/theme.store';
import './theme/styles.css';

const app = createApp(App).use(createPinia()).use(i18n);
useThemeStore();
useLocaleStore();
app.mount('#app');
