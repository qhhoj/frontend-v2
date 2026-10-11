import { describe, expect, it } from 'vitest';
import {
  configErrors,
  parseWeights,
  setFamily,
  setGrader,
  setStockChecker,
  withArg,
} from './checker-config';
import type { DataForm } from './test-cases';

const form = (patch: Partial<DataForm> = {}): DataForm => ({
  checker: 'standard',
  checkerArgsText: '',
  grader: 'standard',
  graderArgsText: '',
  outputPrefix: null,
  outputLimit: null,
  unicode: false,
  nobigmath: false,
  cases: [],
  ...patch,
});

describe('checker family switching', () => {
  it('keeps a migrated custom checker’s own keys and drops the percentage flag outside testlib', () => {
    const migrated = form({
      checker: 'bridged',
      checkerArgsText: JSON.stringify({
        files: 'chk.cpp',
        lang: 'CPP17',
        type: 'testlib',
        treat_checker_points_as_percentage: true,
      }),
    });
    setFamily(migrated, 'themis');
    expect(JSON.parse(migrated.checkerArgsText)).toEqual({
      files: 'chk.cpp',
      lang: 'CPP17',
      type: 'themis',
    });
  });

  it('starts a custom checker from a built-in one without the built-in’s arguments', () => {
    const floats = form({ checker: 'floats', checkerArgsText: '{"precision":4}' });
    setFamily(floats, 'testlib');
    expect(floats.checker).toBe('bridged');
    expect(JSON.parse(floats.checkerArgsText)).toEqual({ type: 'testlib' });
    setFamily(floats, 'stock');
    expect([floats.checker, floats.checkerArgsText]).toEqual(['standard', '']);
  });

  it('clears arguments when another built-in checker or grader is picked', () => {
    const floats = form({ checker: 'floats', checkerArgsText: '{"precision":4}' });
    setStockChecker(floats, 'identical');
    expect(floats.checkerArgsText).toBe('');
    const fileIo = form({ graderArgsText: '{"io_method":"file","io_input_file":"a.inp"}' });
    setGrader(fileIo, 'interactive');
    expect(fileIo.graderArgsText).toBe('');
  });

  it('writes an empty box when the last key is removed', () => {
    expect(withArg('{"precision":4}', 'precision', undefined)).toBe('');
  });
});

describe('parseWeights', () => {
  it('reads whole numbers split by spaces or commas and refuses anything else', () => {
    expect(parseWeights(' 1, 2  0 ')).toEqual([1, 2, 0]);
    for (const bad of ['', '1 -2', '1.5', 'a']) expect(parseWeights(bad)).toBeNull();
  });
});

describe('configErrors', () => {
  it('needs both file I/O names to be plain file names', () => {
    const errors = configErrors(
      form({
        graderArgsText:
          '{"io_method":"file","io_input_file":"../x.inp","io_output_file":"SUM.OUT"}',
      }),
    );
    expect(Object.keys(errors)).toEqual(['graderArgs.io_input_file']);
    expect(configErrors(form({ graderArgsText: '{"io_method":"file"}' }))).toHaveProperty(
      'graderArgs.io_output_file',
    );
    expect(
      configErrors(form({ grader: 'interactive', graderArgsText: '{"io_method":"file"}' })),
    ).toEqual({});
  });

  it('refuses a precision out of range and a line weighting worth nothing', () => {
    expect(
      configErrors(form({ checker: 'floats', checkerArgsText: '{"precision":21}' })),
    ).toHaveProperty('checkerArgs.precision');
    expect(
      configErrors(
        form({ checker: 'linematches', checkerArgsText: '{"point_distribution":[0,0]}' }),
      ),
    ).toHaveProperty('checkerArgs.point_distribution');
  });
});
