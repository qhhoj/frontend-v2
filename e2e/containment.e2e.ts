import type { Page } from '@playwright/test';
import { problemDetail } from '../src/test/fixtures';
import { expect, test } from './fixtures/api';
import type { FakeApi } from './fixtures/api';

const VIEWPORT_WIDTHS = [1000, 375];
/** The hostile element sits 99 999 px down; a contained one adds nothing near that. */
const FAR_BELOW_PX = 10_000;
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

/** The statement of a problem whose author wrote hostile HTML: the real route, the real `.statement` element. */
async function openHostileStatement(page: Page, api: FakeApi, width: number) {
  api.routes['GET /problems/hostile'] = {
    body: { data: problemDetail({ code: 'hostile', descriptionHtml: HOSTILE_HTML }) },
  };
  await page.setViewportSize({ width, height: 700 });
  await page.goto('/problems/hostile');
  await expect(page.locator('.statement')).toContainText('safe text');
}

for (const width of VIEWPORT_WIDTHS) {
  test(`hostile markup paints nothing outside the statement card at ${width} px`, async ({
    page,
    api,
  }) => {
    await openHostileStatement(page, api, width);
    // On a phone the card starts at the bottom edge, under the collapsed sheet bar: bring it up.
    await page
      .getByTestId('statement-card')
      .evaluate((card) => card.scrollIntoView({ block: 'center' }));
    const box = (await page.getByTestId('statement-card').boundingBox())!;
    const survey = await page.evaluate((statementBox) => {
      const { x: left, y: top, width, height } = statementBox;
      // The card may start above or run below the screen (sticky header, phone sheet bar): hit-test its visible middle.
      const visibleMiddle = (Math.max(top, 0) + Math.min(top + height, window.innerHeight)) / 2;
      const hostileAt = (pointX: number, pointY: number) =>
        document
          .elementsFromPoint(pointX, pointY)
          .filter((element) => element.hasAttribute('data-hostile'));
      const outside = [
        [left - 10, top + 20],
        [left + width + 10, top + 20],
        [left + 20, top - 10],
        [left + 20, top + height + 10],
        [20, 20],
        [980, 680],
        [left - 150, top + height / 2],
      ] as const;
      return {
        leaks: outside.flatMap(([pointX, pointY]) =>
          hostileAt(pointX, pointY).map(
            (element) => `${element.textContent} at ${pointX},${pointY}`,
          ),
        ),
        outsideTopmostInsideBox: outside.filter(([pointX, pointY]) =>
          document.elementFromPoint(pointX, pointY)?.closest('[data-testid="statement-card"]'),
        ),
        insideHitsBox: Boolean(
          document
            .elementFromPoint(left + 20, visibleMiddle)
            ?.closest('[data-testid="statement-card"]'),
        ),
        pageScrollWidth: document.documentElement.scrollWidth,
        pageScrollHeight: document.documentElement.scrollHeight,
      };
    }, box);
    expect(survey.leaks).toEqual([]);
    expect(survey.outsideTopmostInsideBox).toEqual([]);
    expect(survey.insideHitsBox, 'the box itself is hit-testable').toBe(true);
    expect(survey.pageScrollWidth).toBeLessThanOrEqual(width);
    expect(survey.pageScrollHeight, 'the far-below element adds no page height').toBeLessThan(
      FAR_BELOW_PX,
    );
  });

  test(`a fixed element inside the statement covers the statement, not the viewport or the header at ${width} px`, async ({
    page,
    api,
  }) => {
    await openHostileStatement(page, api, width);
    const box = (await page.getByTestId('statement-card').boundingBox())!;
    const overlayBox = (await page.locator('.statement [style*="position:fixed"]').boundingBox())!;
    expect(overlayBox.width).toBeLessThanOrEqual(box.width);
    expect(overlayBox.height).toBeLessThanOrEqual(box.height);
    const brand = (await page.getByRole('link', { name: 'QHHOJ' }).first().boundingBox())!;
    const hit = await page.evaluate(
      ({ pointX, pointY }) => document.elementFromPoint(pointX, pointY)?.closest('header') !== null,
      { pointX: brand.x + brand.width / 2, pointY: brand.y + brand.height / 2 },
    );
    expect(hit, 'the header is still the topmost element at the brand').toBe(true);
  });

  for (const selector of ['pre', 'table'])
    test(`a wide <${selector}> scrolls inside the statement instead of widening it at ${width} px`, async ({
      page,
      api,
    }) => {
      await openHostileStatement(page, api, width);
      const measured = await page.evaluate((tag) => {
        const box = document.querySelector('.statement')!.getBoundingClientRect();
        const wide = document.querySelector<HTMLElement>(`.statement ${tag}[data-wide]`)!;
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
}
