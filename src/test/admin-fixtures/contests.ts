// Relative type-only imports and no test helpers: the e2e tsconfig has no `@/` alias, and Playwright loads this file too.
import type {
  Announcement,
  ContestActions,
  ContestDataStatus,
  ContestSettings,
  EditableContest,
  EditableContestProblem,
  OfficialRanking,
  Participation,
  RankingLink,
} from '../../api/types/contest-editing';

export const CURATOR_ID = '0192c5a1-7e2f-7a31-9b4c-0e6d1f4a9c21';

export const contestProblem = (
  label: string,
  code: string,
  name: string,
  extra: Partial<EditableContestProblem> = {},
): EditableContestProblem => ({
  problemId: `0192a000-0000-7000-8000-0000000041${label.charCodeAt(0).toString(16)}`,
  code,
  name,
  label,
  points: 100,
  partial: true,
  isPretested: false,
  maxSubmissions: null,
  timeLimit: null,
  memoryLimit: null,
  solverCount: null,
  viewerResult: null,
  ...extra,
});

/** What an editor reads back: the setting fields plus `pushAnnouncements`, `hasRankingAccessCode`, output prefixes and the usernames of the id lists. */
export const contestSettings = (overrides: Partial<ContestSettings> = {}): ContestSettings => ({
  isVisible: true,
  isPrivate: false,
  isOrganizationPrivate: false,
  organizations: [],
  privateContestants: [],
  curators: [CURATOR_ID],
  testers: [],
  bannedUsers: [],
  bannedJudges: [],
  viewContestScoreboard: [],
  lockedAfter: null,
  scoreboardCacheTimeout: 0,
  rateAll: false,
  rateExclude: [],
  ratingFloor: null,
  ratingCeiling: null,
  pushAnnouncements: false,
  ogImage: '',
  balloons: false,
  balloonStaff: [],
  publishAfterEnd: false,
  publishAfterEndBy: null,
  hasRankingAccessCode: false,
  problemOutputPrefixes: [],
  users: [{ id: CURATOR_ID, username: 'admin_vnoj', rating: null }],
  ...overrides,
});

const contestBasics = (): Omit<EditableContest, 'problems' | 'viewer' | 'settings'> => ({
  virtualCount: 0,
  organizations: [],
  descriptionHtml: '<p>Mỗi bài có đủ test ẩn.</p>',
  rules: '',
  rulesHtml: '',
  rulesRevision: 0,
  logoOverrideImage: '',
  key: 'hcmus-w41',
  name: 'Chọn đội tuyển HCMUS · Tuần 41',
  summary: 'Vòng tuần cho đội tuyển lớp 10–12.',
  description: 'Mỗi bài có đủ test ẩn.',
  tags: ['doi-tuyen', 'tuan'],
  startTime: '2026-10-08T06:00:00.000Z',
  endTime: '2026-10-08T10:00:00.000Z',
  timeLimit: null,
  phase: 'running',
  formatName: 'icpc',
  formatConfig: { penalty: 20 },
  isRated: true,
  userCount: 214,
  isPrivate: false,
  isOrganizationPrivate: false,
  authors: [{ id: 'id-thayhung', username: 'thayhung', rating: null }],
  registrationStart: null,
  registrationEnd: null,
  frozenLastMinutes: 60,
  scoreboardVisibility: 'V',
  showSubmissionList: false,
  pointsPrecision: 0,
  runPretestsOnly: false,
  hideProblemTags: true,
  hideProblemAuthors: false,
  showShortDisplay: false,
  labelStyle: 'alpha',
  disallowVirtual: false,
  requiresAccessCode: false,
  requiresRankingAccessCode: false,
});

export const editableContest = (overrides: Partial<EditableContest> = {}): EditableContest => ({
  ...contestBasics(),
  problems: [
    contestProblem('A', 'hcmus41a', 'Dãy số đẹp'),
    contestProblem('B', 'hcmus41b', 'Trò chơi trên cây'),
    contestProblem('C', 'hcmus41c', 'Đường đi ngắn nhất có ràng buộc', { maxSubmissions: 20 }),
  ],
  viewer: {
    boardFrozenAt: null,
    canSeeFullScoreboard: true,
    canEdit: true,
    isEditor: true,
    isTester: false,
    inContest: false,
    canViewBalloons: false,
    isCurrent: false,
    liveStatus: null,
    liveParticipation: null,
  },
  settings: contestSettings(),
  ...overrides,
});

export const contestEditorRoutes = (contest: EditableContest = editableContest()) => ({
  [`GET /contests/${contest.key}`]: { body: { data: contest } },
});

export const announcement = (overrides: Partial<Announcement> = {}): Announcement => ({
  id: 'a-1',
  title: 'Làm rõ đề bài C',
  description: 'Đồ thị…',
  descriptionHtml: '<p>Đồ thị…</p>',
  createdAt: '2026-10-08T08:02:00.000Z',
  ...overrides,
});

export const officialRanking = (overrides: Partial<OfficialRanking> = {}): OfficialRanking => ({
  url: null,
  problems: ['A', 'B', 'C', 'D', 'E', 'F'],
  rows: [
    {
      rank: 1,
      username: 'ngocanh',
      fullName: 'Nguyễn Ngọc Ánh',
      scores: [100, 100, 100, 70, 40, 0],
      totalScore: 410,
    },
    {
      rank: 2,
      username: 'minhtu',
      fullName: 'Trần Minh Tú',
      scores: [100, 100, 80, 70, 0, 0],
      totalScore: 350,
    },
    {
      rank: 3,
      username: 'bichngoc',
      fullName: 'Lê Bích Ngọc',
      scores: [100, 80, 60, 50, 20, 0],
      totalScore: 310,
    },
  ],
  ...overrides,
});

export const rankingLink = (overrides: Partial<RankingLink> = {}): RankingLink => ({
  token: 'q7Hk2xVn9aTzP4mR',
  status: 'public',
  expiryMode: 'U',
  expiryAmount: null,
  expiresAt: null,
  regeneratedAt: '2026-10-06T02:12:00.000Z',
  isValid: true,
  ...overrides,
});

export const contestActions = (overrides: Partial<ContestActions> = {}): ContestActions => ({
  rescore: 'idle',
  judgeFinal: 'idle',
  rate: 'idle',
  publish: 'idle',
  export: 'idle',
  replay: 'idle',
  pendingCount: 0,
  autoPublish: null,
  ...overrides,
});

export const contestDataStatus = (
  overrides: Partial<ContestDataStatus> = {},
): ContestDataStatus => ({
  state: 'ready',
  preparedAt: '2026-10-08T08:30:00.000Z',
  readyAt: '2026-10-08T08:40:00.000Z',
  size: 50_541_363,
  nextPrepareAt: '2026-10-08T09:40:00.000Z',
  ...overrides,
});

export const participation = (overrides: Partial<Participation> = {}): Participation => ({
  id: 'p-1',
  virtual: 0,
  isRegistered: true,
  isDisqualified: false,
  realStart: '2026-10-08T06:00:00.000Z',
  endTime: '2026-10-08T10:00:00.000Z',
  user: { id: 'id-ngocanh', username: 'ngocanh', rating: null },
  score: 5,
  cumtime: 15120,
  rulesAcceptedAt: null,
  rulesAcceptedRevision: null,
  tiebreaker: 0,
  cells: {},
  ...overrides,
});
