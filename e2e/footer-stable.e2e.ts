import { expect, test } from './fixtures/api';

const PAGES = ['/problems', '/contests', '/blog', '/users', '/organizations'];
const WIDTHS = [1280, 390];
/** A footer whose box started this close to the top sat right under the header, before any page content existed. */
const UNDER_HEADER_PX = 200;

interface ShiftSource {
  node: Element | null;
  previousRect: DOMRectReadOnly;
}
interface ShiftEntry {
  hadRecentInput: boolean;
  sources?: ShiftSource[];
}

/** While the route loads the footer is not drawn under the header and then pushed down. Data-driven height changes are the skeleton tests' business. */
for (const width of WIDTHS)
  for (const path of PAGES)
    test(`the footer does not jump from under the header on ${path} at ${width} px`, async ({
      page,
      api,
    }) => {
      api.signedIn = true;
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript((limit) => {
        const jumps: string[] = [];
        (window as unknown as { footerJumps: string[] }).footerJumps = jumps;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as unknown as ShiftEntry[])
            for (const source of entry.sources ?? [])
              if (!entry.hadRecentInput && source.node?.closest?.('footer'))
                if (source.previousRect.height > 0 && source.previousRect.top < limit)
                  jumps.push('footer');
        }).observe({ type: 'layout-shift', buffered: true });
      }, UNDER_HEADER_PX);
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      const jumps = await page.evaluate(
        () => (window as unknown as { footerJumps: string[] }).footerJumps,
      );
      expect(jumps).toEqual([]);
    });
