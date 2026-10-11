import type {
  Announcement,
  ContestDetail,
  ContestListItem,
  ContestProblem,
  ContestStats,
  ContestListViewer,
  ContestViewer,
  ParticipationSummary,
  ProblemCell,
  ProblemViewerResult,
  Ranking,
  RankingRow,
} from '../api/types/contests';
import type {
  Language,
  ProblemDetail,
  ProblemEditorial,
  ProblemListItem,
  ProblemMeta,
} from '../api/types/problems';
import type {
  SubmissionCase,
  SubmissionDetail,
  SubmissionListItem,
  SubmissionStats,
} from '../api/types/submissions';
import type { LeaderboardEntry, RatingHistoryEntry, UserPage } from '../api/types/users';
import type { SecondFactorMethod, SessionResponse, SessionUser } from '../api/types/auth';
import type { DataExportStatus } from '../api/types/account';
import type { Profile, ProfileOrganization } from '../api/types/profile';
import type { OrganizationListItem } from '../api/types/organizations';

export const sessionUser = (overrides: Partial<SessionUser> = {}): SessionUser => ({
  id: '0192a000-0000-7000-8000-000000000001',
  username: 'user_01',
  rating: null,
  email: 'user01@example.com',
  isStaff: false,
  isSuperuser: false,
  permissions: [],
  isTotpEnabled: false,
  isWebauthnEnabled: false,
  siteTheme: 'auto',
  appearance: null,
  languageId: null,
  ...overrides,
});

export const sessionResponse = (overrides: Partial<SessionResponse> = {}): SessionResponse => ({
  user: sessionUser(),
  csrfToken: 'csrf-1',
  twoFactorRequired: false,
  twoFactor: null,
  passwordChangeRequired: false,
  impersonatorId: null,
  ...overrides,
});

/** A password-only session: no user yet, and the second factors the account can use (`[]` = disabled meanwhile). */
export const partialSession = (
  methods: SecondFactorMethod[] = ['totp', 'webauthn'],
  username = 'user_01',
): SessionResponse =>
  sessionResponse({ user: null, twoFactorRequired: true, twoFactor: { username, methods } });

/** `GET /auth/me` answers for a signed-in and a signed-out viewer. */
export const signedIn = (overrides: Partial<SessionResponse> = {}) => ({
  body: { data: sessionResponse(overrides) },
});
export const signedOut = {
  status: 401,
  body: { error: { code: 'unauthorized', message: 'Unauthorized' } },
};

export const profile = (overrides: Partial<Profile> = {}): Profile => ({
  about: '',
  aboutHtml: '',
  firstName: '',
  timezone: 'Asia/Ho_Chi_Minh',
  languageId: '0192a000-0000-7000-8000-00000000c017',
  aceTheme: 'auto',
  siteTheme: 'auto',
  appearance: null,
  mathEngine: 'auto',
  userScript: '',
  badges: [],
  displayBadgeId: null,
  organizations: [],
  ...overrides,
});

export const profileOrganization = (
  overrides: Partial<ProfileOrganization> = {},
): ProfileOrganization => ({
  id: '0192a000-0000-7000-8000-0000000001a1',
  slug: 'lhp',
  name: 'THPT Chuyên Lê Hồng Phong',
  shortName: 'LHP',
  isOpen: true,
  isAdmin: false,
  ...overrides,
});

export const dataExportStatus = (overrides: Partial<DataExportStatus> = {}): DataExportStatus => ({
  state: 'none',
  preparedAt: null,
  readyAt: null,
  expiresAt: null,
  size: null,
  nextPrepareAt: null,
  canPrepare: true,
  ...overrides,
});

export const CPP17_ID = '0192a000-0000-7000-8000-00000000c017';
export const PY3_ID = '0192a000-0000-7000-8000-0000000000b3';
export const TYPE_DP_ID = '0192a000-0000-7000-8000-0000000000d1';
export const TYPE_GRAPH_ID = '0192a000-0000-7000-8000-0000000000d2';

export const languageItem = (
  id: string,
  key: string,
  name: string,
  overrides: Partial<Language> = {},
): Language => ({
  id,
  key,
  name,
  shortName: null,
  commonName: name,
  ace: 'c_cpp',
  extension: 'cpp',
  template: '',
  fileOnly: false,
  fileSizeLimit: 0,
  includeInProblem: true,
  ...overrides,
});

