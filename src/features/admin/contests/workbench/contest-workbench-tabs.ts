/** The workbench's three tabs. `setup` holds what every contest needs; the other two what few contests need. */
export const CONTEST_WORKBENCH_TABS = ['setup', 'results', 'other'] as const;
export type ContestWorkbenchTab = (typeof CONTEST_WORKBENCH_TABS)[number];

/** The setup tab's sections, in page order. */
export const CONTEST_SECTIONS = [
  'time',
  'problems',
  'participants',
  'announcements',
  'info',
] as const;
export type ContestSectionId = (typeof CONTEST_SECTIONS)[number];

interface RoutePlace {
  tab: ContestWorkbenchTab;
  /** The setup section the address opens; none opens the page at what is still missing. */
  section?: ContestSectionId;
}

/**
 * The eight tab addresses of the old editor still open the page (links from the contest page, the lists, the
 * organization tables). Each names the tab, and for the setup tab the section, where its content now is.
 */
const PLACE_OF_ROUTE: Readonly<Record<string, RoutePlace>> = {
  'admin-contestGeneral': { tab: 'setup' },
  'admin-contestProblems': { tab: 'setup', section: 'problems' },
  'admin-contestParticipants': { tab: 'setup', section: 'participants' },
  'admin-contestAnnouncements': { tab: 'setup', section: 'announcements' },
  'admin-contestRanking': { tab: 'results' },
  'admin-contestActions': { tab: 'results' },
  'admin-contestGhosts': { tab: 'results' },
  'admin-contestData': { tab: 'other' },
};
const placeOf = (routeName: unknown): RoutePlace =>
  PLACE_OF_ROUTE[String(routeName)] ?? { tab: 'setup' };

const isTab = (value: unknown): value is ContestWorkbenchTab =>
  (CONTEST_WORKBENCH_TABS as readonly unknown[]).includes(value);

/** The open tab: `?tab=` when the viewer picked one on the page, else the tab the address belongs to. */
export const tabOfRoute = (route: { name?: unknown; query: Record<string, unknown> }) =>
  isTab(route.query.tab) ? route.query.tab : placeOf(route.name).tab;

export const sectionOfRoute = (routeName: unknown): ContestSectionId | null =>
  placeOf(routeName).section ?? null;

/** The element ids old links point at with a hash (`#contest-actions-problem`), and the blocks of the results tab. */
export const RESULTS_ANCHORS = { ghosts: 'contest-results-ghosts' } as const;
