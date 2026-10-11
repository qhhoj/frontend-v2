import { describe, expect, it } from 'vitest';
import { appendToDraft, fillPlaceholders } from './canned-text';

describe('canned reply text', () => {
  it('fills every {tên} and {bài} and leaves other braces alone', () => {
    const body = 'Chào {tên}! Bài {bài} đã sửa. {tên} xem lại {bài} nhé. {x} {Tên}';
    expect(fillPlaceholders(body, { creator: 'minhthu', problem: 'Trò chơi trên cây' })).toBe(
      'Chào minhthu! Bài Trò chơi trên cây đã sửa. minhthu xem lại Trò chơi trên cây nhé. {x} {Tên}',
    );
  });

  it('inserts names literally, even ones that look like replacement patterns', () => {
    expect(fillPlaceholders('{tên} / {bài}', { creator: '$&', problem: "$' $1" })).toBe(
      "$& / $' $1",
    );
  });

  it('appends after the draft with one blank line, or stands alone in an empty draft', () => {
    expect(appendToDraft('', 'Mẫu')).toBe('Mẫu');
    expect(appendToDraft('   \n', 'Mẫu')).toBe('Mẫu');
    expect(appendToDraft('Đã xem.\n\n\n', 'Mẫu')).toBe('Đã xem.\n\nMẫu');
  });
});
