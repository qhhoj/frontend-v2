import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

/** The api the dev server proxies `/api` to; same origin keeps the session cookie and the Origin check (`SITE_URL=http://localhost:5173`). */
const apiOrigin = process.env.API_ORIGIN ?? 'http://localhost:3000';

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { port: 5173, strictPort: true, proxy: { '/api': { target: apiOrigin } } },
  preview: { port: 4173, strictPort: true },
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    include: ['src/**/*.spec.ts'],
    // Vitest returns '' for CSS ids by default; themes.spec reads the theme files with `?raw`.
    css: { include: /\.css\?raw$/ },
    // Greetings and relative dates depend on the local hour.
    env: { TZ: 'UTC' },
    restoreMocks: true,
    unstubGlobals: true,
  },
});
