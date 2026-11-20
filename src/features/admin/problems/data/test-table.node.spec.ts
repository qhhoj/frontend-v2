import { describe, expect, it } from 'vitest';
import type { CaseType } from '@/api/types/problem-data';
import { addBatch, addCase } from './test-cases';
import type { KeyedCase } from './test-cases';
import { addCaseToGroup, moveGroup, removeGroup, tableRows, testNumbersOf } from './test-table';

/** A list from its letters, each test named after its position: `list('SCE C')`. */
function list(letters: string): KeyedCase[] {
  const types = [...letters.replace(/ /g, '')];
  const rows = types.reduce<KeyedCase[]>((made) => addCase(made), []);
  types.forEach((letter, index) => {
    rows[index]!.type = letter as CaseType;
    rows[index]!.input = letter === 'C' ? `t${index}` : '';
    rows[index]!.points = letter === 'S' ? 10 : 3;
  });
  return rows;
}
/** The list as letters, tests with their names: "S t1 E t3". */
const shape = (rows: KeyedCase[]) =>
  rows.map((row) => (row.type === 'C' ? row.input : row.type)).join(' ');

describe('tableRows', () => {
  it('hides a closing end, numbers tests across groups and marks the tests inside a group', () => {
    const shown = tableRows(list('C SCCE C'));
    expect(shown.map((row) => `${row.kind}${row.number}${row.isInGroup ? '*' : ''}`)).toEqual([
      'test1',
      'group1',
      'test2*',
      'test3*',
      'test4',
    ]);
    expect(shown.map((row) => row.index)).toEqual([0, 1, 2, 3, 5]);
  });

  it('keeps an end that closes nothing visible', () => {
    expect(tableRows(list('CE SCE E')).map((row) => row.kind)).toEqual([
      'test',
      'stray-end',
      'group',
      'test',
      'stray-end',
    ]);
  });

  it('names tests by the number the table shows', () => {
    const rows = list('SCE SCE');
    expect(testNumbersOf(rows, [rows[4]!.key])).toEqual([2]);
  });
});

describe('group operations', () => {
  it('moves a whole group past a lone test and past another group', () => {
    expect(shape(moveGroup(list('C SCE'), 1, -1))).toBe('S t2 E t0');
    expect(shape(moveGroup(list('SCE SCCE C'), 0, 1))).toBe('S t4 t5 E S t1 E t7');
    expect(shape(moveGroup(list('SCE SCCE'), 3, -1))).toBe('S t4 t5 E S t1 E');
  });

  it('changes nothing at either end of the list', () => {
    const rows = list('SCE C');
    expect(moveGroup(rows, 0, -1)).toBe(rows);
    const last = list('C SCE');
    expect(moveGroup(last, 1, 1)).toBe(last);
  });

  it('takes a group apart without touching its tests', () => {
    const rows = removeGroup(list('C SCCE C'), 1);
    expect(shape(rows)).toBe('t0 t2 t3 t5');
    expect(rows.map((row) => row.points)).toEqual([3, 3, 3, 3]);
  });

  it('removes only the start of a group nothing closes', () => {
    expect(shape(removeGroup(list('SC SCE'), 0))).toBe('t1 S t3 E');
  });

  it('adds a test at the end of the group, inside it', () => {
    const rows = addCaseToGroup(addBatch([]), 0);
    expect(rows.map((row) => row.type).join('')).toBe('SCCE');
    expect(tableRows(rows).filter((row) => row.isInGroup)).toHaveLength(2);
  });
});
