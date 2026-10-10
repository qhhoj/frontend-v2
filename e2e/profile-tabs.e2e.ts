import AxeBuilder from '@axe-core/playwright';
import { profile, sessionResponse, sessionUser } from '../src/test/fixtures';
import { THEMES } from '../src/theme/registry';
import { expect, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';

/** Each tab, the text that shows once its data is in (exact), and the viewer it needs. */
const TABS = [
  { path: '/users/user_01/solved', ready: 'Cái túi', signedIn: false },
  { path: '/users/user_01/pp', ready: 'Bài 1', signedIn: false },
  {
    path: '/users/user_01/blog',
    ready: 'Hướng dẫn chi tiết: Quy hoạch động trên cây cho người mới',
    signedIn: false,
  },
  { path: '/users/user_01/comments', ready: 'Chưa có bình luận nào.', signedIn: true },
] as const;
const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'phone 375 px', width: 375, height: 812 },
] as const;

/** A signed-in viewer who holds the right to list other users' comments. */
const grantCommentRight = (api: FakeApi) => {
  api.signedIn = true;
  api.routes['GET /auth/me'] = {
    body: {
      data: sessionResponse({
        user: sessionUser({ permissions: ['judge.view_all_user_comment'] }),
      }),
    },
  };
};

for (const viewport of VIEWPORTS)
  for (const theme of THEMES)
    for (const tab of TABS)
      test(`${tab.path} has no WCAG 2.1 A/AA violations and no page scroll in ${theme.id}, ${viewport.name}`, async ({
        page,
        api,
      }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        if (tab.signedIn) grantCommentRight(api);
        api.routes['GET /profile'] = { body: { data: profile({ siteTheme: theme.id }) } };
        await page.emulateMedia({ colorScheme: theme.scheme });
        await page.addInitScript((id) => localStorage.setItem('qhhoj.theme', id), theme.id);
        await page.goto(tab.path);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme.id);
        await expect(
          page.getByText(tab.ready, { exact: true }).filter({ visible: true }).first(),
        ).toBeVisible();
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow).toBeLessThanOrEqual(0);
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
