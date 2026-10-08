/** backend: apps/api/src/modules/organizations/core/dto/organization.response.ts (OrganizationListItemResponse) */
export interface OrganizationListItem {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  isOpen: boolean;
  isUnlisted: boolean;
  memberCount: number;
  performancePoints: number;
}
