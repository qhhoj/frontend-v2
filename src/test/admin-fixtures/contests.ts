import type {
  ContestSettings,
  EditableContest,
  EditableContestProblem,
} from '@/api/types/contest-editing';
import { ok } from '../mock-api';

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
  hasRankingAccessCode: false,
  problemOutputPrefixes: [],
  users: [{ id: CURATOR_ID, username: 'admin_vnoj' }],
  ...overrides,
});

const contestBasics = (): Omit<EditableContest, 'problems' | 'viewer' | 'settings'> => ({
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
  authors: [{ id: 'id-thayhung', username: 'thayhung' }],
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
  viewer: { canEdit: true, isEditor: true, isTester: false, inContest: false },
  settings: contestSettings(),
  ...overrides,
});

export const contestEditorRoutes = (contest: EditableContest = editableContest()) => ({
  [`GET /contests/${contest.key}`]: ok(contest),
});
