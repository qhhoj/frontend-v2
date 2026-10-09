import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import { ghost, unrankedGhost } from '@/test/admin-fixtures/ghosts';
import { i18n } from '@/i18n';
import { ghostStatusKey, refusedRowsOf, unrankedOf } from './ghost-import';

const KNOWN_CODES = [
  'label_missing',
  'label_formula',
  'label_repeats',
  'label_invalid',
  'caption_invalid',
  'caption_formula',
  'control_character',
  'cell_invalid',
  'columns_mismatch',
  'header_invalid',
  'csv_invalid',
  'too_many_ghosts',
];

describe('ghost import rules', () => {
  it('lists every refused row in Vietnamese by code, drops the row prefix when there is no row, and nothing for other failures', () => {
    const issues = [
      { field: 'csv', code: 'label_formula', message: 'x', row: 2 },
      { field: 'csv', code: 'cell_invalid', message: 'x', row: 3 },
      { field: 'csv', code: 'brand_new_code', message: 'x', row: 4 },
      { field: 'csv', code: 'too_many_ghosts', message: 'x' },
      { field: 'anonymize', code: 'label_missing', message: 'x', row: 9 },
    ];
    expect(refusedRowsOf(new ApiError('ghost_import_invalid', 400, 'x', { issues }))).toEqual([
      'Dòng 2: Nhãn bắt đầu bằng = + - hoặc @.',
      'Dòng 3: Ô điểm không đúng cú pháp.',
      'Dòng 4: Dòng không hợp lệ.',
      'Quá nhiều ghost (tối đa 2000).',
    ]);
    expect(refusedRowsOf(new ApiError('ghost_import_invalid', 400, 'x'))).toEqual([]);
    expect(refusedRowsOf(new ApiError('validation_failed', 400, 'x', { issues }))).toBeNull();
    expect(refusedRowsOf(new Error('offline'))).toBeNull();
  });

  it.each(KNOWN_CODES)('has a Vietnamese and an English text for the row code %s', (code) => {
    const key = `admin.ghosts.import.rowCodes.${code}`;
    expect(i18n.global.te(key, 'vi')).toBe(true);
    expect(i18n.global.te(key, 'en')).toBe(true);
  });

  it('picks the unranked rows and names why each lacks data', () => {
    const points = unrankedGhost({ label: 'Cy', gap: 'points' });
    expect(unrankedOf([ghost(), unrankedGhost(), points]).map((row) => row.label)).toEqual([
      'Bob',
      'Cy',
    ]);
    expect([ghost(), unrankedGhost(), points].map(ghostStatusKey)).toEqual([
      'admin.ghosts.preview.ranked',
      'admin.ghosts.preview.gap.rejectedBefore',
      'admin.ghosts.preview.gap.points',
    ]);
  });
});
