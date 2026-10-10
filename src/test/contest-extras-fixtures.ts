import type { ContestTag } from '../api/types/contest-tags';
import type {
  Balloon,
  ContestExportStatus,
  FeedKeyStatus,
  MintedFeedKey,
  PublishedProblem,
  PublishProblemsResult,
} from '../api/types/contest-ops';

export const contestTag = (overrides: Partial<ContestTag> = {}): ContestTag => ({
  slug: 'quoc-gia',
  name: 'Quốc gia',
  color: 'tag-5',
  description: '',
  order: 0,
  ...overrides,
});

/** The M4A board's catalogue: one tag per colour, in display order. */
export const TAG_CATALOGUE: ContestTag[] = [
  contestTag({ slug: 'olympic', name: 'Olympic', color: 'tag-1', order: 1 }),
  contestTag({ slug: 'thi-thu', name: 'Thi thử', color: 'tag-2', order: 2 }),
  contestTag({ slug: 'luyen-tap', name: 'Luyện tập', color: 'tag-3', order: 3 }),
  contestTag({ slug: 'truong', name: 'Trường', color: 'tag-4', order: 4 }),
  contestTag({ slug: 'quoc-gia', name: 'Quốc gia', color: 'tag-5', order: 5 }),
  contestTag({ slug: 'icpc', name: 'ICPC', color: 'tag-6', order: 6 }),
  contestTag({ slug: 'hoc-ky', name: 'Học kỳ', color: 'tag-7', order: 7 }),
  contestTag({ slug: 'dac-biet', name: 'Đặc biệt', color: 'tag-8', order: 8 }),
];

export const RULES_MARKDOWN =
  '1. Trung thực\n\nTự làm bài, không trao đổi mã nguồn hay ý tưởng với người khác.';
export const RULES_HTML =
  '<ol><li>Trung thực</li></ol><p>Tự làm bài, không trao đổi mã nguồn hay ý tưởng với người khác.</p>';

const TEAMS = ['ngocanh', 'minhkhoa', 'thuha', 'quanghuy', 'baochau'];
const PROBLEM_IDS = ['prob-a', 'prob-b', 'prob-c'];

/** The `index`-th balloon of the queue: teams and problems cycle, solve times grow by four minutes. */
export const balloon = (index: number, overrides: Partial<Balloon> = {}): Balloon => ({
  participationId: `part-${String(index).padStart(2, '0')}`,
  problemId: PROBLEM_IDS[index % PROBLEM_IDS.length]!,
  problemCode: `r42${'abc'[index % PROBLEM_IDS.length]}`,
  problemLabel: 'ABC'[index % PROBLEM_IDS.length]!,
  team: { userId: `user-${index}`, username: TEAMS[index % TEAMS.length]!, rating: null },
  solvedAt: 240 * (index + 1),
  isFirst: index < PROBLEM_IDS.length,
  deliveredAt: null,
  deliveredBy: null,
  ...overrides,
});

export const feedKeyStatus = (overrides: Partial<FeedKeyStatus> = {}): FeedKeyStatus => ({
  isActive: true,
  mode: 'frozen-until-release',
  expiresAt: '2026-10-22T08:00:00.000Z',
  releasedAt: null,
  createdBy: 'minhthu',
  ...overrides,
});

export const mintedFeedKey = (overrides: Partial<MintedFeedKey> = {}): MintedFeedKey => ({
  username: 'feed',
  key: 'qhf_8Kq2Zr5Lw9Tn3Vb6Xc1Md4Fg7Hj0Pa2s',
  mode: 'frozen-until-release',
  expiresAt: '2026-10-22T08:00:00.000Z',
  ...overrides,
});

export const contestExportStatus = (
  overrides: Partial<ContestExportStatus> = {},
): ContestExportStatus => ({
  state: 'ready',
  preparedAt: '2026-10-08T12:00:00.000Z',
  readyAt: '2026-10-08T12:03:00.000Z',
  size: 8_421_376,
  nextPrepareAt: '2026-10-09T12:00:00.000Z',
  ...overrides,
});

export const publishedProblem = (overrides: Partial<PublishedProblem> = {}): PublishedProblem => ({
  problemId: 'prob-a',
  code: 'r42a',
  outcome: 'published',
  reason: null,
  editorial: null,
  ...overrides,
});

export const publishResult = (
  items: PublishedProblem[],
  dryRun: boolean,
): PublishProblemsResult => ({ dryRun, items });
