import type { CreatedIntegrationClient, IntegrationClient } from '../api/types/integration-clients';
import type { ShortLink } from '../api/types/short-links';

export const shortLink = (overrides: Partial<ShortLink> = {}): ShortLink => ({
  code: 'k7m2xq',
  path: '/problems/aplusb',
  isAuto: true,
  hits: 0,
  lastHitAt: null,
  expiresAt: null,
  createdAt: '2026-10-09T08:00:00.000Z',
  ...overrides,
});

/** `qhi_` and 43 base64url characters, as the backend mints them. */
export const INTEGRATION_KEY = 'qhi_Q2xpZW50S2V5Rm9yVGVzdHNPbmx5X19fX19fX19fX1x';

export const integrationClient = (
  overrides: Partial<IntegrationClient> = {},
): IntegrationClient => ({
  id: '0192a000-0000-7000-8000-0000000f0001',
  name: 'Hệ thống thi tỉnh',
  keyPrefix: INTEGRATION_KEY.slice(0, 8),
  scopes: ['contests:write', 'contests:read'],
  allowedCidrs: ['10.0.0.0/8'],
  actsAs: { id: '0192a000-0000-7000-8000-0000000f0101', username: 'syncauthor' },
  expiresAt: null,
  lastUsedAt: null,
  revokedAt: null,
  createdAt: '2026-10-09T08:00:00.000Z',
  ...overrides,
});

export const createdIntegrationClient = (
  overrides: Partial<CreatedIntegrationClient> = {},
): CreatedIntegrationClient => ({ ...integrationClient(), key: INTEGRATION_KEY, ...overrides });
