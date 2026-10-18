import { SPRITE_SIZE } from './bit-sprite';

/**
 * Pure movement of the loading Bits (no DOM, no clock; randomness is injected so specs are deterministic).
 * - `stepWalker`: wander inside the walk bounds at a drifting speed, bouncing off the edges; a walker found outside the bounds
 *   (its lane moved) heads straight for their centre instead, with no wobble and no jump, and wanders again once inside.
 * - `loadingLanes`: where the loading swarm may walk (the gutters beside the content column, else a band along the bottom).
 * - `leaveHeading`, `stepLeaver`, `isGone`: the exit of shooed roaming Bits. The heading to the nearest viewport edge is chosen
 *   once; the Bit then keeps its own speed in a straight line, legs stepping, until its whole sprite box is outside the viewport.
 */

/** Random numbers in [0, 1); `Math.random` in the app, a seeded generator in specs. */
export type Random = () => number;

export interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}
export interface Walker {
  x: number;
  y: number;
  /** Radians, 0 = east, growing clockwise on screen (y points down). Kept in [0, 2*PI). */
  heading: number;
  /** px per second. */
  speed: number;
  facing: 1 | -1;
  /** Distance walked so far, drives the leg frame. */
  travelled: number;
  hopMsLeft: number;
}

/** Screen pixels per sprite pixel while loading, and the resulting sprite box. */
export const LOADING_PIXEL = 4;
export const LOADING_BIT_SIZE = SPRITE_SIZE * LOADING_PIXEL;
export const SPEED_BAND = { min: 40, max: 120 } as const;
export const HOP_PX = 6;
export const HOP_MS = 320;
/** Distance per leg frame (about 9 steps a second at walking speed). */
export const STEP_PX = 6;
/** A frame longer than this (tab stall) counts as this long, so nothing teleports. */
export const MAX_FRAME_MS = 100;

const FULL_TURN = 2 * Math.PI;
const HEADING_JITTER = 1.4; // rad per sqrt(second)
const TURN_RATE = 0.6; // sudden turns per second
const HOP_RATE = 0.5; // hops per second
const SPEED_DRIFT = 80; // px/s per sqrt(second)
const FACING_DEADZONE = 0.25;
const PHONE_WIDTH = 768;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
/** Probability that an event with `rate` per second happens within `seconds`. */
export const chance = (rate: number, seconds: number) => 1 - Math.exp(-rate * seconds);
/** The way the sprite faces for `heading`; near-vertical headings keep `current`. */
export const facingOf = (heading: number, current: 1 | -1): 1 | -1 => {
  const horizontal = Math.cos(heading);
  return Math.abs(horizontal) > FACING_DEADZONE ? (horizontal < 0 ? -1 : 1) : current;
};
const reflect = (value: number, min: number, max: number) =>
  value < min
    ? { value: Math.min(max, 2 * min - value), bounced: true }
    : value > max
      ? { value: Math.max(min, 2 * max - value), bounced: true }
      : { value, bounced: false };

const isOutside = (walker: Walker, bounds: Bounds) =>
  walker.x < bounds.minX ||
  walker.x > bounds.maxX ||
  walker.y < bounds.minY ||
  walker.y > bounds.maxY;
export const normalise = (heading: number) => ((heading % FULL_TURN) + FULL_TURN) % FULL_TURN;
/** A frame in seconds, clamped to [0, MAX_FRAME_MS]. */
export const secondsOf = (frameMs: number) =>
  // NaN counts as no time passed; negative frames are clamped too, so sqrt() never sees a negative.
  (Number.isNaN(frameMs) ? 0 : clamp(frameMs, 0, MAX_FRAME_MS)) / 1000;

type Viewport = { width: number; height: number };

/** Where a sprite box of `size` px may sit so it (and its hop) stays fully inside the viewport. */
export const walkBounds = (viewport: Viewport, size: number): Bounds => ({
  minX: 0,
  minY: HOP_PX,
  maxX: Math.max(0, viewport.width - size),
  maxY: Math.max(HOP_PX, viewport.height - size),
});

/** The left and right edges, in viewport pixels, of the page's content column. */
export interface Column {
  left: number;
  right: number;
}

/**
 * Where the loading Bits walk, one lane per Bit in turn: the two gutters beside the content column when each fits a Bit,
 * else a band along the bottom of the viewport (the footer's place), so they never cross the header or the content.
 */
export const loadingLanes = (viewport: Viewport, size: number, column: Column | null): Bounds[] => {
  const whole = walkBounds(viewport, size);
  if (column && column.left >= size && viewport.width - column.right >= size)
    return [
      { ...whole, maxX: column.left - size },
      { ...whole, minX: column.right },
    ];
  return [{ ...whole, minY: Math.max(whole.minY, whole.maxY - size / 2) }];
};

