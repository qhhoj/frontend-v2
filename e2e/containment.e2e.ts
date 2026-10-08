import type { Page } from '@playwright/test';
import { expect, test } from './fixtures/api';

const BOX = { left: 200, top: 300, width: 400, height: 150 };
const LONG_LINE = 'x'.repeat(400);
const HOSTILE_HTML = `
  <p>safe text</p>
  <div data-hostile style="position:absolute;left:99999px;top:0;width:60px;height:60px;background:red">far right</div>
  <div data-hostile style="position:absolute;left:-99999px;top:0;width:60px;height:60px;background:red">far left</div>
  <div data-hostile style="position:absolute;top:99999px;left:0;width:60px;height:60px;background:red">far below</div>
  <div data-hostile style="margin:0 0 0 -5000px;width:5400px;height:20px;background:red">negative margin</div>
  <div data-hostile style="position:fixed;inset:0;z-index:2147483647;background:red">fixed overlay</div>
  <pre data-wide>${LONG_LINE}</pre>
  <table data-wide><tr><td nowrap>${LONG_LINE}</td></tr></table>`;

/** The `user-content` class is what UserContent.vue puts on its element; no route renders user HTML yet, so the box is mounted by hand. */
async function mountUserContent(page: Page) {
  await page.goto('/blog');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.evaluate(
    ({ box, html }) => {
      const element = document.createElement('div');
      element.className = 'user-content';
      element.id = 'probe';
      Object.assign(element.style, {
        position: 'absolute',
        zIndex: '10',
        left: `${box.left}px`,
        top: `${box.top}px`,
        width: `${box.width}px`,
        height: `${box.height}px`,
      });
      element.innerHTML = html;
      document.body.append(element);
    },
    { box: BOX, html: HOSTILE_HTML },
  );
}

test('hostile markup paints nothing outside the user-content box', async ({ page, api }) => {
  void api;
  await page.setViewportSize({ width: 1000, height: 700 });
  await mountUserContent(page);
  const survey = await page.evaluate((box) => {
    const hostileAt = (pointX: number, pointY: number) =>
      document
        .elementsFromPoint(pointX, pointY)
        .filter((element) => element.hasAttribute('data-hostile'));
    const outside = [
      [box.left - 10, box.top + 20],
      [box.left + box.width + 10, box.top + 20],
      [box.left + 20, box.top - 10],
      [box.left + 20, box.top + box.height + 10],
      [20, 20],
      [980, 680],
      [box.left - 150, box.top + box.height / 2],
    ] as const;
    return {
      leaks: outside.flatMap(([pointX, pointY]) =>
        hostileAt(pointX, pointY).map((element) => `${element.textContent} at ${pointX},${pointY}`),
      ),
      outsideTopmostInsideBox: outside.filter(([pointX, pointY]) =>
        document.elementFromPoint(pointX, pointY)?.closest('#probe'),
      ),
      insideHitsBox: Boolean(
        document.elementFromPoint(box.left + 20, box.top + 20)?.closest('#probe'),
      ),
      pageScrollWidth: document.documentElement.scrollWidth,
      pageScrollHeight: document.documentElement.scrollHeight,
      innerHeight: window.innerHeight,
    };
  }, BOX);
  expect(survey.leaks).toEqual([]);
  expect(survey.outsideTopmostInsideBox).toEqual([]);
  expect(survey.insideHitsBox, 'the box itself is hit-testable').toBe(true);
  expect(survey.pageScrollWidth).toBeLessThanOrEqual(1000);
  expect(survey.pageScrollHeight).toBeLessThanOrEqual(survey.innerHeight + 1);
});

test('a fixed element inside the box covers the box, not the viewport', async ({ page, api }) => {
  void api;
  await mountUserContent(page);
  const box = await page.locator('#probe').boundingBox();
  const fixedOverlay = page.locator('#probe [style*="position:fixed"]');
  const overlayBox = await fixedOverlay.boundingBox();
  expect(overlayBox?.width).toBeLessThanOrEqual(box!.width);
  expect(overlayBox?.height).toBeLessThanOrEqual(box!.height);
});

for (const selector of ['pre', 'table'])
  test(`a wide <${selector}> scrolls inside the box instead of widening it`, async ({
    page,
    api,
  }) => {
    void api;
    await mountUserContent(page);
    const measured = await page.evaluate((tag) => {
      const box = document.querySelector('#probe')!.getBoundingClientRect();
      const wide = document.querySelector<HTMLElement>(`#probe ${tag}[data-wide]`)!;
      const before = wide.getBoundingClientRect();
      wide.scrollLeft = 120;
      return {
        boxRight: box.right,
        wideRight: before.right,
        scrollable: wide.scrollWidth > wide.clientWidth,
        scrolledBy: wide.scrollLeft,
        pageScrollWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
      };
    }, selector);
    expect(measured.scrollable).toBe(true);
    expect(measured.scrolledBy).toBeGreaterThan(0);
    expect(measured.wideRight).toBeLessThanOrEqual(measured.boxRight + 0.5);
    expect(measured.pageScrollWidth).toBeLessThanOrEqual(measured.viewportWidth);
  });
