import { expect, test } from './fixtures/api';

const VIEWPORTS = [
  { width: 1280, height: 720 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
  { width: 375, height: 812 },
];

for (const viewport of VIEWPORTS)
  test(`the background blobs stay apart at ${viewport.width}x${viewport.height}`, async ({
    page,
    api,
  }) => {
    void api;
    await page.setViewportSize(viewport);
    await page.goto('/blog');
    const boxes = await page.evaluate(() =>
      [...document.querySelectorAll('[class*="blob-"]')]
        .map((blob) => blob.getBoundingClientRect())
        .filter((rect) => rect.width > 0)
        .map(({ left, right, top, bottom }) => ({ left, right, top, bottom })),
    );
    expect(boxes.length, 'at least the two always-on blobs are laid out').toBeGreaterThanOrEqual(2);
    const overlaps = boxes.flatMap((first, index) =>
      boxes
        .slice(index + 1)
        .filter(
          (second) =>
            first.left < second.right &&
            second.left < first.right &&
            first.top < second.bottom &&
            second.top < first.bottom,
        )
        .map(() => `blob ${index} overlaps a later one`),
    );
    expect(overlaps).toEqual([]);
  });
