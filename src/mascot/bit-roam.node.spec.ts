import { describe, expect, it } from 'vitest';
import { seededRandom } from '@/test/seeded-random';
import { LOADING_BIT_SIZE, isGone, leaveHeading, walkBounds } from './bit-walk';
import type { Random } from './bit-walk';
import {
  BIT_GAP,
  POINTER_MARGIN,
  POINTER_REST_MS,
  REST_MS,
  cheer,
  isResting,
  pointerGap,
  spawnRoamers,
  stepLeavers,
  stepRoamers,
} from './bit-roam';
import type { Pointer, RoamArea, Roamer } from './bit-roam';

const DESKTOP = { width: 1440, height: 800 };
const PHONE = { width: 390, height: 700 };
const areaOf = (
  viewport: { width: number; height: number },
  pointer: Pointer | null = null,
): RoamArea => ({
  bounds: walkBounds(viewport, LOADING_BIT_SIZE),
  pointer,
});
const FRAME_MS = 16;
const half = LOADING_BIT_SIZE / 2;
const centreDistance = (bit: Roamer, pointer: Pointer) =>
  Math.hypot(bit.x + half - pointer.x, bit.y + half - pointer.y);
const closestPair = (bits: Roamer[]) => {
  let closest = Infinity;
  bits.forEach((first, index) =>
    bits
      .slice(index + 1)
      .forEach(
        (second) =>
          (closest = Math.min(closest, Math.hypot(first.x - second.x, first.y - second.y))),
      ),
  );
  return closest;
};
const roamerAt = (left: number, top: number, overrides: Partial<Roamer> = {}): Roamer => ({
  x: left,
  y: top,
  heading: 0,
  speed: 100,
  facing: 1,
  travelled: 0,
  hopMsLeft: 0,
  restMsLeft: 0,
  pointerMs: 0,
  ...overrides,
});
/** No jitter, no turn, no drift, no hop and no rest: straight lines only. */
const steady: Random = () => 0.5;
/** A mouse that wanders around and now and then jumps somewhere else (sometimes onto a Bit). */
const wanderingPointer = (viewport: { width: number; height: number }, random: Random) => {
  let pointer: Pointer = { x: viewport.width / 2, y: viewport.height / 2 };
  return () => {
    if (random() < 0.01) pointer = { x: random() * viewport.width, y: random() * viewport.height };
    else
      pointer = {
        x: Math.min(viewport.width, Math.max(0, pointer.x + (random() - 0.5) * 30)),
        y: Math.min(viewport.height, Math.max(0, pointer.y + (random() - 0.5) * 30)),
      };
    return pointer;
  };
};

describe('spawnRoamers', () => {
  it.each([
    ['desktop', DESKTOP, 5],
    ['phone', PHONE, 3],
    ['small phone', { width: 320, height: 480 }, 3],
  ])('places every Bit at least BIT_GAP apart on a %s', (_name, viewport, count) => {
    for (let seed = 1; seed <= 50; seed++) {
      const bits = spawnRoamers(count, areaOf(viewport), seededRandom(seed));
      expect(bits).toHaveLength(count);
      expect(closestPair(bits)).toBeGreaterThanOrEqual(BIT_GAP);
    }
  });

  it('keeps every Bit off the pointer', () => {
    const pointer = { x: 700, y: 400 };
    for (let seed = 1; seed <= 50; seed++)
      for (const bit of spawnRoamers(5, areaOf(DESKTOP, pointer), seededRandom(seed)))
        expect(pointerGap(bit, pointer)).toBeGreaterThanOrEqual(POINTER_MARGIN);
  });

  it('places fewer Bits when the viewport cannot hold them apart', () => {
    const bits = spawnRoamers(5, areaOf({ width: 100, height: 100 }), seededRandom(3));
    expect(bits.length).toBeLessThan(5);
    expect(closestPair(bits)).toBeGreaterThanOrEqual(BIT_GAP);
  });

  it('keeps the Bits already there and adds new ones apart from them', () => {
    const random = seededRandom(5);
    const two = spawnRoamers(2, areaOf(PHONE), random);
    const four = spawnRoamers(4, areaOf(PHONE), random, two);
    expect(four.slice(0, 2)).toEqual(two);
    expect(four).toHaveLength(4);
    expect(closestPair(four)).toBeGreaterThanOrEqual(BIT_GAP);
    expect(spawnRoamers(1, areaOf(PHONE), random, four)).toEqual([four[0]]);
  });

  it('starts every Bit walking', () => {
    expect(spawnRoamers(3, areaOf(DESKTOP), seededRandom(9)).some(isResting)).toBe(false);
  });
});

