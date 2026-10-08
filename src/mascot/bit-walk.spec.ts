import { describe, expect, it } from 'vitest';
import { seededRandom } from '@/test/seeded-random';
import {
  HOP_MS,
  HOP_PX,
  LOADING_BIT_SIZE,
  MAX_FRAME_MS,
  SPEED_BAND,
  STEP_PX,
  bitCount,
  hopOffset,
  legStep,
  spawnWalker,
  stepWalker,
  walkBounds,
} from './bit-walk';
import type { Bounds, Random, Walker } from './bit-walk';

const VIEWPORT = { width: 1000, height: 700 };
const bounds = walkBounds(VIEWPORT, LOADING_BIT_SIZE);
/** 0.5 everywhere: no jitter, no turn, no drift, no hop, so only the straight-line motion is left. */
const still: Random = () => 0.5;
const walkerAt = (overrides: Partial<Walker> = {}): Walker => ({
  x: 500,
  y: 300,
  heading: 0,
  speed: 60,
  facing: 1,
  travelled: 0,
  hopMsLeft: 0,
  ...overrides,
});
const angleBetween = (first: number, second: number) => {
  const difference = Math.abs(first - second) % (2 * Math.PI);
  return difference > Math.PI ? 2 * Math.PI - difference : difference;
};
const run = (start: Walker, totalMs: number, frameMs: number, random: Random, area = bounds) => {
  let walker = start;
  for (let elapsed = 0; elapsed < totalMs; elapsed += frameMs)
    walker = stepWalker(walker, area, frameMs, random);
  return walker;
};

describe('walkBounds', () => {
  it('keeps the whole sprite and its hop inside the viewport', () => {
    expect(bounds).toEqual({
      minX: 0,
      minY: HOP_PX,
      maxX: VIEWPORT.width - LOADING_BIT_SIZE,
      maxY: VIEWPORT.height - LOADING_BIT_SIZE,
    });
  });

  it('never inverts on a viewport smaller than the sprite', () => {
    const tiny = walkBounds({ width: 10, height: 10 }, LOADING_BIT_SIZE);
    expect(tiny.maxX).toBeGreaterThanOrEqual(tiny.minX);
    expect(tiny.maxY).toBeGreaterThanOrEqual(tiny.minY);
  });
});

describe('spawnWalker', () => {
  it('starts inside the bounds with a speed in the band, differently for different seeds', () => {
    const spawned = [1, 2, 3, 4, 5].map((seed) => spawnWalker(bounds, seededRandom(seed)));
    for (const walker of spawned) {
      expect(walker.x).toBeGreaterThanOrEqual(bounds.minX);
      expect(walker.x).toBeLessThanOrEqual(bounds.maxX);
      expect(walker.y).toBeGreaterThanOrEqual(bounds.minY);
      expect(walker.y).toBeLessThanOrEqual(bounds.maxY);
      expect(walker.speed).toBeGreaterThanOrEqual(SPEED_BAND.min);
      expect(walker.speed).toBeLessThanOrEqual(SPEED_BAND.max);
    }
    expect(new Set(spawned.map((walker) => walker.x)).size).toBe(spawned.length);
    expect(spawnWalker(bounds, seededRandom(7))).toEqual(spawnWalker(bounds, seededRandom(7)));
  });
});

