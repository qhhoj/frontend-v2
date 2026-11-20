import { areasOf, type Messages } from './admin-messages';

/** The admin areas only admin pages show: one chunk, loaded by `loadAdminMessages`. A new area file needs no edit here. */
export const ADMIN_ONLY_MESSAGES = areasOf(
  import.meta.glob<{ default: Messages }>('./admin/*.json', { eager: true }),
);
