import { describe, expect, it } from 'vitest';
import { seededRandom } from '@/test/seeded-random';
import {
  LOADING_BIT_SIZE,
  MAX_FRAME_MS,
  SPEED_BAND,
  isGone,
  leaveHeading,
  spawnWalker,
  stepLeaver,
  stepWalker,
  walkBounds,
} from './bit-walk';
import type { Random, Walker } from './bit-walk';

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
const run = (start: Walker, totalMs: number, frameMs: number, random: Random, area = bounds) => {
  let walker = start;
  for (let elapsed = 0; elapsed < totalMs; elapsed += frameMs)
    walker = stepWalker(walker, area, frameMs, random);
  return walker;
};

describe('stepWalker', () => {
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
});

describe('a walker outside the walk bounds', () => {
  const centre = { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 };
  const distanceToCentre = (walker: Walker) => Math.hypot(walker.x - centre.x, walker.y - centre.y);
  const outside = [
    walkerAt({ x: -200, y: 300, heading: Math.PI }),
    walkerAt({ x: VIEWPORT.width + 50, y: 300, heading: 0 }),
    walkerAt({ x: 400, y: -150, heading: 1.5 * Math.PI }),
    walkerAt({ x: 400, y: VIEWPORT.height + 90, heading: 0.5 * Math.PI }),
  ];

  it.each(outside)('heads straight for the centre without bouncing or wobbling (%#)', (start) => {
    const wobbly = seededRandom(3);
    let walker = start;
    for (let frame = 0; frame < 20; frame++) {
      const next = stepWalker(walker, bounds, 16, wobbly);
      expect(distanceToCentre(next)).toBeLessThan(distanceToCentre(walker));
      expect(next.heading).toBeCloseTo(
        (Math.atan2(centre.y - walker.y, centre.x - walker.x) + 2 * Math.PI) % (2 * Math.PI),
      );
      walker = next;
    }
  });

  it.each(outside)('never moves further than speed times the longest frame (%#)', (start) => {
    const random = seededRandom(11);
    let walker = start;
    for (let frame = 0; frame < 600; frame++) {
      const next = stepWalker(walker, bounds, frame % 2 ? 16 : 5000, random);
      const step = Math.hypot(next.x - walker.x, next.y - walker.y);
      expect(step).toBeLessThanOrEqual((SPEED_BAND.max * MAX_FRAME_MS) / 1000 + 1e-9);
      walker = next;
    }
  });

  it.each(outside)('ends up inside the bounds and wanders from there (%#)', (start) => {
    const random = seededRandom(5);
    let walker = start;
    for (let frame = 0; frame < 2000; frame++) walker = stepWalker(walker, bounds, 16, random);
    expect(walker.x).toBeGreaterThanOrEqual(bounds.minX);
    expect(walker.x).toBeLessThanOrEqual(bounds.maxX);
    expect(walker.y).toBeGreaterThanOrEqual(bounds.minY);
    expect(walker.y).toBeLessThanOrEqual(bounds.maxY);
  });
});

describe('stepLeaver', () => {
  const size = LOADING_BIT_SIZE;
  const leaving = () => {
    const start = walkerAt({ x: 900, y: 300, speed: 75, heading: 1 });
    return { ...start, heading: leaveHeading(start, VIEWPORT, size) };
  };

  it('walks off the nearest edge and is gone after enough frames, not before', () => {
    let walker = leaving();
    expect(isGone(walker, VIEWPORT, size)).toBe(false);
    let frames = 0;
    while (!isGone(walker, VIEWPORT, size) && frames < 10_000) {
      walker = stepLeaver(walker, 16);
      frames++;
    }
    expect(walker.x).toBeGreaterThanOrEqual(VIEWPORT.width);
    expect(frames).toBeCloseTo((VIEWPORT.width - 900) / ((75 * 16) / 1000), -1);
  });
});
