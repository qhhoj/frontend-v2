import { describe, expect, it } from 'vitest';
import {
  BIT_LOOKS,
  BIT_PALETTES,
  SPRITE_SIZE,
  bitFrame,
  spriteCells,
  withOutline,
} from './bit-sprite';
import type { BitHeadgear } from './bit-sprite';

const HEADGEARS: BitHeadgear[] = ['none', 'cap', 'crown', 'antenna', 'nightcap'];
const ROLES = new Set(['.', 'O', 'B', 'S', 'H', 'E', 'A']);
const EMPTY_ROW = '.'.repeat(SPRITE_SIZE);

describe('bitFrame', () => {
  it('is always 16 rows of 16 known roles, with a transparent border for the outline to fit', () => {
    for (const headgear of HEADGEARS)
      for (const step of [false, true])
        for (const blinking of [false, true])
          for (const tears of [false, true]) {
            const frame = bitFrame({ headgear, step, blinking, tears });
            expect(frame).toHaveLength(SPRITE_SIZE);
            for (const row of frame) {
              expect(row).toHaveLength(SPRITE_SIZE);
              for (const role of row) expect(ROLES.has(role)).toBe(true);
            }
            expect(frame[0]).toBe(EMPTY_ROW);
            expect(frame[SPRITE_SIZE - 1]).toBe(EMPTY_ROW);
            for (const row of frame) expect([row[0], row.at(-1)]).toEqual(['.', '.']);
          }
  });

  it('puts headgear in rows 0-5 only: accent pixels above the body, none below', () => {
    for (const headgear of HEADGEARS.filter((candidate) => candidate !== 'none')) {
      const frame = bitFrame({ headgear });
      expect(frame.slice(0, 6).join('')).toContain('A');
      expect(frame.slice(6).join('')).not.toContain('A');
    }
    expect(bitFrame({ headgear: 'none' }).join('')).not.toContain('A');
  });

  it('keeps body, eyes and legs identical whatever the headgear', () => {
    const bodyRows = (headgear: BitHeadgear) => bitFrame({ headgear }).slice(6);
    for (const headgear of HEADGEARS) expect(bodyRows(headgear)).toEqual(bodyRows('none'));
  });

  it('blinks by turning the top eye pixel into body and the bottom one into shade', () => {
    const open = bitFrame({ headgear: 'none' });
    const closed = bitFrame({ headgear: 'none', blinking: true });
    expect(open.join('')).toContain('E');
    expect(closed.join('')).not.toContain('E');
    for (const column of [5, 9]) {
      expect(closed[8]?.[column]).toBe('B');
      expect(closed[9]?.[column]).toBe('S');
    }
    // Nothing else changes.
    open.forEach((row, rowIndex) =>
      [...row].forEach((role, column) => {
        if (role !== 'E') expect(closed[rowIndex]?.[column]).toBe(role);
      }),
    );
  });

  it('steps by moving the legs one pixel sideways and bobbing the whole body one pixel down', () => {
    const stand = bitFrame({ headgear: 'none' });
    const step = bitFrame({ headgear: 'none', step: true });
    expect(stand[12]).toBe('...O.O...O.O....');
    expect(step[13]).toBe('....O.O...O.O...');
    expect(step.slice(1, 12)).toEqual(stand.slice(0, 11));
  });

  it('cries with closed eyes and a highlight tear pixel under each eye', () => {
    const crying = bitFrame({ headgear: 'none', blinking: true, tears: true });
    const calm = bitFrame({ headgear: 'none', blinking: true });
    expect(crying.join('')).not.toContain('E');
    expect(crying[10]?.[5]).toBe('H');
    expect(crying[10]?.[9]).toBe('H');
    expect(calm[10]?.[5]).toBe('S');
    expect(calm[10]?.[9]).toBe('S');
    // Only those two pixels differ from the plain closed-eye frame.
    const differing = crying.flatMap((row, rowIndex) =>
      [...row].filter((role, column) => role !== calm[rowIndex]?.[column]),
    );
    expect(differing).toHaveLength(2);
  });
});

describe('withOutline', () => {
  it('outlines every transparent pixel that touches a filled pixel on its four sides', () => {
    expect(withOutline(['...', '.B.', '...'])).toEqual(['.O.', 'OBO', '.O.']);
  });

  it('does not outline diagonally', () => {
    expect(withOutline(['B..', '...', '...'])).toEqual(['BO.', 'O..', '...']);
  });

  it('does not outline around outline pixels (legs are outline-coloured)', () => {
    expect(withOutline(['.O.'])).toEqual(['.O.']);
  });
});

describe('spriteCells coordinates', () => {
  it('places the left eye top and the highlight on their exact 1-based column and row', () => {
    const cells = spriteCells(bitFrame({ headgear: 'none' }));
    expect(cells).toContainEqual({ column: 6, row: 9, colour: BIT_PALETTES.terracotta.E });
    expect(cells).toContainEqual({ column: 4, row: 7, colour: BIT_PALETTES.terracotta.H });
  });
});

describe('BIT_PALETTES', () => {
  it('gives every palette exactly six distinct colours, one per role', () => {
    for (const palette of Object.values(BIT_PALETTES)) {
      expect(Object.keys(palette).sort()).toEqual(['A', 'B', 'E', 'H', 'O', 'S']);
      expect(new Set(Object.values(palette)).size).toBe(6);
    }
  });
});

describe('spriteCells', () => {
  it('lists one cell per filled pixel on 1-based grid lines, in the chosen palette', () => {
    const frame = bitFrame({ headgear: 'cap' });
    const cells = spriteCells(frame);
    expect(cells).toHaveLength([...frame.join('')].filter((role) => role !== '.').length);
    for (const cell of cells) {
      expect(cell.column).toBeGreaterThanOrEqual(1);
      expect(cell.column).toBeLessThanOrEqual(SPRITE_SIZE);
      expect(cell.row).toBeGreaterThanOrEqual(1);
      expect(cell.row).toBeLessThanOrEqual(SPRITE_SIZE);
    }
    const terracotta = new Set<string>(Object.values(BIT_PALETTES.terracotta));
    expect(cells.every((cell) => terracotta.has(cell.colour))).toBe(true);
    const charcoal = new Set<string>(Object.values(BIT_PALETTES.charcoal));
    expect(spriteCells(frame, 'charcoal').every((cell) => charcoal.has(cell.colour))).toBe(true);
  });
});

describe('BIT_LOOKS', () => {
  it('gives every Bit a different headgear and exactly one charcoal twin in a nightcap', () => {
    expect(new Set(BIT_LOOKS.map((look) => look.headgear)).size).toBe(BIT_LOOKS.length);
    const charcoal = BIT_LOOKS.filter((look) => look.palette === 'charcoal');
    expect(charcoal.map((look) => look.headgear)).toEqual(['nightcap']);
  });
});
