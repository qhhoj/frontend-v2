import type { Page, Route } from '@playwright/test';
import { problemDetail } from '../src/test/fixtures';
import { expect, test } from './fixtures/api';
import { openDock } from './fixtures/submit-dock';
import type { FakeApi } from './fixtures/api';

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

/** The statement the fake api serves for `/problems/duongdi`. */
function serveStatement(api: FakeApi, descriptionHtml: string) {
  api.routes['GET /problems/duongdi'] = { body: { data: problemDetail({ descriptionHtml }) } };
}
const requestLog = (page: Page) => {
  const requested: string[] = [];
  page.on('request', (request) => requested.push(request.url()));
  return () => requested.filter((url) => HEAVY_CHUNK.test(url));
};

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

test('a statement whose fences have no parser loads no editor code', async ({ page, api }) => {
  serveStatement(
    api,
    '<pre><code>4 4</code></pre><pre><code class="language-brainfuck">+++</code></pre>',
  );
  const editorRequests = requestLog(page);
  await page.goto('/problems/duongdi');
  await expect(page.locator('.statement pre code.language-brainfuck')).toBeVisible();
  await page.waitForLoadState('networkidle');
  expect(editorRequests()).toEqual([]);
});

test('a fenced block of a known language is coloured in place: the editor loads on demand and nothing moves', async ({
  page,
  api,
}) => {
  serveStatement(
    api,
    '<p>Cho n.</p><pre><code class="language-cpp">int main() { return 0; }</code></pre>',
  );
  const editorRequests = requestLog(page);
  const held: Route[] = [];
  let released = false;
  await page.route(HEAVY_CHUNK, (route) => (released ? route.continue() : void held.push(route)));
  await page.goto('/problems/duongdi');
  const block = page.locator('.statement pre', { has: page.locator('code.language-cpp') });
  const statement = page.locator('.statement');
  await expect(block).toBeVisible();
  await expect.poll(() => held.length).toBeGreaterThan(0); // the editor is wanted, and is still on its way
  const plain = { block: await block.boundingBox(), statement: await statement.boundingBox() };
  await expect(block.locator('.syn-keyword')).toHaveCount(0);

  released = true;
  await Promise.all(held.map((route) => route.continue()));
  await expect(block.locator('.syn-keyword').first()).toHaveText('return');
  expect(await block.boundingBox()).toEqual(plain.block);
  expect(await statement.boundingBox()).toEqual(plain.statement);
  await expect(block.locator('code')).toHaveText('int main() { return 0; }');
  const chunks = editorRequests();
  expect(chunks.some((url) => url.includes('code-editor-core'))).toBe(true);
  expect(chunks.some((url) => url.includes('code-lang-cpp'))).toBe(true);
  expect(chunks.filter((url) => url.includes('code-lang-python'))).toEqual([]);
});

test('the dock loads the editor and only the pack of its language', async ({ page, api }) => {
  api.signedIn = true;
  const requested: string[] = [];
  page.on('request', (request) => requested.push(request.url()));
  await page.goto('/problems/duongdi');
  await openDock(page);
  await expect(page.locator('.cm-content').first()).toBeVisible();
  const chunks = requested.filter((url) => HEAVY_CHUNK.test(url));
  expect(chunks.some((url) => url.includes('code-editor-cm'))).toBe(true);
  expect(chunks.some((url) => url.includes('code-editor-core'))).toBe(true);
  expect(chunks.some((url) => url.includes('code-lang-cpp'))).toBe(true);
  expect(chunks.filter((url) => url.includes('code-lang-python'))).toEqual([]);
});