describe('stepWalker', () => {
  it('moves along its heading at its speed', () => {
    const next = stepWalker(walkerAt({ heading: 0, speed: 60 }), bounds, 100, still);
    expect(next.x).toBeCloseTo(506);
    expect(next.y).toBeCloseTo(300);
    expect(next.travelled).toBeCloseTo(6);
  });

  it('covers the same ground at any frame rate', () => {
    const start = walkerAt({ heading: Math.PI / 4, speed: 60 });
    const reference = run(start, 1000, 100, still);
    for (const frameMs of [50, 20, 10]) {
      const other = run(start, 1000, frameMs, still);
      expect(other.x).toBeCloseTo(reference.x, 4);
      expect(other.y).toBeCloseTo(reference.y, 4);
      expect(other.travelled).toBeCloseTo(reference.travelled, 4);
    }
  });

  it('treats a long stall as one capped frame instead of teleporting', () => {
    const start = walkerAt({ speed: 60 });
    const stalled = stepWalker(start, bounds, 5000, still);
    expect(stalled.x - start.x).toBeCloseTo((60 * MAX_FRAME_MS) / 1000);
  });

  it('bounces off the right edge and heads back', () => {
    const next = stepWalker(walkerAt({ x: bounds.maxX - 1, heading: 0 }), bounds, 100, still);
    expect(next.x).toBeLessThanOrEqual(bounds.maxX);
    expect(Math.cos(next.heading)).toBeLessThan(0);
    expect(next.facing).toBe(-1);
  });

  it('bounces off the left edge', () => {
    const next = stepWalker(walkerAt({ x: 1, heading: Math.PI }), bounds, 100, still);
    expect(next.x).toBeGreaterThanOrEqual(bounds.minX);
    expect(Math.cos(next.heading)).toBeGreaterThan(0);
  });

  it('bounces off the top and the bottom edge', () => {
    const top = stepWalker(
      walkerAt({ y: bounds.minY + 1, heading: (3 * Math.PI) / 2 }),
      bounds,
      100,
      still,
    );
    expect(top.y).toBeGreaterThanOrEqual(bounds.minY);
    expect(Math.sin(top.heading)).toBeGreaterThan(0);
    const bottom = stepWalker(
      walkerAt({ y: bounds.maxY - 1, heading: Math.PI / 2 }),
      bounds,
      100,
      still,
    );
    expect(bottom.y).toBeLessThanOrEqual(bounds.maxY);
    expect(Math.sin(bottom.heading)).toBeLessThan(0);
  });

  it('never leaves the bounds, whatever the frame sizes, on a long chaotic walk', () => {
    const random = seededRandom(42);
    let walker = spawnWalker(bounds, random);
    for (let index = 0; index < 20_000; index += 1) {
      walker = stepWalker(walker, bounds, index % 7 === 0 ? 100 : 16, random);
      expect(walker.x).toBeGreaterThanOrEqual(bounds.minX);
      expect(walker.x).toBeLessThanOrEqual(bounds.maxX);
      expect(walker.y).toBeGreaterThanOrEqual(bounds.minY);
      expect(walker.y).toBeLessThanOrEqual(bounds.maxY);
    }
  });

  it('keeps the speed inside the band but lets it vary', () => {
    const random = seededRandom(9);
    let walker = spawnWalker(bounds, random);
    const speeds: number[] = [];
    for (let index = 0; index < 5000; index += 1) {
      walker = stepWalker(walker, bounds, 16, random);
      speeds.push(walker.speed);
    }
    expect(Math.min(...speeds)).toBeGreaterThanOrEqual(SPEED_BAND.min);
    expect(Math.max(...speeds)).toBeLessThanOrEqual(SPEED_BAND.max);
    expect(Math.max(...speeds) - Math.min(...speeds)).toBeGreaterThan(10);
  });

  it('wobbles a little every step and now and then turns sharply', () => {
    const random = seededRandom(3);
    const open: Bounds = { minX: -1e9, maxX: 1e9, minY: -1e9, maxY: 1e9 };
    let walker = walkerAt({ x: 0, y: 0 });
    const turns: number[] = [];
    for (let index = 0; index < 3750; index += 1) {
      const next = stepWalker(walker, open, 16, random);
      turns.push(angleBetween(walker.heading, next.heading));
      walker = next;
    }
    const sorted = [...turns].sort((first, second) => first - second);
    expect(sorted[Math.floor(sorted.length / 2)]).toBeLessThan(0.2);
    expect(turns.some((turn) => turn > 0)).toBe(true);
    const sharp = turns.filter((turn) => turn > Math.PI / 2).length;
    expect(sharp).toBeGreaterThanOrEqual(3);
    expect(sharp).toBeLessThanOrEqual(60);
  });

  it('is deterministic for the same seed', () => {
    const first = run(spawnWalker(bounds, seededRandom(5)), 2000, 16, seededRandom(6));
    const second = run(spawnWalker(bounds, seededRandom(5)), 2000, 16, seededRandom(6));
    expect(first).toEqual(second);
  });

  it('faces its horizontal direction and keeps facing when it walks straight up or down', () => {
    expect(stepWalker(walkerAt({ heading: 0, facing: -1 }), bounds, 16, still).facing).toBe(1);
    expect(stepWalker(walkerAt({ heading: Math.PI, facing: 1 }), bounds, 16, still).facing).toBe(
      -1,
    );
    expect(
      stepWalker(walkerAt({ heading: Math.PI / 2, facing: -1 }), bounds, 16, still).facing,
    ).toBe(-1);
  });

  it('starts a hop now and then and finishes it', () => {
    const hopping = stepWalker(walkerAt(), bounds, 16, () => 0);
    expect(hopping.hopMsLeft).toBe(HOP_MS);
    const landed = run(hopping, HOP_MS + 50, 16, () => 0.99);
    expect(landed.hopMsLeft).toBe(0);
  });
  it('stands still, and stays finite, on a zero, negative or NaN frame', () => {
    const start = walkerAt({ heading: 0, speed: 80, travelled: 3 });
    for (const frameMs of [0, -16, Number.NaN]) {
      const next = stepWalker(start, bounds, frameMs, seededRandom(4));
      expect(next.x).toBe(start.x);
      expect(next.y).toBe(start.y);
      expect(next.travelled).toBe(start.travelled);
      expect(next.heading).toBeCloseTo(start.heading);
      expect(next.speed).toBeCloseTo(start.speed);
      const after = stepWalker(next, bounds, 100, seededRandom(4));
      expect([after.x, after.y, after.heading, after.speed].every(Number.isFinite)).toBe(true);
    }
  });

  it('scales the wobble with the square root of the frame time, not linearly', () => {
    const open: Bounds = { minX: -1e9, maxX: 1e9, minY: -1e9, maxY: 1e9 };
    const median = (values: number[]) =>
      [...values].sort((first, second) => first - second)[Math.floor(values.length / 2)]!;
    const medianHeadingChange = (frameMs: number) =>
      median(
        Array.from({ length: 2000 }, (_value, index) => {
          const start = walkerAt({ heading: 1, x: 0, y: 0 });
          const end = run(start, 200, frameMs, seededRandom(index + 1), open);
          return angleBetween(start.heading, end.heading);
        }),
      );
    const ratio = medianHeadingChange(100) / medianHeadingChange(10);
    expect(ratio).toBeGreaterThan(0.85);
    expect(ratio).toBeLessThan(1.15);
  });

  it('stays finite and inside the bounds on a viewport with no room for the sprite', () => {
    for (const viewport of [
      { width: 0, height: 0 },
      { width: 10, height: 10 },
    ]) {
      const area = walkBounds(viewport, LOADING_BIT_SIZE);
      const random = seededRandom(11);
      let walker = spawnWalker(area, random);
      for (let index = 0; index < 500; index += 1) {
        walker = stepWalker(walker, area, 16, random);
        expect([walker.x, walker.y, walker.heading, walker.speed].every(Number.isFinite)).toBe(
          true,
        );
        expect(walker.x).toBeGreaterThanOrEqual(area.minX);
        expect(walker.x).toBeLessThanOrEqual(area.maxX);
        expect(walker.y).toBeGreaterThanOrEqual(area.minY);
        expect(walker.y).toBeLessThanOrEqual(area.maxY);
      }
    }
  });
});

describe('hopOffset', () => {
  it('is zero on the ground and rises at most HOP_PX in the middle of a hop', () => {
    expect(hopOffset(0)).toBe(0);
    expect(hopOffset(HOP_MS / 2)).toBeCloseTo(-HOP_PX);
    expect(hopOffset(HOP_MS)).toBeCloseTo(0);
    for (let left = 0; left <= HOP_MS; left += 20) {
      expect(hopOffset(left)).toBeLessThanOrEqual(0);
      expect(hopOffset(left)).toBeGreaterThanOrEqual(-HOP_PX - 1e-9);
    }
  });
});

describe('legStep', () => {
  it('alternates the leg frame every STEP_PX walked', () => {
    expect(legStep(0)).toBe(false);
    expect(legStep(STEP_PX - 0.1)).toBe(false);
    expect(legStep(STEP_PX)).toBe(true);
    expect(legStep(2 * STEP_PX)).toBe(false);
  });
});

describe('bitCount', () => {
  it('is 3 on a phone and 5 from 768 px up', () => {
    expect(bitCount(375)).toBe(3);
    expect(bitCount(767)).toBe(3);
    expect(bitCount(768)).toBe(5);
    expect(bitCount(1440)).toBe(5);
  });
});
