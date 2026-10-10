import { expect, test } from '@playwright/test';

test('declares the site icon and serves every declared file', async ({ page, request }) => {
  await page.goto('/');
  const hrefs = await page
    .locator('link[rel="icon"], link[rel="apple-touch-icon"]')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href')));
  // Versioned: browsers that cached the old site's icon (served with `expires max`) fetch the new one.
  expect(hrefs).toEqual(['/favicon.svg?v=2', '/favicon.ico?v=2', '/apple-touch-icon.png?v=2']);
  for (const href of hrefs) {
    const response = await request.get(href!);
    expect(response.status(), href!).toBe(200);
    expect((await response.body()).length, href!).toBeGreaterThan(100);
  }
});
