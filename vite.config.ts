import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

/** The api the dev server proxies `/api` to; same origin keeps the session cookie and the Origin check (`SITE_URL=http://localhost:5173`). */
const apiOrigin = process.env.API_ORIGIN ?? 'http://localhost:3000';

/** A language pack's chunk is named after its package (`code-lang-python`), not the bundler's `dist-<hash>`; the other chunks keep the default. */
function chunkFileName(chunk: { moduleIds: string[] }) {
  const pack = chunk.moduleIds
    .map((id) => /@codemirror\/lang-([a-z]+)\//.exec(id)?.[1])
    .find(Boolean);
  return pack ? `assets/code-lang-${pack}-[hash].js` : 'assets/[name]-[hash].js';
}

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: { rollupOptions: { output: { chunkFileNames: chunkFileName } } },
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
