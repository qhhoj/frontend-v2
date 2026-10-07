import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import { useThemeStore } from './theme/theme.store';
import './theme/styles.css';

const app = createApp(App).use(createPinia());
useThemeStore();
app.mount('#app');
