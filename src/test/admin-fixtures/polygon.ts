import type { PolygonLinkState, PolygonProblem } from '../../api/types/polygon';

export const polygonProblem = (overrides: Partial<PolygonProblem> = {}): PolygonProblem => ({
  id: 415660,
  name: 'xau-doi-xung',
  title: 'Xâu đối xứng dài nhất',
  owner: 'lamter',
  revision: 11,
  modified: false,
  latestPackage: { id: 7, revision: 11, state: 'READY' },
  linkedProblemCode: null,
  ...overrides,
});

export const polygonLinkState = (
  link: Partial<PolygonLinkState['link']> = {},
  latestPackage: PolygonLinkState['latestPackage'] = { id: 11, revision: 14, state: 'READY' },
): PolygonLinkState => ({
  link: {
    problemId: 412873,
    name: 'dem-cap-chia-het',
    owner: 'lamter',
    revision: 12,
    packageId: 9,
    linkedAt: '2026-10-01T02:00:00Z',
    lastSyncAt: '2026-10-03T02:12:00Z',
    lastSyncResult: 'ok',
    lastSyncError: null,
    autoSync: false,
    ...link,
  },
  latestPackage,
});
