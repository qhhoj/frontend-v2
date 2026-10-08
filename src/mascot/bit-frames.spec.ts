import { describe, expect, it } from 'vitest';
import { BIT_LOOPS } from './bit-frames';
import type { BitKind } from './bit-frames';

const KINDS = Object.keys(BIT_LOOPS) as BitKind[];
const ROLES = new Set(['.', 'O', 'B', 'S', 'H', 'E', 'A', 'o', 'b', 's', 'h', 'e', 'a', 'P']);
/** The trio is the one wide loop: 52 x 22 pixels; every other Bit is 16 x 16. */
const SIZE: Record<BitKind, [columns: number, rows: number]> = {
  judging: [16, 16],
  contest: [16, 16],
  rankUp: [16, 16],
  welcome: [16, 16],
  envelope: [16, 16],
  writing: [16, 16],
  security: [16, 16],
  staff: [16, 16],
  community: [52, 22],
};

/** The pixel at (row, column), 0-based, of one frame of a loop. */
const pixel = (kind: BitKind, frame: number, row: number, column: number) =>
  BIT_LOOPS[kind].frames[frame]?.[row]?.[column];

describe('BIT_LOOPS', () => {
  it('has one loop per approved kind, each with a timing for every frame', () => {
    expect(KINDS).toHaveLength(9);
    for (const kind of KINDS) {
      const loop = BIT_LOOPS[kind];
      expect(loop.frames.length).toBeGreaterThan(1);
      expect(loop.frameMs).toHaveLength(loop.frames.length);
      for (const ms of loop.frameMs) expect(ms).toBeGreaterThan(0);
    }
  });

  it('draws every frame of a loop at the same size, and only known roles', () => {
    for (const kind of KINDS) {
      const [columns, rows] = SIZE[kind];
      for (const frame of BIT_LOOPS[kind].frames) {
        expect(frame).toHaveLength(rows);
        for (const row of frame) {
          expect(row).toHaveLength(columns);
          for (const role of row) expect(ROLES.has(role)).toBe(true);
        }
      }
    }
  });

  it('moves every loop: frame 0 differs from frame 1', () => {
    for (const kind of KINDS)
      expect(BIT_LOOPS[kind].frames[0]).not.toEqual(BIT_LOOPS[kind].frames[1]);
  });

  it('gives each kind its own still frame', () => {
    const stills = KINDS.map((kind) => BIT_LOOPS[kind].frames[0]!.join('|'));
    expect(new Set(stills).size).toBe(KINDS.length);
  });

  it('draws the approved pixels of each kind in frame 0 and frame 1', () => {
    // Hourglass: the top grain is accent in frame 0 and highlight once it has drained.
    expect([pixel('judging', 0, 0, 5), pixel('judging', 1, 0, 5)]).toEqual(['A', 'H']);
    expect([pixel('judging', 0, 2, 7), pixel('judging', 1, 2, 7)]).toEqual(['H', 'A']);
    // Stopwatch: the hand moves from the top of the dial to the next tick.
    expect([pixel('contest', 0, 2, 7), pixel('contest', 1, 2, 7)]).toEqual(['A', 'H']);
    // Up arrow: the whole Bit bobs one pixel down.
    expect([pixel('rankUp', 0, 9, 5), pixel('rankUp', 1, 9, 5)]).toEqual(['E', 'B']);
    // Raised arm: the arm pixel appears in frame 1 (the arm is up, the frame-0 cell is empty).
    expect([pixel('welcome', 0, 6, 14), pixel('welcome', 1, 6, 14)]).toEqual(['.', 'O']);
    // Envelope: the flap rises.
    expect([pixel('envelope', 0, 4, 9), pixel('envelope', 1, 4, 9)]).toEqual(['A', 'H']);
    // Quill: the first dot is written in frame 1 onwards, so frame 0 has the quill outline there.
    expect([pixel('writing', 0, 0, 6), pixel('writing', 1, 0, 6)]).toEqual(['O', '.']);
    // Padlock: the shackle's shine appears as the lock closes.
    expect([pixel('security', 0, 2, 9), pixel('security', 1, 2, 9)]).toEqual(['H', 'O']);
    // Hard hat: the brim drops one pixel on the nod.
    expect([pixel('staff', 0, 1, 6), pixel('staff', 1, 1, 6)]).toEqual(['O', '.']);
    // Trio: the middle Bit hops; the charcoal Bit's accent and the podium plinth are in place.
    expect([pixel('community', 0, 5, 2), pixel('community', 1, 5, 2)]).toEqual(['.', 'O']);
    expect(pixel('community', 0, 8, 41)).toBe('o');
    expect(pixel('community', 0, 16, 18)).toBe('P');
  });
});
