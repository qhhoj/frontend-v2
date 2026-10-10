import { RANKING_PROBLEM_IDS, ranking, rankingRow } from '../src/test/fixtures';
import { expect, test } from './fixtures/api';

const [PROBLEM_A] = RANKING_PROBLEM_IDS;
const LONG_NAME = 'tranduckhoabachuserver_with_a_very_long_name';
const WIDTHS = [1280, 1440, 1920, 390];

for (const width of WIDTHS)
  test(`the first-place Bit does not overlap the first-place entry's text at ${width} px`, async ({
    page,
    api,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    api.routes['GET /contests/r42/ranking'] = {
      body: {
        data: ranking({
          rows: [
            rankingRow(1, 'part-1', LONG_NAME, 1, 10, {
              [PROBLEM_A]: { time: 60, points: 1, tries: 1 },
            }),
          ],
        }),
      },
    };
    await page.goto('/contests/r42/ranking');
    const bit = page.getByTestId('podium-bit');
    await expect(bit).toBeVisible();
    const card = bit.locator('xpath=..');
    const boxes = await card.evaluate((element) => {
      const rect = (target: Element) => target.getBoundingClientRect().toJSON();
      const bitBox = rect(element.querySelector('[data-testid="podium-bit"]')!);
      const content = [...element.children].filter((child) => !child.matches('[data-testid]'));
      const textBoxes = content.flatMap((child) =>
        child.querySelectorAll('a, p, span').length
          ? [...child.querySelectorAll('a, p')].map(rect)
          : [rect(child)],
      );
      return { bitBox, textBoxes };
    });
    expect(boxes.textBoxes.length).toBeGreaterThan(0);
    for (const text of boxes.textBoxes) {
      const overlaps = text.left < boxes.bitBox.right && text.right > boxes.bitBox.left;
      expect(
        overlaps,
        `text box ${JSON.stringify(text)} vs Bit ${JSON.stringify(boxes.bitBox)}`,
      ).toBe(false);
    }
  });
