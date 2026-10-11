import type { PolygonLinkState, PolygonProblem } from '../../api/types/polygon';

type PolygonPackage = PolygonProblem['latestPackage'];
export const polygonPackage = (overrides: Partial<PolygonPackage> = {}): PolygonPackage => ({
  id: 7,
  revision: 11,
  state: 'READY',
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
    autoSync: false,
    ...link,
  },
  latestPackage,
});
