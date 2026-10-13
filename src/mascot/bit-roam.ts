import {
  HOP_MS,
  LOADING_BIT_SIZE,
  SPEED_BAND,
  chance,
  facingOf,
  isGone,
  normalise,
  secondsOf,
  spawnWalker,
  stepLeaver,
  stepWalker,
} from './bit-walk';
import type { Bounds, Random, Walker } from './bit-walk';

/**
 * Pure movement of the roaming Bits (Settings → Giao diện): the loading swarm's wander (`stepWalker`), run for as long as the
 * page is open, plus rests and two hard rules. No DOM, no clock; randomness is injected so specs are deterministic.
 * - Spacing: two Bits' boxes are never closer than `BIT_GAP` (1.2 body widths, top-left to top-left). A step that would break it
 *   is not taken; the Bit turns away from the other one instead. Bits step one after another against the positions already
 *   moved this frame, so the rule holds after every frame, not just on average.
 * - Pointer: a Bit never steps closer to the mouse pointer once its box is within `POINTER_MARGIN` (one body width) of it; it
 *   turns away instead. It never starts a rest there either. A resting Bit the pointer stays on for `POINTER_REST_MS` walks off,
 *   heading away (the delay leaves time to click it).
 * - Rests: now and then a Bit stands still for 1-2.5 s (and may turn round). Only a resting Bit takes clicks.
 * - Leaving (shooed): the loading exit (`stepLeaver`) with the same two rules; a blocked Bit waits for the way to clear.
 */

export interface Roamer extends Walker {
  /** Time left standing still; 0 while walking. */
  restMsLeft: number;
  /** How long the pointer has stayed on this resting Bit. */
  pointerMs: number;
}
export interface Pointer {
  x: number;
  y: number;
}
/** What a frame needs besides the Bits: where they may walk and where the mouse is (`null`: no mouse, or touch). */
export interface RoamArea {
  bounds: Bounds;
  pointer: Pointer | null;
}

const SIZE = LOADING_BIT_SIZE;
/** Least distance between two Bits' boxes (top-left to top-left), in px. */
export const BIT_GAP = 1.2 * SIZE;
/** Least gap between a Bit's box and the mouse pointer, in px. */
export const POINTER_MARGIN = SIZE;
/** How long the pointer stays on a resting Bit before it walks off. */
export const POINTER_REST_MS = 800;
export const REST_MS = { min: 1000, max: 2500 } as const;
const REST_RATE = 0.15; // rests per second of walking
const TURN_ON_REST = 0.4; // chance a resting Bit turns round
/** Spread (rad) around "straight away" when a Bit turns from what blocks it, so blocked Bits do not lock into one line. */
const AWAY_SPREAD = 1.2;
const SPAWN_TRIES = 60;

const centreOf = (bit: Pick<Walker, 'x' | 'y'>) => ({ x: bit.x + SIZE / 2, y: bit.y + SIZE / 2 });
const distance = (from: Pick<Walker, 'x' | 'y'>, to: Pick<Walker, 'x' | 'y'>) =>
  Math.hypot(from.x - to.x, from.y - to.y);
/** Gap between the pointer and the box at `bit` (0 when the pointer is on the box). */
export const pointerGap = (bit: Pick<Walker, 'x' | 'y'>, pointer: Pointer) => {
  const dx = Math.max(bit.x - pointer.x, 0, pointer.x - (bit.x + SIZE));
  const dy = Math.max(bit.y - pointer.y, 0, pointer.y - (bit.y + SIZE));
  return Math.hypot(dx, dy);
};
const isNearPointer = (bit: Pick<Walker, 'x' | 'y'>, pointer: Pointer | null) =>
  pointer !== null && pointerGap(bit, pointer) < POINTER_MARGIN;

type Spot = Pick<Walker, 'x' | 'y'>;

/**
 * What stops a move from `from` to `to`, as the point to turn away from, or null when the move is allowed. A move is refused
 * when it ends inside a rule's distance and brings the Bit closer (a Bit already too close may still back off).
 */
function blockerOf(from: Spot, to: Spot, others: Spot[], pointer: Pointer | null): Pointer | null {
  for (const other of others) {
    const after = distance(to, other);
    if (after < BIT_GAP && after < distance(from, other)) return centreOf(other);
  }
  // Near the pointer, measured centre to pointer: a box the pointer is on keeps a gap of 0 while it backs off.
  if (pointer && pointerGap(to, pointer) < POINTER_MARGIN) {
    if (distance(centreOf(to), pointer) < distance(centreOf(from), pointer)) return pointer;
  }
  return null;
}

/** A heading from the Bit's centre away from `point`, give or take half of `AWAY_SPREAD`. */
const awayFrom = (bit: Spot, point: Pointer, random: Random) => {
  const centre = centreOf(bit);
  return normalise(
    Math.atan2(centre.y - point.y, centre.x - point.x) + (random() - 0.5) * AWAY_SPREAD,
  );
};

const isSpotFree = (spot: Spot, placed: Spot[], pointer: Pointer | null) =>
  placed.every((other) => distance(spot, other) >= BIT_GAP) && !isNearPointer(spot, pointer);

/** Every grid spot `BIT_GAP` apart inside the bounds, row by row: the fallback when random spots keep colliding. */
function* gridSpots(bounds: Bounds): Generator<Spot> {
  for (let top = bounds.minY; top <= bounds.maxY; top += BIT_GAP)
    for (let left = bounds.minX; left <= bounds.maxX; left += BIT_GAP) yield { x: left, y: top };
}

