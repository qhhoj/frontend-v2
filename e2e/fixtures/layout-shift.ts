import type { Locator, Page } from '@playwright/test';
import type { FakeApi } from './api';
import { expect, test } from './api';

/** Parts of a screen measured while its skeleton shows and again once the data is in; a part is the span of every element its locator matches. */
export interface ShiftCase {
  name: string;
  path: string;
  signedIn: boolean;
  /** The request the skeleton waits on. */
  hold: string;
  /** Data that fills the skeleton's rows exactly, so the loaded height is comparable. */
  answer?: (api: FakeApi) => void;
  parts: (page: Page, width: number) => Record<string, Locator>;
  viewports: number[];
  /** Parts whose height is not compared (a text block differs in length), only where they sit. */
  placedOnly?: string[];
  /** Parts whose distance from the first part's top is compared as well; a taller or shorter part above moves them. */
  placed?: string[];
  /** Pins the page clock, for screens whose layout depends on the time (a contest's phase). */
  clockAt?: Date;
}
export const PHONE = 375;
export const DESKTOP = 1280;
export const PHONE_AND_DESKTOP = [PHONE, DESKTOP];
const SHIFT_TOLERANCE_PX = 2;

const spanOf = (locator: Locator) =>
  locator.evaluateAll((elements) => {
    const rects = elements.map((element) => element.getBoundingClientRect());
    const top = Math.min(...rects.map((rect) => rect.top));
    return { top, height: Math.max(...rects.map((rect) => rect.bottom)) - top };
  });
/** Every part's height, and for the `placed` ones the distance of their top from the first part's top. */
const layoutOf = async (
  parts: Record<string, Locator>,
  placed: string[] = [],
  placedOnly: string[] = [],
) => {
  const spans = Object.fromEntries(
    await Promise.all(
      Object.entries(parts).map(async ([part, locator]) => [part, await spanOf(locator)] as const),
    ),
  );
  const firstTop = Object.values(spans)[0].top;
  return {
    ...Object.fromEntries(
      Object.entries(spans)
        .filter(([part]) => !placedOnly.includes(part))
        .map(([part, span]) => [`${part} height`, span.height]),
    ),
    ...Object.fromEntries(placed.map((part) => [`${part} offset`, spans[part].top - firstTop])),
  };
};

/** One layout-shift test per case and width: the parts keep their size and place when the data arrives. */
export function defineShiftTests(cases: ShiftCase[]) {
  for (const shift of cases)
    for (const width of shift.viewports)
      test(`the ${shift.name} keeps its size when its data arrives, at ${width} px`, async ({
        page,
        api,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        api.signedIn = shift.signedIn;
        if (shift.clockAt) await page.clock.setFixedTime(shift.clockAt);
        shift.answer?.(api);
        const release = api.hold(shift.hold);
        await page.goto(shift.path);
        const parts = shift.parts(page, width);
        for (const [part, locator] of Object.entries(parts))
          await expect(locator.first(), `${part} skeleton`).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        const skeleton = await layoutOf(parts, shift.placed, shift.placedOnly);
        release();
        await expect(page.locator('[data-skeleton]')).toHaveCount(0);
        await page.evaluate(() => document.fonts.ready);
        /** Per measure the change in px once loaded; 0 stands for "within the tolerance". */
        const changes = async () =>
          Object.fromEntries(
            Object.entries(await layoutOf(parts, shift.placed, shift.placedOnly)).map(
              ([measure, value]) => {
                const change = value - skeleton[measure];
                return [measure, Math.abs(change) <= SHIFT_TOLERANCE_PX ? 0 : change];
              },
            ),
          );
        await expect
          .poll(changes, { message: 'change in px per measure, skeleton to loaded' })
          .toEqual(Object.fromEntries(Object.keys(skeleton).map((measure) => [measure, 0])));
      });
}
