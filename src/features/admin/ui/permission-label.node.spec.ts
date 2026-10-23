import { describe, expect, it } from 'vitest';
import { permissionLabel, permissionLabels } from './permission-label';

describe('permissionLabel', () => {
  it('gives the human name of a known codename, never the codename', () => {
    expect(permissionLabel('judge.delete_problem')).toBe('Xóa bài');
    expect(permissionLabel('judge.change_judge')).toBe('Quản lý máy chấm');
  });
  it('is null for a codename without a name', () => {
    expect(permissionLabel('judge.made_up_permission')).toBeNull();
  });
});

describe('permissionLabels', () => {
  it('keeps the order and drops codenames without a name, so none is shown raw', () => {
    expect(permissionLabels(['judge.delete_problem', 'x.unknown', 'judge.change_judge'])).toEqual([
      'Xóa bài',
      'Quản lý máy chấm',
    ]);
    expect(permissionLabels(['x.unknown'])).toEqual([]);
  });
});