export const problemMeta = (): ProblemMeta => ({
  types: [
    { id: TYPE_DP_ID, name: 'dp', fullName: 'Quy hoạch động' },
    { id: TYPE_GRAPH_ID, name: 'graph', fullName: 'Đồ thị' },
  ],
  groups: [],
  licenses: [],
  languages: [
    languageItem(CPP17_ID, 'CPP17', 'C++17'),
    languageItem(PY3_ID, 'PY3', 'Python 3'),
    languageItem('0192a000-0000-7000-8000-0000000000f1', 'OUTPUT', 'Output only', {
      fileOnly: true,
    }),
  ],
});

export const userPage = (overrides: Partial<UserPage> = {}): UserPage => ({
  id: sessionUser().id,
  username: 'user_01',
  displayName: 'user_01',
  points: 1200,
  performancePoints: 386.4,
  problemCount: 412,
  rating: 2104,
  rank: 27,
  ratingRank: 30,
  displayRank: 'user',
  aboutHtml: '',
  contributionPoints: 0,
  ratingSummary: { min: 1200, max: 2104, contests: 3 },
  organizations: [],
  dateJoined: '2024-09-14T03:00:00Z',
  staff: null,
  ...overrides,
});

/** Out of order on purpose: the client sorts by end time. */
export const ratingHistory = (): RatingHistoryEntry[] => [
  {
    contestKey: 'r41',
    contestName: 'Round 41',
    endTime: '2026-09-20T10:00:00Z',
    rating: 2018,
    rank: 12,
    performance: 2200,
  },
  {
    contestKey: 'r40',
    contestName: 'Round 40',
    endTime: '2026-09-01T10:00:00Z',
    rating: 1950,
    rank: 20,
    performance: 2000,
  },
  {
    contestKey: null,
    contestName: null,
    endTime: '2026-09-10T10:00:00Z',
    rating: null,
    rank: null,
    performance: null,
  },
  {
    contestKey: 'r42',
    contestName: 'Round 42',
    endTime: '2026-10-01T10:00:00Z',
    rating: 2104,
    rank: 4,
    performance: 2300,
  },
];

export const submissionItem = (
  overrides: Partial<SubmissionListItem> = {},
): SubmissionListItem => ({
  id: 'sub-1',
  user: { id: sessionUser().id, username: 'user_01', rating: null },
  problem: { code: 'aplusb', name: 'Tổng hai số', isDeleted: false, points: 100 },
  language: { id: CPP17_ID, key: 'CPP17', name: 'C++17' },
  date: '2026-10-08T09:58:00Z',
  status: 'D',
  result: 'AC',
  points: 100,
  casePoints: 10,
  caseTotal: 10,
  time: 0.04,
  memory: 1024,
  ...overrides,
});

export const contestItem = (overrides: Partial<ContestListItem> = {}): ContestListItem => ({
  key: 'r42',
  name: 'QHH Round #42 (Div. 2)',
  summary: '',
  startTime: '2026-10-08T08:00:00Z',
  endTime: '2026-10-08T11:24:37Z',
  timeLimit: null,
  phase: 'running',
  formatName: 'icpc',
  isRated: true,
  tags: [],
  organizations: [],
  userCount: 318,
  virtualCount: 0,
  organizations: [],
  isPrivate: false,
  isOrganizationPrivate: false,
  requiresAccessCode: false,
  requiresRankingAccessCode: false,
  disallowVirtual: false,
  registrationStart: null,
  registrationEnd: null,
  viewer: null,
  ...overrides,
});

export const leaderboardEntry = (
  rank: number,
  username: string,
  rating: number | null,
): LeaderboardEntry => ({
  rank,
  id: `0192a000-0000-7000-8000-0000000001${String(rank).padStart(2, '0')}`,
  username,
  displayName: username,
  points: 0,
  performancePoints: 0,
  problemCount: 0,
  rating,
  contributionPoints: 0,
  displayRank: 'user',
  organization: null,
});

