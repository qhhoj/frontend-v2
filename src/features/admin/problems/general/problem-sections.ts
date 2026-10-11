import { translate } from '@/i18n';
import type { AdminSection } from '../../ui/form/AdminSectionNav.vue';

/** The General form's sections, in page order: the anchors of the section rail and of "Đi tới mục". */
export const PROBLEM_SECTION_IDS = {
  basics: 'problem-section-basics',
  limits: 'problem-section-limits',
  classes: 'problem-section-classes',
  visibility: 'problem-section-visibility',
  people: 'problem-section-people',
  status: 'problem-section-status',
  danger: 'problem-section-danger',
} as const;

const TITLE_KEYS: Record<keyof typeof PROBLEM_SECTION_IDS, string> = {
  basics: 'admin.problems.general.sections.basics',
  limits: 'admin.problems.general.sections.limits',
  classes: 'admin.problems.general.sections.classes',
  visibility: 'admin.problems.general.sections.visibility',
  people: 'admin.problems.general.sections.people',
  status: 'admin.problems.general.sections.status',
  danger: 'admin.problems.general.sections.danger',
};

/** The nav entries; the danger zone only when the viewer may delete. */
export function problemSections(withDanger: boolean): AdminSection[] {
  return (Object.keys(PROBLEM_SECTION_IDS) as (keyof typeof PROBLEM_SECTION_IDS)[])
    .filter((key) => withDanger || key !== 'danger')
    .map((key) => ({
      id: PROBLEM_SECTION_IDS[key],
      label: translate(TITLE_KEYS[key]),
      danger: key === 'danger',
    }));
}
