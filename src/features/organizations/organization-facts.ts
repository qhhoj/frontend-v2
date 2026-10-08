import type { OrganizationDetail } from '@/api/types/organizations';

/** The places line: "unlimited" without a cap, else the free places (never below 0 when over the cap). */
export function slotsLine(detail: OrganizationDetail): {
  key: string;
  params?: Record<string, number>;
} {
  if (detail.slots === null) return { key: 'orgs.slotsUnlimited' };
  return {
    key: 'orgs.slotsLeft',
    params: { free: Math.max(0, detail.slots - detail.memberCount), slots: detail.slots },
  };
}

export const joinModeKey = (isOpen: boolean) => (isOpen ? 'orgs.open' : 'orgs.private');
