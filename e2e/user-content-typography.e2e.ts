import type { Page } from '@playwright/test';
import { postDetail } from '../src/test/community-fixtures';
import { problemDetail } from '../src/test/fixtures';
import { expect, test } from './fixtures/api';
import { ok } from './fixtures/reply';

/** The shapes the backend's Markdown renderer emits (headers shifted by two, tables wrapped). */
const RENDERED = [
  '<p>Mở đầu với <a href="https://example.org">liên kết</a> và <code>x</code>.</p>',
  '<p>Đoạn thứ hai.</p>',
  '<h4>Input</h4>',
  '<ul><li>một</li><li>hai</li></ul>',
  '<ol><li>một</li></ol>',
  '<div class="h-scrollable-table"><table class="table"><thead><tr><th>n</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table></div>',
  '<blockquote><p>trích</p></blockquote>',
  '<p><span class="katex"><span class="katex-mathml"><math><mi>n</mi></math></span><span class="katex-html" aria-hidden="true">n</span></span></p>',
].join('\n');

const px = (value: string) => Number.parseFloat(value);
/** A computed CSS property (kebab-case name) of the first match. */
const styleOf = (page: Page, selector: string, property: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((element, name) => getComputedStyle(element).getPropertyValue(name), property);

/** Rendered Markdown keeps the structure readers expect, whatever the CSS reset removed, and formulas show once. */
const expectTypography = async (page: Page, root: string) => {
  expect(px(await styleOf(page, `${root} p + p`, 'margin-top'))).toBeGreaterThan(0);
  expect(await styleOf(page, `${root} ul`, 'list-style-type')).toBe('disc');
  expect(await styleOf(page, `${root} ol`, 'list-style-type')).toBe('decimal');
  expect(px(await styleOf(page, `${root} ul`, 'padding-left'))).toBeGreaterThan(0);
  expect(px(await styleOf(page, `${root} h4`, 'font-size'))).toBeGreaterThan(
    px(await styleOf(page, `${root} p`, 'font-size')),
  );
  expect(await styleOf(page, `${root} a`, 'text-decoration-line')).toBe('underline');
  expect(await styleOf(page, `${root} a`, 'color')).not.toBe(
    await styleOf(page, `${root} p`, 'color'),
  );
  expect(await styleOf(page, `${root} p code`, 'background-color')).not.toBe('rgba(0, 0, 0, 0)');
  expect(px(await styleOf(page, `${root} td`, 'border-top-width'))).toBeGreaterThan(0);
  expect(px(await styleOf(page, `${root} blockquote`, 'border-left-width'))).toBeGreaterThan(0);
  // KaTeX's stylesheet hides the MathML copy; without it every formula shows twice.
  expect(await styleOf(page, `${root} .katex-mathml`, 'position')).toBe('absolute');
};

test('a problem statement shows paragraphs, headings, lists, links, code and tables', async ({
  page,
  api,
}) => {
  api.routes['GET /problems/:code'] = ok(problemDetail({ descriptionHtml: RENDERED }));
  await page.goto('/problems/duongdi');
  await expect(page.locator('.statement h4')).toBeVisible();
  await expectTypography(page, '.statement');
});

test('a blog post shows paragraphs, headings, lists, links, code and tables', async ({
  page,
  api,
}) => {
  api.routes['GET /posts/post-1'] = ok(postDetail({ id: 'post-1', contentHtml: RENDERED }));
  await page.goto('/blog/post-1');
  await expect(page.locator('article .user-content h4')).toBeVisible();
  await expectTypography(page, 'article .user-content');
});
