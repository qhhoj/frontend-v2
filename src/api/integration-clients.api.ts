import { apiGetPage, apiSend } from './typed';
import type {
  CreateIntegrationClientBody,
  IntegrationClientListQuery,
} from './types/integration-clients';

/** Session-only and never while impersonating (backend refuses with 403). */
export const fetchIntegrationClients = (query: IntegrationClientListQuery) =>
  apiGetPage('/integration-clients', { query });
export const createIntegrationClient = (body: CreateIntegrationClientBody) =>
  apiSend('post', '/integration-clients', { body });
export const revokeIntegrationClient = (id: string) =>
  apiSend('delete', '/integration-clients/{id}', { path: { id } });
