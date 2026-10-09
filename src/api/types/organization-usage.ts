import type { Schemas } from '../schemas';
import type { JsonBodyOf } from '../typed';

/** backend: organizations/usage/dto/usage.response.ts (OrganizationUsageResponse) */
export type OrganizationUsage = Schemas['OrganizationUsageResponse'];
/** backend: organizations/usage/dto/usage.response.ts (QuotaMeterResponse) */
export type QuotaMeter = Schemas['QuotaMeterResponse'];
/** backend: organizations/usage/dto/usage.response.ts (CreditEntryResponse) */
export type CreditEntry = Schemas['CreditEntryResponse'];
/** backend: organizations/usage/dto/usage.response.ts (UsageOverviewRowResponse) */
export type UsageOverviewRow = Schemas['UsageOverviewRowResponse'];
/** backend: organizations/usage/dto/usage.dto.ts (enum OrganizationUsageSort) */
export type UsageSort = Schemas['OrganizationUsageSort'];
export type QuotaChanges = JsonBodyOf<'/organizations/{slug}/quota', 'patch'>;

/** @uiOnly the `details` member of a 403 `quota_exceeded` (backend `QuotaRefusal`); the error body is not a documented schema. */
export interface QuotaRefusal {
  meter: 'credits' | 'storage';
  limit: number;
  used: number;
  needed: number;
}
