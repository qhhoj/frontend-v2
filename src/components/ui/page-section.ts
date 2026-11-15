import { inject, ref } from 'vue';
import type { InjectionKey, Ref } from 'vue';

/** The shell section a page belongs to: its root path and the i18n key of its name. */
export interface CurrentSection {
  path: string;
  labelKey: string;
}

/** Provided by the app shell; `PageHeader` reads it to show the section as the first crumb. */
export const CURRENT_SECTION_KEY: InjectionKey<Readonly<Ref<CurrentSection | null>>> =
  Symbol('current-section');

/** The section on screen, or a ref to null where no shell provides one (a page mounted alone). */
export function useInjectedSection() {
  return inject(CURRENT_SECTION_KEY, ref(null));
}
