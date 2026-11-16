import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import { appPlugins } from './app-plugins';
import { createQueryClient } from './api/query-client';
import { createStaleChunkReloader, installStaleChunkReload } from './lib/stale-chunk-reload';
import { syncClockWithServer } from './api/site.api';
import { keepServerClockSynced } from './lib/server-clock-sync';
import { announceMigratedLook } from './features/appearance/announce-migrated-look';
import { createAppRouter } from './router';
import { useLocaleStore } from './stores/locale.store';
import { useAppearanceStore } from './theme/appearance.store';
import { migrateStoredLook } from './theme/legacy-look';
import { useLowPowerStore } from './theme/low-power.store';
import { usePaletteStore } from './theme/palette.store';
import { useThemeStore } from './theme/theme.store';
import './theme/styles.css';

// Before any store reads this browser's choices: Clay and Glass ones move to palette A (told once, after mounting).
const lookWasMigrated = migrateStoredLook();
const app = createApp(App);
const pinia = createPinia();
const router = createAppRouter();
installStaleChunkReload(
  router,
  createStaleChunkReloader(
    () => sessionStorage,
    __APP_COMMIT__,
    (target) => window.location.assign(target),
  ),
);
for (const [plugin, ...options] of appPlugins({
  pinia,
  router,
  queryClient: createQueryClient(),
}))
  app.use(plugin, ...options);
usePaletteStore(pinia);
useThemeStore(pinia);
useAppearanceStore(pinia);
useLowPowerStore(pinia);
useLocaleStore(pinia);
keepServerClockSynced(syncClockWithServer);
app.mount('#app');
if (lookWasMigrated) announceMigratedLook();
