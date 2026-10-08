import AxeBuilder from '@axe-core/playwright';
import { profile } from '../src/test/fixtures';
import { THEMES } from '../src/theme/registry';
import { expect, test } from './fixtures/api';

/**
 * `ready` is text that only shows once the page has left its loading state, so axe never audits skeletons.
 * Keys are the viewers the page is audited for.
 */
const PAGES = [
  {
    path: '/',
    ready: { anonymous: 'Luyện thuật toán, thi đấu trực tuyến', 'signed-in': 'Tổng hai số' },
  },
  {
    path: '/problems',
    ready: { anonymous: 'Chọn bài, bắt đầu giải', 'signed-in': 'Chọn bài, bắt đầu giải' },
  },
  {
    path: '/contests/r42/ranking',
    ready: { anonymous: 'QHH Round #42 (Div. 2)', 'signed-in': 'QHH Round #42 (Div. 2)' },
  },
  {
    path: '/problems/duongdi',
    ready: { anonymous: 'Thời gian', 'signed-in': 'Thời gian' },
  },
  {
    path: '/submissions',
    ready: { anonymous: 'Tổng hai số', 'signed-in': 'Tổng hai số' },
  },
  { path: '/submissions/sub-1', ready: { 'signed-in': 'Kết quả từng test' } },
  { path: '/login', ready: { anonymous: 'Đăng nhập' } },
  { path: '/blog', ready: { anonymous: 'Blog', 'signed-in': 'Blog' } },
  {
    path: '/settings/appearance',
    ready: { anonymous: 'Dùng giao diện riêng', 'signed-in': 'Dùng giao diện riêng' },
  },
] as const;

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'phone 375 px', width: 375, height: 812 },
] as const;

for (const viewport of VIEWPORTS)
  for (const theme of THEMES)
    for (const { path, ready } of PAGES)
      for (const [viewer, readyText] of Object.entries(ready))
        test(`${path} has no WCAG 2.1 A/AA violations in ${theme.id}, ${viewer}, ${viewport.name}`, async ({
          page,
          api,
        }) => {
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          api.signedIn = viewer === 'signed-in';
          // A signed-in account's theme outranks the browser's choice.
          api.routes['GET /profile'] = { body: { data: profile({ siteTheme: theme.id }) } };
          await page.emulateMedia({ colorScheme: theme.scheme });
          // The OS scheme only selects Clay; an explicit browser choice puts every theme on screen.
          await page.addInitScript((id) => localStorage.setItem('qhhoj.theme', id), theme.id);
          await page.goto(path);
          await expect(page.locator('html')).toHaveAttribute('data-theme', theme.id);
          await expect(page.getByText(readyText, { exact: true }).first()).toBeVisible();
          const { violations } = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
            .analyze();
          expect(
            violations.map(
              (violation) =>
                `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`,
            ),
          ).toEqual([]);
        });
