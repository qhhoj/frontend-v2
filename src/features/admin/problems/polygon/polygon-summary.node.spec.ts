import { describe, expect, it } from 'vitest';
import type { Schemas } from '@/api/schemas';
import { localEditsRowsOf, summaryRowsOf } from './polygon-summary';

const summary = (
  overrides: Partial<Schemas['ImportSummaryResponse']> = {},
): Schemas['ImportSummaryResponse'] => ({
  checker: 'bridged',
  polygonChecker: 'std::wcmp.cpp',
  interactive: false,
  checkerIgnored: false,
  tests: 42,
  cases: 42,
  batches: 4,
  timeLimit: { polygon: 1, applied: 1 },
  memoryLimit: { polygon: 1048576, applied: 524288 },
  ...overrides,
});

describe('summaryRowsOf', () => {
  it('maps the checker, counts the tests and notes a clamped limit beside its value', () => {
    expect(summaryRowsOf(summary())).toEqual([
      { key: 'checker', value: 'std::wcmp.cpp → Checker riêng của bài', note: null },
      { key: 'tests', value: '42 test · 4 nhóm', note: null },
      { key: 'time', value: '1.0s', note: null },
      { key: 'memory', value: '512MB', note: 'Polygon: 1024MB, hạ theo mức tối đa' },
    ]);
  });

  it('counts the judged cases apart when dependencies copy tests', () => {
    expect(summaryRowsOf(summary({ cases: 50, batches: 0 }))[1]!.value).toBe(
      '42 test · 50 lượt chấm',
    );
  });

  it("says an interactive problem's checker runs on what the interactor wrote", () => {
    const rows = summaryRowsOf(
      summary({ interactive: true, timeLimit: { polygon: 0.5, applied: 1 } }),
    );
    expect(rows[0]).toEqual({
      key: 'checker',
      value:
        'Bài tương tác: std::wcmp.cpp → Checker riêng của bài, chạy trên output của interactor',
      note: null,
    });
    expect(rows[2]!.note).toBe('Polygon: 0.5s, nâng theo mức tối thiểu');
  });

  it('says the interactor alone judges when a sync kept a grader that does not run the checker', () => {
    expect(
      summaryRowsOf(summary({ interactive: true, checkerIgnored: true }), ['grader'])[0],
    ).toEqual({
      key: 'checker',
      value: 'Bài tương tác: chỉ interactor chấm',
      note: 'Checker của gói không chạy vì grader giữ bản sửa trên QHHOJ',
    });
  });

  it('notes a kept checker of an interactive problem as kept, not mapped', () => {
    expect(summaryRowsOf(summary({ interactive: true }), ['checker'])[0]).toEqual({
      key: 'checker',
      value: 'Bài tương tác: Checker riêng của bài, chạy trên output của interactor',
      note: 'Giữ bản sửa trên QHHOJ · Polygon: std::wcmp.cpp',
    });
  });

  it('names a site checker by its data-tab label', () => {
    expect(summaryRowsOf(summary({ checker: 'standard', polygonChecker: null }))[0]!.value).toBe(
      'So khớp đáp án (bỏ qua khoảng trắng thừa)',
    );
  });

  it('says a limit and a checker a sync kept as edited on QHHOJ were kept, not clamped or mapped', () => {
    const rows = summaryRowsOf(summary({ timeLimit: { polygon: 1, applied: 2 } }), [
      'checker',
      'timeLimit',
      'memoryLimit',
    ]);
    expect(rows[0]).toEqual({
      key: 'checker',
      value: 'Checker riêng của bài',
      note: 'Giữ bản sửa trên QHHOJ · Polygon: std::wcmp.cpp',
    });
    expect(rows[2]).toEqual({
      key: 'time',
      value: '2.0s',
      note: 'Giữ bản sửa trên QHHOJ · Polygon: 1.0s',
    });
    expect(rows[3]!.note).toBe('Giữ bản sửa trên QHHOJ · Polygon: 1024MB');
  });

  it('leaves a kept limit equal to the package without a note', () => {
    expect(summaryRowsOf(summary(), ['timeLimit'])[2]!.note).toBeNull();
  });
});

describe('localEditsRowsOf', () => {
  it('names the kept settings, then those taken from the package, in the data-tab order', () => {
    expect(
      localEditsRowsOf({ kept: ['checker', 'timeLimit'], updated: ['grader', 'partial'] }),
    ).toEqual([
      { kind: 'kept', names: 'giới hạn thời gian, checker' },
      { kind: 'updated', names: 'chấm điểm từng phần, grader' },
    ]);
  });

  it('has no row for an empty list', () => {
    expect(localEditsRowsOf({ kept: [], updated: ['memoryLimit'] })).toEqual([
      { kind: 'updated', names: 'giới hạn bộ nhớ' },
    ]);
    expect(localEditsRowsOf({ kept: [], updated: [] })).toEqual([]);
  });
});
