import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/** Computed look of a `.glass` element and of the opaque fallback, under whatever the page currently has set. */
export async function readGlass(page: Page) {
  return page.evaluate(() => {
    const probe = document.createElement('div');
    probe.className = 'glass';
    const solid = document.createElement('div');
    solid.style.backgroundColor = 'var(--qh-surface-solid)';
    const site = document.createElement('div');
    site.style.backgroundColor = 'var(--qh-surface)';
    document.body.append(probe, solid, site);
    const result = {
      fill: getComputedStyle(probe).backgroundColor,
      solid: getComputedStyle(solid).backgroundColor,
      siteSurface: getComputedStyle(site).backgroundColor,
      blur: getComputedStyle(probe).backdropFilter,
    };
    probe.remove();
    solid.remove();
    site.remove();
    return result;
  });
}

/** Computed colours come back as `rgb()`, `rgba()` or, for a `color-mix()` result, `color(srgb r g b / a)`: read all three as 0-255 channels plus alpha. */
export function channelsOf(colour: string): [number, number, number, number] {
  const srgb = /^color\(srgb ([\d.e-]+) ([\d.e-]+) ([\d.e-]+)(?: \/ ([\d.e-]+))?\)$/.exec(colour);
  if (srgb)
    return [
      Number(srgb[1]) * 255,
      Number(srgb[2]) * 255,
      Number(srgb[3]) * 255,
      Number(srgb[4] ?? 1),
    ];
  const legacy = /^rgba?\(([^)]+)\)$/.exec(colour)?.[1]?.split(',').map(Number);
  if (!legacy) throw new Error(`Unexpected computed colour: ${colour}`);
  return [legacy[0], legacy[1], legacy[2], legacy[3] ?? 1];
}

/** Two computed colours are the same colour whatever their serialisation. */
export function expectSameColour(actual: string, expected: string) {
  const [got, want] = [channelsOf(actual), channelsOf(expected)];
  for (const index of [0, 1, 2]) expect(got[index]).toBeCloseTo(want[index], 0);
  expect(got[3]).toBeCloseTo(want[3], 2); // computed alpha is quantised to 8 bits
}
