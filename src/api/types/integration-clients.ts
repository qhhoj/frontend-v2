import type { Schemas } from '../schemas';
import type { JsonBodyOf, QueryOf } from '../typed';

/** backend: IntegrationClientResponse (never carries the key) */
export type IntegrationClient = Schemas['IntegrationClientResponse'];
/** backend: CreatedIntegrationClientResponse, the only answer that carries `key` */
export type CreatedIntegrationClient = Schemas['CreatedIntegrationClientResponse'];
/** backend: CreateIntegrationClientDto */
export type CreateIntegrationClientBody = JsonBodyOf<'/integration-clients', 'post'>;
/** backend: integration-clients list query (page, pageSize) */
export type IntegrationClientListQuery = QueryOf<'/integration-clients'>;
/** backend: enum IntegrationScope */
export type IntegrationScope = Schemas['IntegrationScope'];
/** The scope boxes, in the backend's order. */
export const INTEGRATION_SCOPES = [
  'contests:write',
  'contests:read',
] as const satisfies readonly IntegrationScope[];
