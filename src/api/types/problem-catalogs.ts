import type { ApiPath, JsonBodyOf } from '../typed';
import type { Schemas } from '../schemas';

/** The two name-only catalogs share one admin API shape; each is served by the generated route it names. */
export const taxonRoutes = {
  'problem-types': '/admin/problem-types',
  'problem-groups': '/admin/problem-groups',
} as const satisfies Record<string, ApiPath>;
export type TaxonKind = keyof typeof taxonRoutes;
/** A problem type or group as staff see it (`GET /admin/problem-types`, `/admin/problem-groups`). */
export type TaxonAdmin = Schemas['CatalogItemResponse'];
export type CreateTaxonBody = JsonBodyOf<'/admin/problem-types', 'post'>;
export type UpdateTaxonBody = JsonBodyOf<'/admin/problem-types/{id}', 'patch'>;
/** A license with its markdown text (`GET /admin/licenses`). */
export type LicenseAdmin = Schemas['LicenseAdminResponse'];
export type CreateLicenseBody = JsonBodyOf<'/admin/licenses', 'post'>;
export type UpdateLicenseBody = JsonBodyOf<'/admin/licenses/{id}', 'patch'>;
