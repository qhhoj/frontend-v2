import type { UserPage } from '@/api/types/users';

/** A site-banned account: rank "banned" (any viewer) or a stored ban reason (staff facts). */
export const isBannedPage = (page: Pick<UserPage, 'displayRank' | 'staff'>): boolean =>
  page.displayRank === 'banned' || Boolean(page.staff?.banReason);
