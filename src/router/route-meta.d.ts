import type { PermissionRule } from '@/lib/permissions';
import 'vue-router';

declare module 'vue-router' {
  interface RouteMeta {
    /** i18n key of the page title. */
    titleKey?: string;
    requiresAuth?: boolean;
    /** Signed-in viewers are sent home. */
    guestOnly?: boolean;
    /** Non-staff viewers get the not-found page (existence is not revealed). */
    staffOnly?: boolean;
    /** Reachable while the second factor is pending. */
    allowPartial?: boolean;
    /** `'auth'`: the page draws its own top bar (only a route that renders `AuthLayout`). `'admin'`: AppShell renders AdminShell instead of the site header (plan 8f-1). */
    layout?: 'auth' | 'admin';
    /** Admin screens: the permission (or any-of list) the screen needs; staff without it see AdminForbidden in place. */
    permission?: PermissionRule;
  }
}

export {};
