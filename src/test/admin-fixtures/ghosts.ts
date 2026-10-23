// Relative imports only.
import type { Ghost } from '../../api/types/contest-ghosts';

export const ghost = (overrides: Partial<Ghost> = {}): Ghost => ({
  label: 'Ann',
  caption: 'THPT A',
  isUnranked: false,
  gap: null,
  cells: [{ problemCode: 'hcmus41a', minute: 12, rejectedBefore: 2, points: null }],
  ...overrides,
});

/** An icpc ghost without wrong-try counts: imported, shown last, "Không đủ dữ liệu". */
export const unrankedGhost = (overrides: Partial<Ghost> = {}): Ghost =>
  ghost({
    label: 'Bob',
    caption: 'THPT B',
    isUnranked: true,
    gap: 'rejectedBefore',
    cells: [{ problemCode: 'hcmus41a', minute: 30, rejectedBefore: null, points: null }],
    ...overrides,
  });

export const GHOST_CSV = [
  'label,caption,hcmus41a,hcmus41b',
  'Ann,THPT A,12+2,',
  'Bob,THPT B,30,',
].join('\r\n');
