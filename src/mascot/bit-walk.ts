import { SPRITE_SIZE } from './bit-sprite';

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
const chance = (rate: number, seconds: number) => 1 - Math.exp(-rate * seconds);
const facingOf = (heading: number, current: 1 | -1): 1 | -1 => {
  const horizontal = Math.cos(heading);
  return Math.abs(horizontal) > FACING_DEADZONE ? (horizontal < 0 ? -1 : 1) : current;
};
const reflect = (value: number, min: number, max: number) =>
  value < min
    ? { value: Math.min(max, 2 * min - value), bounced: true }
    : value > max
      ? { value: Math.max(min, 2 * max - value), bounced: true }
      : { value, bounced: false };

/** Where a sprite box of `size` px may sit so it (and its hop) stays fully inside the viewport. */
export const walkBounds = (viewport: { width: number; height: number }, size: number): Bounds => ({
  minX: 0,
  minY: HOP_PX,
  maxX: Math.max(0, viewport.width - size),
  maxY: Math.max(HOP_PX, viewport.height - size),
});

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
  const seconds = Math.min(frameMs, MAX_FRAME_MS) / 1000;
  let heading = walker.heading + (random() - 0.5) * 2 * HEADING_JITTER * Math.sqrt(seconds);
  if (random() < chance(TURN_RATE, seconds)) heading = random() * FULL_TURN;
  const speed = clamp(
    walker.speed + (random() - 0.5) * 2 * SPEED_DRIFT * Math.sqrt(seconds),
    SPEED_BAND.min,
    SPEED_BAND.max,
  );
  const hopStarts = walker.hopMsLeft <= 0 && random() < chance(HOP_RATE, seconds);
  const hopMsLeft = hopStarts ? HOP_MS : Math.max(0, walker.hopMsLeft - seconds * 1000);
  const reach = speed * seconds;
  const horizontal = reflect(walker.x + Math.cos(heading) * reach, bounds.minX, bounds.maxX);
  const vertical = reflect(walker.y + Math.sin(heading) * reach, bounds.minY, bounds.maxY);
  if (horizontal.bounced) heading = Math.PI - heading;
  if (vertical.bounced) heading = -heading;
  heading = ((heading % FULL_TURN) + FULL_TURN) % FULL_TURN;
  return {
    x: horizontal.value,
    y: vertical.value,
    heading,
    speed,
    facing: facingOf(heading, walker.facing),
    travelled: walker.travelled + reach,
    hopMsLeft,
  };
};

/** Vertical offset (px, up is negative) of a hop with `hopMsLeft` still to go. */
export const hopOffset = (hopMsLeft: number) =>
  hopMsLeft <= 0 ? 0 : -HOP_PX * Math.sin(Math.PI * (1 - hopMsLeft / HOP_MS));

/** True on the second leg frame. */
export const legStep = (travelled: number) => Math.floor(travelled / STEP_PX) % 2 === 1;

export const bitCount = (viewportWidth: number) => (viewportWidth < PHONE_WIDTH ? 3 : 5);