/**
 * `count` Bits: the first of `existing` stay where they are, new ones walk in at random spots `BIT_GAP` from every other Bit and
 * off the pointer. A viewport too small for all of them gets fewer.
 */
export function spawnRoamers(
  count: number,
  area: RoamArea,
  random: Random,
  existing: Roamer[] = [],
): Roamer[] {
  const roamers = existing.slice(0, count);
  while (roamers.length < count) {
    const spot = freeSpot(roamers, area, random);
    if (!spot) break;
    roamers.push({ ...spawnWalker(area.bounds, random), ...spot, restMsLeft: 0, pointerMs: 0 });
  }
  return roamers;
}

function freeSpot(placed: Spot[], { bounds, pointer }: RoamArea, random: Random): Spot | null {
  for (let attempt = 0; attempt < SPAWN_TRIES; attempt++) {
    const spot = {
      x: bounds.minX + random() * (bounds.maxX - bounds.minX),
      y: bounds.minY + random() * (bounds.maxY - bounds.minY),
    };
    if (isSpotFree(spot, placed, pointer)) return spot;
  }
  for (const spot of gridSpots(bounds)) if (isSpotFree(spot, placed, pointer)) return spot;
  return null;
}

/** One frame for every Bit, in order, each checked against the others' positions as already moved this frame. */
export function stepRoamers(
  roamers: Roamer[],
  area: RoamArea,
  frameMs: number,
  random: Random,
): Roamer[] {
  const next = [...roamers];
  next.forEach((roamer, index) => {
    const others = next.filter((_other, otherIndex) => otherIndex !== index);
    next[index] =
      roamer.restMsLeft > 0
        ? stepResting(roamer, area.pointer, frameMs, random)
        : stepWalking(roamer, others, area, frameMs, random);
  });
  return next;
}

/** Stands still (a started hop finishes); walks off, away from the pointer, once it has stayed on the Bit long enough. */
function stepResting(
  roamer: Roamer,
  pointer: Pointer | null,
  frameMs: number,
  random: Random,
): Roamer {
  const ms = secondsOf(frameMs) * 1000;
  const hopMsLeft = Math.max(0, roamer.hopMsLeft - ms);
  const pointerMs = isNearPointer(roamer, pointer) ? roamer.pointerMs + ms : 0;
  if (pointer && pointerMs >= POINTER_REST_MS) {
    const heading = awayFrom(roamer, pointer, random);
    return {
      ...roamer,
      hopMsLeft,
      heading,
      facing: facingOf(heading, roamer.facing),
      restMsLeft: 0,
      pointerMs: 0,
    };
  }
  return { ...roamer, hopMsLeft, pointerMs, restMsLeft: Math.max(0, roamer.restMsLeft - ms) };
}

function stepWalking(
  roamer: Roamer,
  others: Spot[],
  { bounds, pointer }: RoamArea,
  frameMs: number,
  random: Random,
): Roamer {
  const wandered = stepWalker(roamer, bounds, frameMs, random);
  const blocker = blockerOf(roamer, wandered, others, pointer);
  const moved: Roamer = blocker
    ? turnedAway(roamer, wandered.hopMsLeft, blocker, random)
    : { ...roamer, ...wandered };
  const startsRest =
    random() < chance(REST_RATE, secondsOf(frameMs)) && !isNearPointer(moved, pointer);
  return startsRest ? rest(moved, random) : moved;
}

/** Stays put this frame, heading away from what blocked it. */
function turnedAway(roamer: Roamer, hopMsLeft: number, from: Pointer, random: Random): Roamer {
  const heading = awayFrom(roamer, from, random);
  return { ...roamer, hopMsLeft, heading, facing: facingOf(heading, roamer.facing) };
}

function rest(roamer: Roamer, random: Random): Roamer {
  const restMsLeft = REST_MS.min + random() * (REST_MS.max - REST_MS.min);
  const turns = random() < TURN_ON_REST;
  return {
    ...roamer,
    restMsLeft,
    pointerMs: 0,
    facing: turns ? (roamer.facing === 1 ? -1 : 1) : roamer.facing,
  };
}

/** A tap on a resting Bit: it hops, and the pointer's time on it starts over. */
export const cheer = (roamer: Roamer): Roamer => ({ ...roamer, hopMsLeft: HOP_MS, pointerMs: 0 });

/** True while the Bit stands still (the only time it takes clicks). */
export const isResting = (roamer: Roamer) => roamer.restMsLeft > 0;

type Viewport = { width: number; height: number };

/**
 * One frame of leaving (headings already set by `leaveHeading`): straight on at the shared pace, under the same two rules;
 * Bits already out of sight no longer block anyone.
 */
export function stepLeavers(
  roamers: Roamer[],
  viewport: Viewport,
  pointer: Pointer | null,
  frameMs: number,
): Roamer[] {
  const next = [...roamers];
  next.forEach((roamer, index) => {
    const others = next.filter(
      (other, otherIndex) => otherIndex !== index && !isGone(other, viewport, SIZE),
    );
    const moved = stepLeaver({ ...roamer, speed: SPEED_BAND.max }, frameMs);
    const blocked = blockerOf(roamer, moved, others, pointer) !== null;
    next[index] = blocked ? { ...roamer, hopMsLeft: moved.hopMsLeft } : { ...roamer, ...moved };
  });
  return next;
}
