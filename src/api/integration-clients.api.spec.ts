import { describe, expect, it } from 'vitest';
import { createdIntegrationClient, integrationClient, INTEGRATION_KEY } from '@/test/f5-fixtures';
import { mockApi, noContent, ok, page } from '@/test/mock-api';
import {
  createIntegrationClient,
  fetchIntegrationClients,
  revokeIntegrationClient,
} from './integration-clients.api';

describe('integration-clients api', () => {
  it('lists clients with the page', async () => {
    const calls = mockApi({ 'GET /integration-clients': page([integrationClient()]) });
    const result = await fetchIntegrationClients({ page: 1, pageSize: 50 });
    expect(calls[0]!.query.get('pageSize')).toBe('50');
    expect(result.items[0]!.actsAs.username).toBe('syncauthor');
  });

  it('creates a client and returns the key once', async () => {
    const calls = mockApi({
      'POST /integration-clients': { status: 201, ...ok(createdIntegrationClient()) },
    });
    const body = {
      name: 'Hệ thống thi tỉnh',
      scopes: ['contests:write' as const],
      allowedCidrs: ['10.0.0.0/8'],
      actsAs: 'syncauthor',
    };
    const created = await createIntegrationClient(body);
    expect(calls[0]).toMatchObject({ method: 'POST', path: '/integration-clients', body });
    expect(created.key).toBe(INTEGRATION_KEY);
  });

  it('revokes by id', async () => {
    const { id } = integrationClient();
    const calls = mockApi({ [`DELETE /integration-clients/${id}`]: noContent() });
    await revokeIntegrationClient(id);
    expect(calls[0]).toMatchObject({ method: 'DELETE', path: `/integration-clients/${id}` });
  });
});
