import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './fixtures/api';

const THEMES = [
  { id: 'glass-dark', scheme: 'dark' },
  { id: 'glass-light', scheme: 'light' },
] as const;
/** `ready` is a heading that only exists once the page has left its loading state, so axe never audits skeletons. */
const PAGES = [
  { path: '/', ready: 'Tổng hai số', viewers: ['anonymous', 'signed-in'] },
  { path: '/problems', ready: 'Chọn bài, bắt đầu giải', viewers: ['anonymous', 'signed-in'] },
  {
    path: '/contests/r42/ranking',
    ready: 'QHH Round #42 (Div. 2)',
    viewers: ['anonymous', 'signed-in'],
  },
  { path: '/login', ready: 'Đăng nhập', viewers: ['anonymous'] },
  { path: '/blog', ready: 'Blog', viewers: ['anonymous', 'signed-in'] },
] as const;

for (const theme of THEMES)
  for (const { path, ready, viewers } of PAGES)
    for (const viewer of viewers)
      test(`${path} has no WCAG 2.1 A/AA violations in ${theme.id}, ${viewer}`, async ({
        page,
        api,
      }) => {
        api.signedIn = viewer === 'signed-in';
        await page.emulateMedia({ colorScheme: theme.scheme });
        await page.goto(path);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme.id);
        await page.waitForLoadState('networkidle');
        if (path !== '/' || api.signedIn)
          await expect(page.getByText(ready, { exact: true }).first()).toBeVisible();
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
