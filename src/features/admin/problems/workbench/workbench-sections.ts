/** The workbench's sections, in page order. `other` holds what a teacher rarely needs (external judging, Polygon, delete). */
export const WORKBENCH_SECTIONS = ['info', 'statement', 'tests', 'trial', 'other'] as const;
export type WorkbenchSectionId = (typeof WORKBENCH_SECTIONS)[number];

/**
 * The six tab addresses of the old editor still open the page (links from the problem page, the lists, the organization
 * tables). Each names the section it used to be; the general one names none, so the page opens at the next step.
 */
const SECTION_OF_ROUTE: Readonly<Record<string, WorkbenchSectionId | null>> = {
  'admin-problemGeneral': null,
  'admin-problemStatements': 'statement',
  'admin-problemFiles': 'statement',
  'admin-problemEditorial': 'statement',
  'admin-problemData': 'tests',
  'admin-problemExternal': 'other',
};
export const sectionOfRoute = (routeName: unknown): WorkbenchSectionId | null =>
  SECTION_OF_ROUTE[String(routeName)] ?? null;

/** The section's element id: what a step on the plate scrolls to. */
export const sectionDomId = (id: WorkbenchSectionId) => `workbench-${id}`;
