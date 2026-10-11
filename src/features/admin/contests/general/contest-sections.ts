import { translate } from '@/i18n';

/** The general form's sections, top to bottom; each `AdminFormSection` carries `contest-section-<key>` as its id. */
export const CONTEST_SECTION_KEYS = [
  'info',
  'people',
  'time',
  'format',
  'access',
  'rating',
  'operations',
] as const;
export type ContestSectionKey = (typeof CONTEST_SECTION_KEYS)[number];

export const contestSectionId = (key: ContestSectionKey) => `contest-section-${key}`;

export const contestSectionLabel = (key: ContestSectionKey) =>
  translate(
    key === 'operations' ? 'admin.contestRules.section' : `admin.contests.general.sections.${key}`,
  );

/** Room left above a section for the editor's sticky tabs. */
const STICKY_TABS_PX = 64;

/** Brings a section into view below the sticky tabs (smoothly unless motion is reduced) and moves focus to its heading. */
export function jumpToSection(key: ContestSectionKey) {
  const section = document.getElementById(contestSectionId(key));
  if (!section) return;
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const top = section.getBoundingClientRect().top + window.scrollY - STICKY_TABS_PX;
  window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
  const heading = section.querySelector<HTMLElement>('h2');
  heading?.setAttribute('tabindex', '-1');
  heading?.focus({ preventScroll: true });
}
