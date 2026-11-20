import { newCase } from './test-cases';
import type { KeyedCase } from './test-cases';

/**
 * The test list as the table shows it. The stored list is flat: `S` opens a group, `E` closes it, `C` is a test. The
 * table shows a group as one row and hides the `E` that closes it; an `E` that closes nothing stays visible so it can be
 * removed. Nothing here writes a row's fields: a test that enters or leaves a group keeps the points it stores.
 */
export interface TableRow {
  /** The row's position in the stored list: the `N` of the field names `cases.N.*` and of the control ids. */
  index: number;
  row: KeyedCase;
  kind: 'group' | 'test' | 'stray-end';
  /** The number the table shows: tests count 1, 2, 3 across groups; groups count on their own. */
  number: number;
  /** A test between a group's start and its end: the group's points score it, its own are not used. */
  isInGroup: boolean;
}

export function tableRows(cases: readonly KeyedCase[]): TableRow[] {
  const rows: TableRow[] = [];
  let tests = 0;
  let groups = 0;
  let isOpen = false;
  cases.forEach((row, index) => {
    if (row.type === 'S') {
      isOpen = true;
      rows.push({ index, row, kind: 'group', number: ++groups, isInGroup: false });
    } else if (row.type === 'C') {
      rows.push({ index, row, kind: 'test', number: ++tests, isInGroup: isOpen });
    } else {
      if (!isOpen) rows.push({ index, row, kind: 'stray-end', number: 0, isInGroup: false });
      isOpen = false;
    }
  });
  return rows;
}

/** The table's rows (tests and groups) with these keys, in list order. */
export const shownRowsOf = (cases: readonly KeyedCase[], keys: readonly number[]) =>
  tableRows(cases).filter((shown) => keys.includes(shown.row.key));

/** The last row of the group that starts at `start`: its closing `E`, or `start` itself when nothing closes it. */
export function groupEnd(cases: readonly KeyedCase[], start: number): number {
  for (let index = start + 1; index < cases.length; index++) {
    if (cases[index]!.type === 'E') return index;
    if (cases[index]!.type === 'S') break;
  }
  return start;
}

/** The first row of the unit that ends at `end`: the `S` a closing `E` belongs to, else `end` itself. */
function unitStart(cases: readonly KeyedCase[], end: number): number {
  if (cases[end]!.type !== 'E') return end;
  for (let index = end - 1; index >= 0; index--) {
    if (cases[index]!.type === 'S') return index;
    if (cases[index]!.type === 'E') break;
  }
  return end;
}

/** The last row of the unit that starts at `start`: a group's end, else `start` itself. */
const unitEnd = (cases: readonly KeyedCase[], start: number) =>
  cases[start]!.type === 'S' ? groupEnd(cases, start) : start;

/**
 * Moves the whole group that starts at `start` (its tests and its end with it) past the unit before it (`-1`) or after
 * it (`1`): a lone test or another whole group. A move past either end of the list changes nothing.
 */
export function moveGroup(cases: KeyedCase[], start: number, offset: -1 | 1): KeyedCase[] {
  const end = groupEnd(cases, start);
  if (offset === -1) {
    if (start === 0) return cases;
    const before = unitStart(cases, start - 1);
    return [
      ...cases.slice(0, before),
      ...cases.slice(start, end + 1),
      ...cases.slice(before, start),
      ...cases.slice(end + 1),
    ];
  }
  if (end === cases.length - 1) return cases;
  const after = unitEnd(cases, end + 1);
  return [
    ...cases.slice(0, start),
    ...cases.slice(end + 1, after + 1),
    ...cases.slice(start, end + 1),
    ...cases.slice(after + 1),
  ];
}

/** Takes the group that starts at `start` apart: its start and its end go, its tests stay as lone tests. */
export function removeGroup(cases: KeyedCase[], start: number): KeyedCase[] {
  const end = groupEnd(cases, start);
  return cases.filter((_row, index) => index !== start && (index !== end || end === start));
}

/** A blank test as the last test of the group that starts at `start`. */
export function addCaseToGroup(cases: KeyedCase[], start: number): KeyedCase[] {
  const end = groupEnd(cases, start);
  const at = end === start ? start + 1 : end;
  return [...cases.slice(0, at), newCase(), ...cases.slice(at)];
}
