import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './fixtures/api';

const THEMES = [
  { id: 'glass-dark', scheme: 'dark' },
  { id: 'glass-light', scheme: 'light' },
] as const;
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
  { path: '/login', ready: { anonymous: 'Đăng nhập' } },
  { path: '/blog', ready: { anonymous: 'Blog', 'signed-in': 'Blog' } },
] as const;

for (const theme of THEMES)
  for (const { path, ready } of PAGES)
    for (const [viewer, readyText] of Object.entries(ready))
      test(`${path} has no WCAG 2.1 A/AA violations in ${theme.id}, ${viewer}`, async ({
        page,
        api,
      }) => {
        api.signedIn = viewer === 'signed-in';
        await page.emulateMedia({ colorScheme: theme.scheme });
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
