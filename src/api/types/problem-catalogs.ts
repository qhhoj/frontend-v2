import type { JsonBodyOf } from '../typed';
import type { Schemas } from '../schemas';

/** The two name-only catalogs share one admin API shape. */
export type TaxonKind = 'problem-types' | 'problem-groups';
/** A problem type or group as staff see it (`GET /admin/problem-types`, `/admin/problem-groups`). */
export type TaxonAdmin = Schemas['CatalogItemResponse'];
export type CreateTaxonBody = JsonBodyOf<'/admin/problem-types', 'post'>;
export type UpdateTaxonBody = JsonBodyOf<'/admin/problem-types/{id}', 'patch'>;
/** A license with its markdown text (`GET /admin/licenses`). */
export type LicenseAdmin = Schemas['LicenseAdminResponse'];
export type CreateLicenseBody = JsonBodyOf<'/admin/licenses', 'post'>;
export type UpdateLicenseBody = JsonBodyOf<'/admin/licenses/{id}', 'patch'>;