describe('stepRoamers: no clusters', () => {
  it.each([
    ['desktop', DESKTOP, 5],
    ['phone', PHONE, 3],
  ])(
    'keeps every pair at least BIT_GAP apart on every frame (%s, 2 minutes)',
    (_n, viewport, count) => {
      for (const seed of [1, 2, 3]) {
        const random = seededRandom(seed);
        let bits = spawnRoamers(count, areaOf(viewport), random);
        for (let frame = 0; frame < 7500; frame++) {
          bits = stepRoamers(bits, areaOf(viewport), FRAME_MS, random);
          expect(closestPair(bits)).toBeGreaterThanOrEqual(BIT_GAP - 1e-9);
        }
      }
    },
  );

  it('turns the Bit behind round instead of walking into the one ahead', () => {
    const ahead = roamerAt(400, 300, { heading: 0, speed: 40 });
    const behind = roamerAt(400 - BIT_GAP - 1, 300, { heading: 0, speed: 120 });
    const [nextBehind, nextAhead] = stepRoamers([behind, ahead], areaOf(DESKTOP), 100, steady);
    expect(nextAhead!.x).toBeGreaterThan(ahead.x);
    expect(nextBehind!.x).toBe(behind.x);
    expect(Math.cos(nextBehind!.heading)).toBeLessThan(0);
    expect(nextBehind!.facing).toBe(-1);
  });

  it('turns two Bits walking at each other both round', () => {
    const left = roamerAt(400, 300, { heading: 0 });
    const right = roamerAt(400 + BIT_GAP + 2, 300, { heading: Math.PI });
    const [nextLeft, nextRight] = stepRoamers([left, right], areaOf(DESKTOP), 100, steady);
    expect(
      Math.hypot(nextLeft!.x - nextRight!.x, nextLeft!.y - nextRight!.y),
    ).toBeGreaterThanOrEqual(BIT_GAP);
    expect(Math.cos(nextLeft!.heading)).toBeLessThan(0);
    expect(Math.cos(nextRight!.heading)).toBeGreaterThan(0);
  });

  it('lets two Bits that start too close back away from each other', () => {
    const left = roamerAt(400, 300, { heading: Math.PI });
    const right = roamerAt(420, 300, { heading: 0 });
    const [nextLeft, nextRight] = stepRoamers([left, right], areaOf(DESKTOP), 100, steady);
    expect(nextRight!.x - nextLeft!.x).toBeGreaterThan(20);
  });

  it('never rests within BIT_GAP of another Bit, because it never gets there', () => {
    const random = seededRandom(11);
    let bits = spawnRoamers(5, areaOf(PHONE), random);
    for (let frame = 0; frame < 5000; frame++) {
      bits = stepRoamers(bits, areaOf(PHONE), FRAME_MS, random);
      const resting = bits.filter(isResting);
      for (const bit of resting)
        for (const other of bits)
          if (other !== bit)
            expect(Math.hypot(bit.x - other.x, bit.y - other.y)).toBeGreaterThanOrEqual(
              BIT_GAP - 1e-9,
            );
    }
  });
});

