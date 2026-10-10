import { expect, test } from './fixtures/api';

const SOURCE = '// solve\nint main() { return 0; }\n';

for (const [theme, scheme] of [
  ['clay-light', 'light'],
  ['clay-dark', 'dark'],
] as const) {
  test(`${theme}: the submission source is coloured and still reads as the exact source`, async ({
    page,
    api,
  }) => {
    api.signedIn = true;
    api.routes['GET /submissions/sub-1/source'] = {
      body: { data: { id: 'sub-1', source: SOURCE } },
    };
    await page.emulateMedia({ colorScheme: scheme });
    await page.addInitScript((id) => localStorage.setItem('qhhoj.theme', id), theme);
    await page.goto('/submissions/sub-1#source');
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    const keyword = page.locator('pre .syn-keyword', { hasText: 'return' });
    await expect(keyword).toBeVisible();
    await expect(page.locator('pre.pr-6')).toHaveText(SOURCE.trimEnd());
    const [keywordColour, plainColour] = await Promise.all([
      keyword.evaluate((el) => getComputedStyle(el).color),
      page.locator('pre.pr-6').evaluate((el) => getComputedStyle(el).color),
    ]);
    expect(keywordColour).not.toBe(plainColour);
  });
}
