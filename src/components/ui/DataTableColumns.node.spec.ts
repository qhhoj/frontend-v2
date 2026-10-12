import { describe, expect, it } from 'vitest';
import { stickyOffsets } from './DataTableColumns';

describe('stickyOffsets', () => {
  it('puts each pinned column right after the ones before it', () => {
    expect(stickyOffsets([40, 120, 60])).toEqual([0, 40, 160]);
    expect(stickyOffsets([])).toEqual([]);
  });
});
