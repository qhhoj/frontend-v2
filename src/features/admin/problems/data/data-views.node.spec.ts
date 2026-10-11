import { describe, expect, it } from 'vitest';
import { problemData } from '@/test/admin-fixtures/problems';
import { dataAdvancedCount } from './data-views';
import { toDataForm } from './test-cases';

describe('data Advanced badge', () => {
  it('is 0 for the default checker and grader with saved tests', () => {
    const form = toDataForm(problemData());
    expect(dataAdvancedCount(form, toDataForm(problemData()))).toBe(0);
  });

  it('ignores the Basic choices and the hidden keys of a migrated custom checker', () => {
    const data = problemData({
      checker: 'bridged',
      checkerArgs: { files: 'chk.cpp', lang: 'CPP17', type: 'themis' },
      graderArgs: { io_method: 'file', io_input_file: 'BAI.INP', io_output_file: 'BAI.OUT' },
    });
    expect(dataAdvancedCount(toDataForm(data), toDataForm(data))).toBe(0);
  });

  it('counts a non-default rule with its options, and the test list only while unsaved', () => {
    const data = problemData({ checker: 'floats', checkerArgs: { precision: 4 } });
    const saved = toDataForm(data);
    expect(dataAdvancedCount(toDataForm(data), saved)).toBe(2);
    const edited = toDataForm(data);
    edited.cases = edited.cases.slice(1);
    expect(dataAdvancedCount(edited, saved)).toBe(3);
  });
});
