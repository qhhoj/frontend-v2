import type { SessionUser } from '@/api/types/auth';

/** Superusers hold every permission (Django semantics, which the backend keeps). */
export const hasPermission = (user: SessionUser | null, code: string) =>
  Boolean(user && (user.isSuperuser || user.permissions.includes(code)));
