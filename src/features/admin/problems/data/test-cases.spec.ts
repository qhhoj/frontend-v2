import { describe, expect, it } from 'vitest';
import { problemData } from '@/test/admin-fixtures/problems';
import {
  addBatch,
  checkDataForm,
  addCase,
  caseCount,
  listWarnings,
  moveCase,
  removeCase,
  toDataBody,
  toDataForm,
} from './test-cases';

describe('test data form', () => {
  it('round-trips the stored configuration into the same PUT body', () => {
    const data = problemData();
    const result = toDataBody(toDataForm(data));
    expect('body' in result && result.body).toEqual({
      checker: data.checker,
      checkerArgs: data.checkerArgs,
      grader: data.grader,
      graderArgs: data.graderArgs,
      outputPrefix: data.outputPrefix,
      outputLimit: data.outputLimit,
      unicode: data.unicode,
      nobigmath: data.nobigmath,
      cases: data.cases,
    });
  });

  it('reads empty JSON boxes as null and refuses broken JSON per field', () => {
    const form = toDataForm(problemData());
    form.checkerArgsText = '';
    form.graderArgsText = '{ bad';
    expect(toDataBody(form)).toEqual({ errors: { graderArgs: 'JSON chưa hợp lệ.' } });
    form.graderArgsText = '{"precision": 6}';
    const result = toDataBody(form);
    expect('body' in result && result.body).toMatchObject({
      checkerArgs: null,
      graderArgs: { precision: 6 },
    });
  });

  it('refuses a JSON array or a number where an object is expected', () => {
    const form = toDataForm(problemData());
    form.checkerArgsText = '[1]';
    expect('errors' in toDataBody(form)).toBe(true);
  });

  it('adds a lone case and a batch (open, one case, close) with fresh keys', () => {
    const cases = toDataForm(problemData()).cases;
    const withCase = addCase(cases);
    expect(withCase.at(-1)).toMatchObject({ type: 'C', input: '', output: '', points: 0 });
    const withBatch = addBatch(cases);
    expect(withBatch.slice(-3).map((row) => row.type)).toEqual(['S', 'C', 'E']);
    expect(new Set(withBatch.map((row) => row.key)).size).toBe(withBatch.length);
  });

  it('counts only real cases against the soft threshold and every row against the hard limit', () => {
    const data = problemData({ limits: { softCases: 2, maxCases: 5 } });
    const form = toDataForm(data);
    expect(caseCount(form.cases)).toBe(3);
    expect(form.cases).toHaveLength(5);
    expect(listWarnings(form, data).map((warning) => warning.kind)).toEqual(['over-soft']);
    form.cases = addCase(form.cases);
    expect(listWarnings(form, data).map((warning) => warning.kind)).toEqual(['over-max']);
  });

  it('warns when group markers alone push the list past the hard limit, because the backend counts them too', () => {
    const data = problemData({ limits: { softCases: 50, maxCases: 4 } });
    const form = toDataForm(data);
    expect(caseCount(form.cases)).toBe(3);
    expect(listWarnings(form, data).map((warning) => warning.kind)).toEqual(['over-max']);
  });

  it('moves a row by one place, never past either end, and removes a row, keeping the keys', () => {
    const cases = toDataForm(problemData()).cases;
    const types = (rows: typeof cases) => rows.map((row) => row.type).join('');
    expect(types(cases)).toBe('CSCCE');
    expect(types(moveCase(cases, 2, -1))).toBe('CCSCE');
    expect(types(moveCase(cases, 0, -1))).toBe('CSCCE');
    expect(types(moveCase(cases, 4, 1))).toBe('CSCCE');
    const rest = removeCase(cases, 1);
    expect(types(rest)).toBe('CCCE');
    expect(rest.map((row) => row.key)).toEqual([
      cases[0]!.key,
      cases[2]!.key,
      cases[3]!.key,
      cases[4]!.key,
    ]);
  });

  it('flags a batch left open, a close without an open, and files not in the archive', () => {
    const data = problemData({ archiveFiles: ['1.in', '1.out'] });
    const form = toDataForm(data);
    form.cases = [
      { ...form.cases[0]!, type: 'E', key: 90 },
      { ...form.cases[0]!, type: 'S', key: 91 },
      {
        ...form.cases[0]!,
        type: 'C',
        input: 'sub2/03.in',
        output: '1.out',
        generatorArgs: '',
        key: 92,
      },
    ];
    expect(listWarnings(form, data)).toEqual([
      { kind: 'stray-end', index: 0 },
      { kind: 'missing-file', index: 2, file: 'sub2/03.in' },
      { kind: 'unclosed-batch', index: 1 },
    ]);
  });

  it('does not flag a missing input when a generator line makes it', () => {
    const data = problemData({ archiveFiles: [], generator: 'gen.cpp' });
    const form = toDataForm(data);
    form.cases = [
      {
        ...form.cases[0]!,
        type: 'C',
        input: 'x.in',
        output: 'x.out',
        generatorArgs: '100 7',
        key: 1,
      },
    ];
    expect(listWarnings(form, data)).toEqual([]);
  });

  it('refuses what the backend would refuse, per row, before any request', () => {
    const form = toDataForm(problemData());
    form.cases[0]!.input = 'x'.repeat(101);
    form.cases[2]!.points = 1.5;
    form.cases[3]!.generatorArgs = 'g'.repeat(1001);
    const errors = checkDataForm(form);
    expect(Object.keys(errors).sort()).toEqual([
      'cases.0.input',
      'cases.2.points',
      'cases.3.generatorArgs',
    ]);
    expect(errors['cases.2.points']).toBe('Phải là số nguyên không âm.');
  });

  it('refuses a file name with a NUL character and a count that is negative or not safe', () => {
    const form = toDataForm(problemData());
    form.cases[1]!.output = 'a\0b';
    form.cases[1]!.outputLimit = -1;
    expect(Object.keys(checkDataForm(form)).sort()).toEqual([
      'cases.1.output',
      'cases.1.outputLimit',
    ]);
  });

  it('refuses all case arguments together over 1 MiB, counting a null checker as its four characters', () => {
    const form = toDataForm(problemData());
    form.cases = Array.from({ length: 1100 }, (_row, index) => ({
      ...form.cases[0]!,
      key: index + 1,
      generatorArgs: 'g'.repeat(1000),
    }));
    expect(checkDataForm(form).cases).toBe('Tổng tham số của các test quá 1 MiB; hãy rút ngắn.');
  });

  it('accepts the stored configuration as it is: nothing is refused for a valid form', () => {
    expect(checkDataForm(toDataForm(problemData()))).toEqual({});
  });
});