describe('stepRoamers: never onto the pointer', () => {
  it('never lets a Bit walk up to a still pointer, through it or rest under it', () => {
    for (const seed of [4, 5, 6]) {
      const random = seededRandom(seed);
      const pointer = { x: 720, y: 400 };
      let bits = spawnRoamers(5, areaOf(DESKTOP, pointer), random);
      for (let frame = 0; frame < 7500; frame++) {
        bits = stepRoamers(bits, areaOf(DESKTOP, pointer), FRAME_MS, random);
        for (const bit of bits)
          expect(pointerGap(bit, pointer)).toBeGreaterThanOrEqual(POINTER_MARGIN);
      }
    }
  });

  it('keeps a pointer pinned in a corner clear while the Bits keep their gap', () => {
    const random = seededRandom(8);
    const pointer = { x: 30, y: PHONE.height - 30 };
    let bits = spawnRoamers(3, areaOf(PHONE, pointer), random);
    for (let frame = 0; frame < 5000; frame++) {
      bits = stepRoamers(bits, areaOf(PHONE, pointer), FRAME_MS, random);
      expect(closestPair(bits)).toBeGreaterThanOrEqual(BIT_GAP - 1e-9);
      for (const bit of bits)
        expect(pointerGap(bit, pointer)).toBeGreaterThanOrEqual(POINTER_MARGIN);
    }
  });

  it('only ever backs away from a moving pointer that lands near it, and never rests there', () => {
    const random = seededRandom(12);
    const nextPointer = wanderingPointer(DESKTOP, seededRandom(99));
    let pointer = nextPointer();
    let bits = spawnRoamers(5, areaOf(DESKTOP, pointer), random);
    for (let frame = 0; frame < 7500; frame++) {
      const before = bits;
      pointer = nextPointer();
      bits = stepRoamers(bits, areaOf(DESKTOP, pointer), FRAME_MS, random);
      bits.forEach((bit, index) => {
        const was = before[index]!;
        if (pointerGap(bit, pointer) < POINTER_MARGIN) {
          // Within the margin: no step towards the pointer, and a rest only if it was already resting there.
          expect(centreDistance(bit, pointer)).toBeGreaterThanOrEqual(
            centreDistance(was, pointer) - 1e-9,
          );
          if (isResting(bit)) expect(isResting(was)).toBe(true);
        }
      });
      expect(closestPair(bits)).toBeGreaterThanOrEqual(BIT_GAP - 1e-9);
    }
  });

  it('stops a Bit at the margin when the pointer is on its path', () => {
    const pointer = { x: 600, y: 300 + half };
    let bits = [roamerAt(300, 300, { heading: 0 })];
    for (let frame = 0; frame < 300; frame++)
      bits = stepRoamers(bits, areaOf(DESKTOP, pointer), FRAME_MS, steady);
    expect(bits[0]!.x + LOADING_BIT_SIZE).toBeLessThanOrEqual(pointer.x - POINTER_MARGIN);
  });

  it('lets a resting Bit be clicked, then steps it aside once the pointer rests on it', () => {
    const pointer = { x: 400 + half, y: 300 + half };
    let bits = [roamerAt(400, 300, { restMsLeft: 10_000 })];
    for (let elapsed = 0; elapsed < POINTER_REST_MS - 100; elapsed += FRAME_MS)
      bits = stepRoamers(bits, areaOf(DESKTOP, pointer), FRAME_MS, steady);
    expect(isResting(bits[0]!)).toBe(true);
    for (let elapsed = 0; elapsed < 200; elapsed += FRAME_MS)
      bits = stepRoamers(bits, areaOf(DESKTOP, pointer), FRAME_MS, steady);
    expect(isResting(bits[0]!)).toBe(false);
    for (let elapsed = 0; elapsed < 3000; elapsed += FRAME_MS)
      bits = stepRoamers(bits, areaOf(DESKTOP, pointer), FRAME_MS, steady);
    expect(pointerGap(bits[0]!, pointer)).toBeGreaterThanOrEqual(POINTER_MARGIN);
  });

  it('starts the pointer wait over when the Bit is tapped', () => {
    const tapped = cheer(roamerAt(400, 300, { restMsLeft: 5000, pointerMs: POINTER_REST_MS - 10 }));
    expect(tapped.pointerMs).toBe(0);
    expect(tapped.hopMsLeft).toBeGreaterThan(0);
  });
});

describe('stepRoamers: rests', () => {
  it('rests now and then for 1 to 2.5 s', () => {
    const random = seededRandom(21);
    let bits = spawnRoamers(1, areaOf(DESKTOP), random);
    const restLengths: number[] = [];
    let restMs = 0;
    for (let frame = 0; frame < 20_000; frame++) {
      bits = stepRoamers(bits, areaOf(DESKTOP), FRAME_MS, random);
      if (isResting(bits[0]!)) restMs += FRAME_MS;
      else if (restMs) {
        restLengths.push(restMs);
        restMs = 0;
      }
    }
    expect(restLengths.length).toBeGreaterThan(5);
    for (const length of restLengths) {
      expect(length).toBeGreaterThanOrEqual(REST_MS.min - FRAME_MS);
      expect(length).toBeLessThanOrEqual(REST_MS.max + FRAME_MS);
    }
  });

  it('does not move while resting', () => {
    const bit = roamerAt(400, 300, { restMsLeft: 1000 });
    const [next] = stepRoamers([bit], areaOf(DESKTOP), 100, seededRandom(1));
    expect(next!.x).toBe(400);
    expect(next!.y).toBe(300);
    expect(next!.restMsLeft).toBe(900);
  });
});

describe('stepLeavers', () => {
  it('takes every Bit out of sight while keeping the gap', () => {
    const random = seededRandom(31);
    let bits = spawnRoamers(5, areaOf(DESKTOP), random);
    bits = bits.map((bit) => ({ ...bit, heading: leaveHeading(bit, DESKTOP, LOADING_BIT_SIZE) }));
    let frames = 0;
    while (!bits.every((bit) => isGone(bit, DESKTOP, LOADING_BIT_SIZE)) && frames < 2000) {
      bits = stepLeavers(bits, DESKTOP, null, FRAME_MS);
      const visible = bits.filter((bit) => !isGone(bit, DESKTOP, LOADING_BIT_SIZE));
      expect(closestPair(visible)).toBeGreaterThanOrEqual(BIT_GAP - 1e-9);
      frames++;
    }
    expect(frames).toBeLessThan(2000);
  });

  it('waits while the pointer is in its way', () => {
    const bit = roamerAt(100, 300, { heading: Math.PI });
    const pointer = { x: 100 - POINTER_MARGIN + 1, y: 300 + half };
    const [next] = stepLeavers([bit], DESKTOP, pointer, FRAME_MS);
    expect(next!.x).toBe(100);
  });
});
