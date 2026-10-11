import AxeBuilder from '@axe-core/playwright';
import { profile } from '../src/test/fixtures';
import { CONTEST_FIXTURE_NOW, expect, test } from './fixtures/api';
import { AUDIT_THEMES, AUDIT_VIEWPORTS, FULL_AUDIT } from './fixtures/audit';

/**
 * `ready` is text that only shows once the page has left its loading state, so axe never audits skeletons.
 * Keys are the viewers the page is audited for.
 */
const PAGES = [
  {
    path: '/',
    ready: {
      anonymous: 'Quốc Học Huế Online Judge',
      'signed-in': 'Tổng hai số',
    },
  },
  {
    path: '/problems',
    ready: { anonymous: 'Bài tập', 'signed-in': 'Bài tập' },
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
  {
    path: '/contests',
    ready: { anonymous: 'QHH Round #42 (Div. 2)', 'signed-in': 'QHH Round #42 (Div. 2)' },
  },
  {
    path: '/contests/r42',
    ready: { anonymous: 'QHH Round #42 (Div. 2)', 'signed-in': 'QHH Round #42 (Div. 2)' },
  },
  {
    path: '/contests/r42/announcements',
    ready: { anonymous: 'Thông báo 1', 'signed-in': 'Thông báo 1' },
  },
  {
    path: '/contests/r42/submissions',
    ready: {
      anonymous: 'Đăng nhập để xem bài nộp của bạn',
      'signed-in': 'Chỉ hiện bài nộp của bạn',
    },
  },
  {
    path: '/contests/r42/stats',
    ready: { anonymous: 'QHH Round #42 (Div. 2)', 'signed-in': 'QHH Round #42 (Div. 2)' },
  },
] as const;

/** Desktop only on the local gate; every viewport on a full run (`E2E_FULL=1`). */
const VIEWPORTS = FULL_AUDIT ? AUDIT_VIEWPORTS : AUDIT_VIEWPORTS.slice(0, 1);

for (const viewport of VIEWPORTS)
  for (const theme of AUDIT_THEMES)
    for (const { path, ready } of PAGES)
      // One viewer per page: signed-in where it differs, since anonymous shares the markup.
      for (const [viewer, readyText] of Object.entries(ready).slice(-1))
        test(`${path} has no WCAG 2.1 A/AA violations in ${theme.id}, ${viewer}, ${viewport.name}`, async ({
          page,
          api,
        }) => {
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          api.signedIn = viewer === 'signed-in';
          if (path.startsWith('/contests')) await page.clock.setFixedTime(CONTEST_FIXTURE_NOW);
          // A signed-in account's theme outranks the browser's choice.
          api.routes['GET /profile'] = { body: { data: profile({ siteTheme: theme.id }) } };
          await page.emulateMedia({ colorScheme: theme.scheme });
          // The OS scheme only selects Clay; an explicit browser choice puts every theme on screen.
          await page.addInitScript((id) => localStorage.setItem('qhhoj.theme', id), theme.id);
          await page.goto(path);
          await expect(page.locator('html')).toHaveAttribute('data-theme', theme.id);
          await expect(
            page.getByText(readyText, { exact: true }).filter({ visible: true }).first(),
          ).toBeVisible();
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
