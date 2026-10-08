import { postDetail } from '../src/test/community-fixtures';
import { THEMES } from '../src/theme/registry';
import { AUDIT_VIEWPORTS, applyTheme, expectNoAxeViolations } from './fixtures/audit';
import { expect, test } from './fixtures/api';
import { defineShiftTests, PHONE, PHONE_AND_DESKTOP } from './fixtures/layout-shift';
import { ok } from './fixtures/reply';

const POST_ID = 'post-1';
const WIDE_BODY = [
  '<h2>1. Bài toán mở đầu</h2>',
  '<p>Cho cây n đỉnh.</p>',
  `<pre>${'x'.repeat(300)}</pre>`,
  `<table><tr><td>${'y'.repeat(300)}</td><td>z</td></tr></table>`,
].join('');

test('a wide pre and a wide table stay inside the article on a phone, with no page scroll', async ({
  page,
  api,
}) => {
  await page.setViewportSize({ width: PHONE, height: 812 });
  api.routes[`GET /posts/${POST_ID}`] = ok(postDetail({ id: POST_ID, contentHtml: WIDE_BODY }));
  await page.goto(`/blog/${POST_ID}`);
  await expect(page.getByRole('heading', { level: 1, name: postDetail().title })).toBeVisible();
  const noPageScroll = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  );
  expect(noPageScroll).toBe(true);
  const box = await page.locator('article').first().boundingBox();
  expect(box!.x + box!.width).toBeLessThanOrEqual(PHONE);
});

for (const theme of THEMES)
  for (const viewport of AUDIT_VIEWPORTS)
    for (const signedIn of [false, true])
      test(`/blog/:id has no WCAG 2.1 A/AA violations in ${theme.id}, ${signedIn ? 'signed-in' : 'anonymous'}, ${viewport.name}`, async ({
        page,
        api,
      }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        api.signedIn = signedIn;
        await applyTheme(page, api, theme);
        await page.goto(`/blog/${postDetail().id}`);
        await expect(
          page.getByRole('heading', { level: 1, name: postDetail().title }),
        ).toBeVisible();
        await expectNoAxeViolations(page);
      });

defineShiftTests([
  {
    name: 'blog post article',
    path: `/blog/${POST_ID}`,
    signedIn: false,
    hold: `GET /posts/${POST_ID}`,
    answer: (api) => {
      api.routes[`GET /posts/${POST_ID}`] = ok(postDetail({ id: POST_ID }));
    },
    parts: (page) => ({ 'post article': page.locator('article').first() }),
    viewports: PHONE_AND_DESKTOP,
  },
]);
