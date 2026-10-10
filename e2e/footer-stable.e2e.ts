import { expect, test } from './fixtures/api';

const PAGES = ['/problems', '/contests', '/blog', '/users', '/organizations'];
const WIDTHS = [1280, 390];

/** The footer sits below the content from the first paint: no layout shift may move it while the route loads. */
for (const width of WIDTHS)
  for (const path of PAGES)
    test(`the footer does not shift on ${path} at ${width} px`, async ({ page, api }) => {
      api.signedIn = true;
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(() => {
        const shifted: string[] = [];
        (window as unknown as { footerShifts: string[] }).footerShifts = shifted;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as unknown as Array<{
            hadRecentInput: boolean;
            sources?: Array<{ node: Element | null }>;
          }>)
            if (
              !entry.hadRecentInput &&
              entry.sources?.some((source) => source.node?.closest?.('footer'))
            )
              shifted.push('footer');
        }).observe({ type: 'layout-shift', buffered: true });
      });
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      const shifts = await page.evaluate(
        () => (window as unknown as { footerShifts: string[] }).footerShifts,
      );
      expect(shifts).toEqual([]);
    });
