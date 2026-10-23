import type { ContestListItem } from '../../api/types/contests';
import type { ProblemListItem } from '../../api/types/problems';
import { contestItem, problemItem } from '../fixtures';

// Relative imports only.

/** A problem row as the staff index lists it. */
export const adminProblemItem = (overrides: Partial<ProblemListItem> = {}): ProblemListItem => ({
  ...problemItem(),
  code: 'hcmus41c',
  name: 'Cây khung nhỏ nhất',
  points: 100,
  isPublic: true,
  ...overrides,
});

/** A contest row as the staff index lists it. */
export const adminContestItem = (overrides: Partial<ContestListItem> = {}): ContestListItem => ({
  ...contestItem(),
  key: 'hcmus-2026-r1',
  name: 'HCMUS Open 2026 · Vòng 1',
  phase: 'running',
  isRated: true,
  userCount: 214,
  ...overrides,
});
