import { defineConfig, devices } from '@playwright/test';

/** Not vite's default 4173, which a developer's own `vite preview` may hold. */
const PORT = 4310;
const ORIGIN = `http://127.0.0.1:${PORT}`;
/** Set to a running backend's origin to add the opt-in `real-backend` project (`e2e-real/`). */
const REAL_API = process.env.E2E_REAL_API;

export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: ORIGIN, trace: 'retain-on-failure', reducedMotion: 'reduce' },
  /** Builds `dist/` and previews it; the only build step, so CI does not build twice. */
  webServer: {
    command: `npm run build && npx vite preview --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: ORIGIN,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    // `vite preview` proxies `/api` to it, as the dev server does.
    env: REAL_API ? { API_ORIGIN: REAL_API } : {},
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    ...(REAL_API
      ? [
          {
            name: 'real-backend',
            testDir: 'e2e-real',
            testMatch: '**/*.real.ts',
            // One real server, one real user: no parallel runs, no retry that would submit twice.
            fullyParallel: false,
            retries: 0,
            use: { ...devices['Desktop Chrome'] },
          },
        ]
      : []),
  ],
});
