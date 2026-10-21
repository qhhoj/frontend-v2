import type { PolygonLinkState, PolygonProblem } from '../../api/types/polygon';
import type { ImportJob } from '../../api/types/problem-imports';

type PolygonPackage = PolygonProblem['latestPackage'];
export const polygonPackage = (overrides: Partial<PolygonPackage> = {}): PolygonPackage => ({
  id: 7,
  revision: 11,
  state: 'READY',
  type: 'full',
  createdAt: '2026-10-02T03:00:00Z',
  ...overrides,
});

export const polygonProblem = (overrides: Partial<PolygonProblem> = {}): PolygonProblem => ({
  id: 415660,
  name: 'xau-doi-xung',
  title: 'Xâu đối xứng dài nhất',
  owner: 'lamter',
  revision: 11,
  modified: false,
  statements: [{ language: 'vietnamese', title: 'Xâu đối xứng dài nhất', hasTutorial: false }],
  latestPackage: polygonPackage(),
  ...overrides,
});

export const polygonLinkState = (
  link: Partial<PolygonLinkState['link']> = {},
  latestPackage: PolygonLinkState['latestPackage'] = polygonPackage({ id: 11, revision: 14 }),
): PolygonLinkState => ({
  link: {
    problemId: 412873,
    name: 'dem-cap-chia-het',
    owner: 'lamter',
    revision: 12,
    packageId: 9,
    packageCreatedAt: null,
    title: null,
    linkedAt: '2026-10-01T02:00:00Z',
    lastSyncAt: '2026-10-03T02:12:00Z',
    lastSyncResult: 'ok',
    lastSyncError: null,
    lastSyncErrorCode: null,
    lastSyncErrorParams: null,
    autoSync: false,
    options: {
      appendMainSolution: false,
      ignoreZeroPointBatches: false,
      ignoreZeroPointCases: false,
      mainStatementLanguage: null,
      maxCases: 100,
      statementLanguages: [],
      tutorialLanguage: null,
    },
    ...link,
  },
  latestPackage,
  runningJobId: null,
});

/** A queued create import of `bitcoder`'s problem; tests override the state, step and result they look at. */
export const importJob = (overrides: Partial<ImportJob> = {}): ImportJob => ({
  id: 'job-1',
  code: 'xau_doi_xung',
  mode: 'create',
  purpose: 'link',
  state: 'waiting',
  step: 'queued',
  progress: null,
  queuePosition: null,
  result: null,
  error: null,
  errorCode: null,
  errorParams: null,
  failedStep: null,
  retryable: false,
  createdAt: '2026-10-21T03:00:00Z',
  finishedAt: null,
  ...overrides,
});
