import type { VoteScore } from '../src/api/types/votes';
import { postItem } from '../src/test/community-fixtures';
import { THEMES } from '../src/theme/registry';
import { AUDIT_VIEWPORTS, applyTheme, expectNoAxeViolations } from './fixtures/audit';
import { expect, list, test } from './fixtures/api';
import { defineShiftTests, PHONE, PHONE_AND_DESKTOP } from './fixtures/layout-shift';
import { ok } from './fixtures/reply';

const POST_SCORE = 58;

test('a signed-in reader votes up, then a second press takes the vote back', async ({
  page,
  api,
}) => {
  api.signedIn = true;
  let vote: { score: number; viewerVote: VoteScore } = { score: POST_SCORE, viewerVote: 0 };
  api.routes['GET /posts'] = () => list([postItem({ ...vote })]);
  api.routes['PUT /posts/:id/vote'] = ({ body }) => {
    const { score } = body as { score: VoteScore };
    vote = { score: POST_SCORE + score, viewerVote: score };
    return ok(vote);
  };
  await page.goto('/blog');
  const up = page.getByRole('button', { name: 'Bình chọn lên' }).first();
  await up.click();
  await expect(page.getByTestId('vote-score').first()).toHaveText(String(POST_SCORE + 1));
  await expect(up).toHaveAttribute('aria-pressed', 'true');
  await up.click();
  await expect(page.getByTestId('vote-score').first()).toHaveText(String(POST_SCORE));
  await expect(up).toHaveAttribute('aria-pressed', 'false');
});

test('a long title and an unbroken summary stay inside the row on a phone', async ({
  page,
  api,
}) => {
  await page.setViewportSize({ width: PHONE, height: 812 });
  api.routes['GET /posts'] = list([
    postItem({ title: 'x'.repeat(200), summaryHtml: `<p>${'y'.repeat(400)}</p>` }),
  ]);
  await page.goto('/blog');
  const row = page.getByTestId('post-row');
  await expect(row).toBeVisible();
  const noPageScroll = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
  );
  expect(noPageScroll).toBe(true);
  const box = await row.boundingBox();
  expect(box!.x + box!.width).toBeLessThanOrEqual(PHONE);
});

for (const theme of THEMES)
  for (const viewport of AUDIT_VIEWPORTS)
    for (const signedIn of [false, true])
      test(`/blog has no WCAG 2.1 A/AA violations in ${theme.id}, ${signedIn ? 'signed-in' : 'anonymous'}, ${viewport.name}`, async ({
        page,
        api,
      }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        api.signedIn = signedIn;
        await applyTheme(page, api, theme);
        await page.goto('/blog');
        await expect(page.getByTestId('post-row').first()).toBeVisible();
        await expectNoAxeViolations(page);
      });

defineShiftTests([
  {
    name: 'post list',
    path: '/blog',
    signedIn: false,
    hold: 'GET /posts',
    answer: (api) =>
      (api.routes['GET /posts'] = list(
        Array.from({ length: 6 }, (_post, index) => postItem({ id: `post-${index}` })),
      )),
    parts: (page) => ({ 'post list': page.getByTestId('post-list') }),
    viewports: PHONE_AND_DESKTOP,
  },
]);
