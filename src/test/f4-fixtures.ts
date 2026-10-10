import type {
  BulkProblemsResult,
  OrganizationProblem,
  ProblemTag,
} from '../api/types/organization-problems';
import type {
  CreditEntry,
  OrganizationUsage,
  QuotaMeter,
  UsageOverviewRow,
} from '../api/types/organization-usage';
import type { DeletedProblem, PackageStatus } from '../api/types/problem-lifecycle';

export const MIB = 1024 * 1024;
export const f4Id = (seed: number) => `0192a000-0000-7000-8000-${String(seed).padStart(12, '0')}`;

export const problemTag = (overrides: Partial<ProblemTag> = {}): ProblemTag => ({
  id: f4Id(701),
  slug: 'qhd',
  name: 'Quy hoạch động',
  color: 'tag-1',
  ...overrides,
});
/** The catalogue of board M7A, first three tags. */
export const TAGS: ProblemTag[] = [
  problemTag(),
  problemTag({ id: f4Id(702), slug: 'dt', name: 'Đồ thị', color: 'tag-2' }),
  problemTag({ id: f4Id(703), slug: 'cb', name: 'Cơ bản', color: 'tag-3' }),
];

export const orgProblem = (overrides: Partial<OrganizationProblem> = {}): OrganizationProblem => ({
  code: 'lhp_lis',
  name: 'Dãy con tăng dài nhất',
  points: 100,
  isPublic: false,
  isArchived: false,
  tags: [TAGS[0]!, TAGS[2]!],
  updatedAt: '2026-10-08T09:30:00Z',
  ...overrides,
});
/** Four live rows as board M7A draws them. */
export const ORG_PROBLEMS: OrganizationProblem[] = [
  orgProblem(),
  orgProblem({ code: 'lhp_tree', name: 'Trò chơi trên cây', points: 200, tags: [TAGS[1]!] }),
  orgProblem({ code: 'lhp_sp', name: 'Đường đi ngắn nhất', points: 150, tags: [TAGS[1]!] }),
  orgProblem({ code: 'lhp_seg', name: 'Truy vấn đoạn', points: 250, tags: [] }),
];

/** A bulk answer whose counts follow its rows; a skipped row is a code that is not this organization's live problem. */
export const bulkResult = (rows: [string, 'done' | 'skipped'][]): BulkProblemsResult => ({
  results: rows.map(([code, outcome]) =>
    outcome === 'done' ? { code, outcome } : { code, outcome, reason: 'not_found' },
  ),
  done: rows.filter(([, outcome]) => outcome === 'done').length,
  skipped: rows.filter(([, outcome]) => outcome === 'skipped').length,
});

/** Same rule as the backend's `meterOf`: near from 80 %, over above the limit; a zero limit is over at the first unit. */
export const quotaMeter = (used: number, limit: number): QuotaMeter => {
  const isOver = used > limit;
  return { used, limit, isOver, isNearLimit: isOver || (limit > 0 && used * 5 >= limit * 4) };
};

export const creditEntry = (overrides: Partial<CreditEntry> = {}): CreditEntry => ({
  reason: 'problem',
  amount: 10,
  ref: 'caitui2',
  createdAt: '2026-10-09T00:10:00Z',
  actor: { id: f4Id(711), username: 'minhthu' },
  ...overrides,
});

export const organizationUsage = (
  overrides: Partial<OrganizationUsage> = {},
): OrganizationUsage => ({
  organization: { slug: 'lhp', name: 'THPT chuyên Lê Hồng Phong' },
  month: '2026-10',
  enforcing: false,
  unlimited: false,
  credits: quotaMeter(164, 200),
  storage: quotaMeter(410 * MIB, 512 * MIB),
  quota: { monthlyCredits: null, storageBytes: null },
  recent: [
    creditEntry(),
    creditEntry({
      reason: 'contest',
      amount: 20,
      ref: 'thithu-2',
      createdAt: '2026-10-08T13:02:00Z',
    }),
    creditEntry({ reason: 'upload', amount: 3, createdAt: '2026-10-08T12:40:00Z', actor: null }),
    creditEntry({
      reason: 'refund',
      amount: -10,
      ref: 'caitui3',
      createdAt: '2026-10-08T12:41:00Z',
    }),
  ],
  ...overrides,
});

export const usageRow = (overrides: Partial<UsageOverviewRow> = {}): UsageOverviewRow => ({
  slug: 'lhp',
  name: 'THPT chuyên Lê Hồng Phong',
  month: '2026-10',
  creditsUsed: 164,
  creditsLimit: 200,
  storageUsed: 410 * MIB,
  storageLimit: 512 * MIB,
  unlimited: false,
  ...overrides,
});

export const deletedProblem = (overrides: Partial<DeletedProblem> = {}): DeletedProblem => ({
  code: 'cuvui',
  name: 'Cú vui',
  deletedAt: '2026-10-05T03:00:00Z',
  deletedBy: { id: f4Id(721), username: 'minhthu', rating: null },
  daysLeft: 26,
  isPurged: false,
  ...overrides,
});

export const packageStatus = (status: 'ready' | 'building'): PackageStatus => ({
  status,
  key: '3.9f2c1a07',
});