export const problemItem = (overrides: Partial<ProblemListItem> = {}): ProblemListItem => ({
  id: '0192a000-0000-7000-8000-0000000002a1',
  code: 'lis',
  name: 'Dãy con tăng dài nhất',
  group: null,
  types: [{ id: TYPE_DP_ID, name: 'dp', fullName: 'Quy hoạch động' }],
  points: 1400,
  partial: false,
  userCount: 2011,
  acRate: 55.2,
  date: '2026-01-01T00:00:00Z',
  isPublic: true,
  isOrganizationPrivate: false,
  hasPublicEditorial: false,
  hasPdfStatement: false,
  viewerStatus: null,
  ...overrides,
});

export const RANKING_PROBLEM_IDS = ['prob-a', 'prob-b', 'prob-c'] as const;
const [PROBLEM_A, PROBLEM_B, PROBLEM_C] = RANKING_PROBLEM_IDS;

export const CONTEST_PROBLEM_IDS = RANKING_PROBLEM_IDS;
const CONTEST_PROBLEM_NAMES = [
  'Dãy số đẹp',
  'Trò chơi trên cây',
  'Đường đi ngắn nhất có ràng buộc',
];

export const contestProblem = (
  index: number,
  overrides: Partial<ContestProblem> = {},
): ContestProblem => ({
  problemId: CONTEST_PROBLEM_IDS[index]!,
  code: `r42${'abc'[index]}`,
  name: CONTEST_PROBLEM_NAMES[index]!,
  label: 'ABC'[index]!,
  points: 100,
  partial: false,
  isPretested: false,
  maxSubmissions: null,
  timeLimit: null,
  memoryLimit: null,
  solverCount: null,
  viewerResult: null,
  ...overrides,
});

export const viewerResult = (
  overrides: Partial<ProblemViewerResult> = {},
): ProblemViewerResult => ({
  cell: null,
  isSolved: false,
  attempts: 0,
  hasPendingSubmission: false,
  ...overrides,
});

export const participationSummary = (
  overrides: Partial<ParticipationSummary> = {},
): ParticipationSummary => ({
  id: 'part-01',
  virtual: 0,
  isRegistered: false,
  isDisqualified: false,
  realStart: '2026-10-08T08:00:00Z',
  endTime: '2026-10-08T11:24:37Z',
  rulesAcceptedAt: null,
  rulesAcceptedRevision: null,
  ...overrides,
});

export const listViewer = (overrides: Partial<ContestListViewer> = {}): ContestListViewer => ({
  liveStatus: null,
  isCurrent: false,
  ...overrides,
});

export const contestViewer = (overrides: Partial<ContestViewer> = {}): ContestViewer => ({
  ...listViewer(),
  canEdit: false,
  isEditor: false,
  isTester: false,
  inContest: false,
  canViewBalloons: false,
  liveParticipation: null,
  ...overrides,
});

export const contestDetail = (overrides: Partial<ContestDetail> = {}): ContestDetail => ({
  ...contestItem(),
  description: '',
  descriptionHtml: '<p>Vòng tuần cho đội tuyển, xếp hạng kiểu ICPC.</p>',
  rules: '',
  rulesHtml: '',
  rulesRevision: 0,
  authors: [{ id: '0192a000-0000-7000-8000-0000000003a1', username: 'thayhung', rating: null }],
  frozenLastMinutes: 60,
  scoreboardVisibility: 'V',
  showSubmissionList: false,
  pointsPrecision: 0,
  runPretestsOnly: false,
  hideProblemTags: false,
  hideProblemAuthors: false,
  showShortDisplay: false,
  labelStyle: 'alpha',
  formatConfig: {},
  problems: null,
  viewer: contestViewer(),
  settings: null,
  ...overrides,
});

/** Ids grow with `index` like UUID v7, so a higher index is a newer announcement. */
export const announcement = (
  index: number,
  overrides: Partial<Announcement> = {},
): Announcement => ({
  id: `0192a000-0000-7000-8000-0000000004${String(index).padStart(2, '0')}`,
  title: `Thông báo ${index}`,
  description: `Nội dung ${index}`,
  descriptionHtml: `<p>Nội dung ${index}</p>`,
  createdAt: `2026-10-08T0${Math.min(index, 9)}:00:00Z`,
  ...overrides,
});

