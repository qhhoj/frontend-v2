import type { AdminCapability } from '@/features/admin/admin-screens';
import type { PermissionRule } from '@/lib/permissions';
import 'vue-router';

declare module 'vue-router' {
  interface RouteMeta {
    /** i18n key of the page title. */
    titleKey?: string;
    requiresAuth?: boolean;
    /** Signed-in viewers are sent home. */
    guestOnly?: boolean;
    /** The admin area: viewers who may use none of its screens get the not-found page (existence is not revealed; `canEnterAdmin`). */
    adminArea?: boolean;
    /** Reachable while the second factor is pending. */
    allowPartial?: boolean;
    /** `'auth'`: the page draws its own top bar (only a route that renders `AuthLayout`). `'admin'`: AppShell renders AdminShell instead of the site header (plan 8f-1). */
    layout?: 'auth' | 'admin';
    /** Admin screens: the permission (or any-of list) the screen needs; viewers without it (and without `capability`) see AdminForbidden in place. */
    permission?: PermissionRule;
    /** Admin screens: an object right that also opens the screen. */
    capability?: AdminCapability;
  }
}

export {};