export const spawnWalker = (bounds: Bounds, random: Random): Walker => {
  const heading = random() * FULL_TURN;
  return {
    x: bounds.minX + random() * (bounds.maxX - bounds.minX),
    y: bounds.minY + random() * (bounds.maxY - bounds.minY),
    heading,
    speed: SPEED_BAND.min + random() * (SPEED_BAND.max - SPEED_BAND.min),
    facing: facingOf(heading, 1),
    travelled: 0,
    hopMsLeft: 0,
  };
};

/** One animation frame of `frameMs`. Pure: the same walker, bounds, frame and random numbers give the same result. */
export const stepWalker = (
  walker: Walker,
  bounds: Bounds,
  frameMs: number,
  random: Random,
): Walker => {
  const seconds = secondsOf(frameMs);
  let heading = walker.heading + (random() - 0.5) * 2 * HEADING_JITTER * Math.sqrt(seconds);
  if (random() < chance(TURN_RATE, seconds)) heading = random() * FULL_TURN;
  const speed = clamp(
    walker.speed + (random() - 0.5) * 2 * SPEED_DRIFT * Math.sqrt(seconds),
    SPEED_BAND.min,
    SPEED_BAND.max,
  );
  const hopStarts = walker.hopMsLeft <= 0 && random() < chance(HOP_RATE, seconds);
  const hopMsLeft = hopStarts ? HOP_MS : Math.max(0, walker.hopMsLeft - seconds * 1000);
  const moved = isOutside(walker, bounds)
    ? walkIn(walker, bounds, speed * seconds)
    : walkInside(walker, bounds, heading, speed * seconds);
  return {
    ...moved,
    speed,
    facing: facingOf(moved.heading, walker.facing),
    travelled: walker.travelled + speed * seconds,
    hopMsLeft,
  };
};

type Move = Pick<Walker, 'x' | 'y' | 'heading'>;

/** A step inside the bounds: bounces off the edges. */
function walkInside(walker: Walker, bounds: Bounds, heading: number, reach: number): Move {
  const horizontal = reflect(walker.x + Math.cos(heading) * reach, bounds.minX, bounds.maxX);
  const vertical = reflect(walker.y + Math.sin(heading) * reach, bounds.minY, bounds.maxY);
  let bounced = heading;
  if (horizontal.bounced) bounced = Math.PI - bounced;
  if (vertical.bounced) bounced = -bounced;
  return { x: horizontal.value, y: vertical.value, heading: normalise(bounced) };
}

/** A step from outside the bounds: straight at their centre, no bounce and no wobble, never past it. */
function walkIn(walker: Walker, bounds: Bounds, reach: number): Move {
  const dx = (bounds.minX + bounds.maxX) / 2 - walker.x;
  const dy = (bounds.minY + bounds.maxY) / 2 - walker.y;
  const heading = normalise(Math.atan2(dy, dx));
  const step = Math.min(reach, Math.hypot(dx, dy));
  return {
    x: walker.x + Math.cos(heading) * step,
    y: walker.y + Math.sin(heading) * step,
    heading,
  };
}

/** The heading, chosen once, that takes the walker's box out through the nearest of the four viewport edges. */
export const leaveHeading = (walker: Walker, viewport: Viewport, size: number): number => {
  const exits = [
    { distance: walker.x + size, heading: Math.PI },
    { distance: viewport.width - walker.x, heading: 0 },
    { distance: walker.y + size + HOP_PX, heading: 1.5 * Math.PI },
    { distance: viewport.height - walker.y + HOP_PX, heading: 0.5 * Math.PI },
  ];
  return exits.reduce((nearest, exit) => (exit.distance < nearest.distance ? exit : nearest))
    .heading;
};

/** One frame of leaving: same speed and heading, no randomness, a started hop finishes but none starts. */
export const stepLeaver = (walker: Walker, frameMs: number): Walker => {
  const seconds = secondsOf(frameMs);
  const reach = walker.speed * seconds;
  return {
    ...walker,
    x: walker.x + Math.cos(walker.heading) * reach,
    y: walker.y + Math.sin(walker.heading) * reach,
    facing: facingOf(walker.heading, walker.facing),
    travelled: walker.travelled + reach,
    hopMsLeft: Math.max(0, walker.hopMsLeft - seconds * 1000),
  };
};

/** True when the sprite box (with room for a hop) lies fully outside the viewport. */
export const isGone = (walker: Walker, viewport: Viewport, size: number): boolean =>
  walker.x + size <= 0 ||
  walker.x >= viewport.width ||
  walker.y + size + HOP_PX <= 0 ||
  walker.y - HOP_PX >= viewport.height;

/** Vertical offset (px, up is negative) of a hop with `hopMsLeft` still to go. */
export const hopOffset = (hopMsLeft: number) =>
  hopMsLeft <= 0 ? 0 : -HOP_PX * Math.sin(Math.PI * (1 - hopMsLeft / HOP_MS));

/** True on the second leg frame. */
export const legStep = (travelled: number) => Math.floor(travelled / STEP_PX) % 2 === 1;

export const bitCount = (viewportWidth: number) => (viewportWidth < PHONE_WIDTH ? 3 : 5);
