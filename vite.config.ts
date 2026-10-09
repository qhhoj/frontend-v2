import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

/** The api the dev server proxies `/api` to; same origin keeps the session cookie and the Origin check (`SITE_URL=http://localhost:5173`). */
const apiOrigin = process.env.API_ORIGIN ?? 'http://localhost:3000';

/**
 * The editor's chunks are named for what they are (`code-lang-python`, `code-editor-core`), not the bundler's
 * `dist-<hash>`, so a network tab tells them apart; the other chunks keep the default. All stay lazy.
 */
function chunkFileName(chunk: { moduleIds: string[] }) {
  const pack = chunk.moduleIds
    .map((id) => /@codemirror\/lang-([a-z]+)\//.exec(id)?.[1])
    .find(Boolean);
  if (pack) return `assets/code-lang-${pack}-[hash].js`;
  const isEditorCore = chunk.moduleIds.some((id) =>
    /@codemirror\/(?:state|view|language)\//.test(id),
  );
  return isEditorCore ? 'assets/code-editor-core-[hash].js' : 'assets/[name]-[hash].js';
}

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: { rollupOptions: { output: { chunkFileNames: chunkFileName } } },
  server: { port: 5173, strictPort: true, proxy: { '/api': { target: apiOrigin } } },
  preview: { port: 4173, strictPort: true, proxy: { '/api': { target: apiOrigin } } },
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    include: ['src/**/*.spec.ts', 'scripts/**/*.spec.ts'],
    // Vitest returns '' for CSS ids by default; themes.spec reads the theme files with `?raw`.
    css: { include: /\.css\?raw$/ },
    // Greetings and relative dates depend on the local hour.
    env: { TZ: 'UTC' },
    restoreMocks: true,
    unstubGlobals: true,
  },
});
