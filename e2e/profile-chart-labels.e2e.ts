import type { Page } from '@playwright/test';
import type { RatingHistoryEntry } from '../src/api/types/users';
import { THEMES } from '../src/theme/registry';
import { applyTheme } from './fixtures/audit';
import { expect, test } from './fixtures/api';
import { ok } from './fixtures/reply';

const WIDTHS = [1440, 1024, 768, 390];
const CONTESTS = 60;
const DAY_MS = 86_400_000;

/** A long, jagged history: 60 contests between 800 and 3000, with swings that put points close together. */
const longHistory = (): RatingHistoryEntry[] =>
  Array.from({ length: CONTESTS }, (_unused, index) => ({
    contestKey: `r${index}`,
    contestName: `Round ${index}`,
    endTime: new Date(Date.UTC(2023, 0, 1) + index * 14 * DAY_MS).toISOString(),
    rating: Math.round(
      1900 + 1100 * Math.sin(index / 3) * (index % 7 === 0 ? -1 : 1) * Math.min(1, index / 10),
    ),
    rank: index + 1,
    performance: 2000,
  }));

/** Page-space boxes of every text drawn in the two SVGs of the overview. */
const textBoxes = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('[data-testid="rating-card"] svg, svg[aria-label]')].flatMap(
      (svg) => {
        const frame = svg.getBoundingClientRect();
        return [...svg.querySelectorAll('text')].map((text) => {
          const box = text.getBoundingClientRect();
          return {
            text: text.textContent?.trim() ?? '',
            left: box.left,
            right: box.right,
            top: box.top,
            bottom: box.bottom,
            inside:
              box.left >= frame.left - 0.5 &&
              box.right <= frame.right + 0.5 &&
              box.top >= frame.top - 0.5 &&
              box.bottom <= frame.bottom + 0.5,
          };
        });
      },
    ),
  );

for (const theme of THEMES)
  for (const width of WIDTHS)
    test(`no two labels of the rating chart or the heatmap overlap, and none is cut, in ${theme.id} at ${width} px`, async ({
      page,
      api,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await applyTheme(page, api, theme);
      api.signedIn = true;
      api.routes['GET /users/user_01/ratings'] = ok(longHistory());
      await page.goto('/users/user_01');
      await expect(page.getByTestId('rating-card').locator('svg')).toBeVisible();
      const boxes = await textBoxes(page);
      expect(boxes.length).toBeGreaterThan(10);
      expect(boxes.filter((box) => !box.inside).map((box) => box.text)).toEqual([]);
      const overlaps = boxes.flatMap((first, index) =>
        boxes
          .slice(index + 1)
          .filter(
            (second) =>
              first.left < second.right - 0.5 &&
              second.left < first.right - 0.5 &&
              first.top < second.bottom - 0.5 &&
              second.top < first.bottom - 0.5,
          )
          .map((second) => `${first.text} x ${second.text}`),
      );
      expect(overlaps).toEqual([]);
    });
