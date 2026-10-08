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
    /** `'auth'`: the page draws its own top bar; the shell keeps blobs, loading layer and the main landmark. */
    layout?: 'auth';
  }
}

export {};