export const contestStats = (overrides: Partial<ContestStats> = {}): ContestStats => ({
  problems: [
    {
      problemId: CONTEST_PROBLEM_IDS[0],
      code: 'r42a',
      name: 'Dãy số đẹp',
      label: 'A',
      results: { AC: 412, WA: 61, CE: 18, TLE: 9, ERR: 5, RJ: 0 },
      total: 505,
      acRate: 81.6,
    },
    {
      problemId: CONTEST_PROBLEM_IDS[1],
      code: 'r42b',
      name: 'Trò chơi trên cây',
      label: 'B',
      results: { AC: 0, WA: 0, CE: 0, TLE: 0, ERR: 0, RJ: 0 },
      total: 0,
      acRate: 0,
    },
  ],
  languages: [
    {
      languageId: '0192a000-0000-7000-8000-0000000000c1',
      name: 'C++20',
      count: 1952,
      acRate: 38.4,
    },
    {
      languageId: '0192a000-0000-7000-8000-0000000000c2',
      name: 'Python 3',
      count: 402,
      acRate: 21.9,
    },
  ],
  ...overrides,
});

export const rankingRow = (
  rank: number,
  participationId: string,
  username: string,
  score: number,
  cumtime: number,
  cells: Record<string, ProblemCell>,
): RankingRow => ({
  rank,
  participationId,
  user: {
    id: username === 'user_01' ? sessionUser().id : `${participationId}-user`,
    username,
    organization: null,
    rating: null,
  },
  virtual: 0,
  isDisqualified: false,
  score,
  cumtime,
  tiebreaker: 0,
  cells,
});

/** A frozen ICPC board: user_07 first-solved A, has B after one wrong try and C pending; user_01 is the viewer. */
export const ranking = (overrides: Partial<Ranking> = {}): Ranking => ({
  frozen: true,
  problems: [
    {
      problemId: PROBLEM_A,
      code: 'r42a',
      label: 'A',
      points: 1,
      firstSolve: 'part-07',
      acceptedCount: 4,
    },
    {
      problemId: PROBLEM_B,
      code: 'r42b',
      label: 'B',
      points: 1,
      firstSolve: 'part-12',
      acceptedCount: 2,
    },
    {
      problemId: PROBLEM_C,
      code: 'r42c',
      label: 'C',
      points: 1,
      firstSolve: null,
      acceptedCount: 0,
    },
  ],
  rows: [
    rankingRow(1, 'part-07', 'user_07', 2, 41, {
      [PROBLEM_A]: { time: 540, points: 1, tries: 1 },
      [PROBLEM_B]: { time: 1860, points: 1, tries: 2 },
      [PROBLEM_C]: { time: null, points: 0, tries: 2, pending: true },
    }),
    rankingRow(2, 'part-12', 'user_12', 2, 55, {
      [PROBLEM_A]: { time: 720, points: 1, tries: 1 },
      [PROBLEM_B]: { time: 1320, points: 1, tries: 1 },
      [PROBLEM_C]: { time: null, points: 0, tries: 4 },
    }),
    rankingRow(3, 'part-03', 'user_03', 1, 14, {
      [PROBLEM_A]: { time: 840, points: 1, tries: 1 },
    }),
    rankingRow(4, 'part-01', 'user_01', 1, 18, {
      [PROBLEM_A]: { time: 1080, points: 1, tries: 1 },
      [PROBLEM_B]: { time: null, points: 0, tries: 2 },
    }),
  ],
  ...overrides,
});

export const SCRATCH_ID = '0192a000-0000-7000-8000-0000000000f2';
/** A file-only language that takes up to 5 MB of `.sb3`. Not part of `problemMeta()` so existing lists stay as they are. */
export const scratchLanguage = (overrides: Partial<Language> = {}): Language =>
  languageItem(SCRATCH_ID, 'SCRATCH', 'Scratch 3', {
    fileOnly: true,
    extension: 'sb3',
    fileSizeLimit: 5,
    ace: 'text',
    ...overrides,
  });

