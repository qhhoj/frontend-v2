import type { Page } from './client';
import { apiGet, apiGetPage, apiSend } from './typed';
import type {
  OrganizationUsage,
  QuotaChanges,
  UsageOverviewRow,
  UsageSort,
} from './types/organization-usage';

export const USAGE_PAGE_SIZE = 50;

export const fetchOrganizationUsage = (slug: string): Promise<OrganizationUsage> =>
  apiGet('/organizations/{slug}/usage', { path: { slug } });

export const fetchUsageOverview = (
  sort: UsageSort,
  page: number,
): Promise<Page<UsageOverviewRow>> =>
  apiGetPage('/organizations/usage', { query: { sort, page, pageSize: USAGE_PAGE_SIZE } });

/** `null` clears an override (the site default applies); a missing member is left as it is. Staff only. */
export const updateOrganizationQuota = (
  slug: string,
  body: QuotaChanges,
): Promise<OrganizationUsage> =>
  apiSend('patch', '/organizations/{slug}/quota', { path: { slug }, body });
