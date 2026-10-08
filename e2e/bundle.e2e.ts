import { expect, test } from './fixtures/api';

/** The editor and its language packs are lazy chunks (about 25 kB plus 30-100 kB each): a modulepreload would fetch them for every visitor. */
const HEAVY_CHUNK = /\/assets\/(code-editor-cm|code-editor-core|code-lang-[\w-]+)-[\w-]+\.js/;

test('the built page does not preload the editor or a language pack', async ({ page, api }) => {
  void api;
  const html = await (await page.request.get('/')).text();
  expect(html).toContain('modulepreload'); // the check below is about the right links, not about there being none
  const preloadLinks = [...html.matchAll(/<link[^>]*rel="modulepreload"[^>]*>/g)].map(
    ([link]) => link,
  );
  expect(preloadLinks.filter((link) => HEAVY_CHUNK.test(link))).toEqual([]);
});

test('an anonymous problem page loads no editor code', async ({ page, api }) => {
  void api;
  const requested: string[] = [];
  page.on('request', (request) => requested.push(request.url()));
  await page.goto('/problems/duongdi');
  await expect(page.locator('#main h1')).toBeVisible();
  const preloaded = await page.evaluate(() =>
    [...document.querySelectorAll('link[rel="modulepreload"]')].map((link) =>
      link.getAttribute('href'),
    ),
  );
  expect(preloaded.filter((href) => HEAVY_CHUNK.test(href ?? ''))).toEqual([]);
  expect(requested.filter((url) => HEAVY_CHUNK.test(url))).toEqual([]);
});

test('the dock loads the editor and only the pack of its language', async ({ page, api }) => {
  api.signedIn = true;
  const requested: string[] = [];
  page.on('request', (request) => requested.push(request.url()));
  await page.goto('/problems/duongdi');
  await expect(page.locator('.cm-content').first()).toBeVisible();
  const chunks = requested.filter((url) => HEAVY_CHUNK.test(url));
  expect(chunks.some((url) => url.includes('code-editor-cm'))).toBe(true);
  expect(chunks.some((url) => url.includes('code-editor-core'))).toBe(true);
  expect(chunks.some((url) => url.includes('code-lang-cpp'))).toBe(true);
  expect(chunks.filter((url) => url.includes('code-lang-python'))).toEqual([]);
});