export const problemDetail = (overrides: Partial<ProblemDetail> = {}): ProblemDetail => ({
  id: '0192a000-0000-7000-8000-0000000002c1',
  code: 'duongdi',
  name: 'Đường đi ngắn nhất',
  language: 'vi',
  translated: true,
  descriptionHtml: '<p>Thành phố có n nút giao thông.</p><pre>4 4\n1 2 5</pre>',
  source: '',
  summary: '',
  date: null,
  timeLimit: 1,
  memoryLimit: 262144,
  points: 1600,
  partial: false,
  types: [{ id: TYPE_GRAPH_ID, name: 'graph', fullName: 'Đồ thị' }],
  group: null,
  authors: [{ id: sessionUser().id, username: 'user_07', rating: null }],
  allowedLanguages: [
    languageItem(CPP17_ID, 'CPP17', 'C++17', {
      template: '#include <bits/stdc++.h>\nint main() {}\n',
    }),
    languageItem(PY3_ID, 'PY3', 'Python 3', {
      ace: 'python',
      extension: 'py',
      template: 'print()\n',
    }),
    scratchLanguage(),
  ],
  languageLimits: [{ language: 'PY3', timeLimit: 3, memoryLimit: 262144 }],
  pdfStatementUrl: null,
  availableTranslations: ['vi', 'en'],
  hasEditorial: true,
  userCount: 892,
  acRate: 38.4,
  canEdit: false,
  viewerStatus: null,
  contest: null,
  isPublic: true,
  isManuallyManaged: false,
  isFullMarkup: false,
  isOrganizationPrivate: false,
  organizations: [],
  license: null,
  materialUrl: null,
  submissionSourceVisibility: 'F',
  testcaseVisibility: 'O',
  testcaseResultVisibility: 'A',
  allowViewFeedback: true,
  editor: null,
  ...overrides,
});

export const problemEditorial = (overrides: Partial<ProblemEditorial> = {}): ProblemEditorial => ({
  problem: { code: 'duongdi', name: 'Đường đi ngắn nhất' },
  isPublic: true,
  publishOn: '2026-09-30T00:00:00Z',
  authors: [{ id: sessionUser().id, username: 'user_07', rating: null }],
  contentHtml: '<p>Dùng Dijkstra.</p>',
  canEdit: false,
  ...overrides,
});

export const submissionCase = (overrides: Partial<SubmissionCase> = {}): SubmissionCase => ({
  position: 1,
  status: 'AC',
  time: 0.014,
  memory: 3277,
  points: 1,
  total: 1,
  batch: null,
  ...overrides,
});

/** A graded WA submission of `duongdi`: 7 of 20 case points, 20 tests of which the viewer sees 3. */
export const submissionDetail = (overrides: Partial<SubmissionDetail> = {}): SubmissionDetail => ({
  ...submissionItem({
    id: 'sub-1',
    problem: { code: 'duongdi', name: 'Đường đi ngắn nhất', isDeleted: false, points: 100 },
    status: 'D',
    result: 'WA',
    points: 560,
    casePoints: 7,
    caseTotal: 20,
  }),
  error: null,
  currentTestcase: 0,
  isPretested: false,
  judgedOn: 'judge-1',
  judgedDate: '2026-10-08T09:58:03Z',
  rejudgedDate: null,
  cases: [
    submissionCase({ position: 1 }),
    submissionCase({ position: 2 }),
    submissionCase({ position: 3, status: 'WA', points: 0 }),
  ],
  batches: null,
  totalCases: 20,
  viewer: { canAbort: false, canRejudge: false, canReject: false },
  lockedAfter: null,
  ...overrides,
});

export const submissionStats = (overrides: Partial<SubmissionStats> = {}): SubmissionStats => ({
  judgedToday: 1284,
  acceptedToday: 526,
  verdictsToday: [
    { result: 'AC', count: 526 },
    { result: 'WA', count: 470 },
    { result: 'TLE', count: 160 },
    { result: 'RTE', count: 80 },
    { result: 'CE', count: 48 },
  ],
  queueLength: 3,
  judgesOnline: 4,
  judgesTotal: 4,
  verdictsToday: [],
  ...overrides,
});

export const organizationItem = (
  overrides: Partial<OrganizationListItem> = {},
): OrganizationListItem => ({
  id: '0192a000-0000-7000-8000-0000000000a1',
  slug: 'thpt-a',
  name: 'THPT A',
  shortName: 'A',
  isOpen: true,
  isUnlisted: false,
  memberCount: 120,
  performancePoints: 4200,
  ...overrides,
});

/** What `GET /home` counts for the login screen's counts line. */
export const HOME_COUNTS = {
  users: 905,
  problems: 412,
  submissions: 90210,
  contests: 7,
  languages: 12,
};
