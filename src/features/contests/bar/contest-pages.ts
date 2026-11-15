/** The contest's own pages that draw `ContestHeader` (name, clock, tabs): the shell's `ContestBar` steps aside on them. */
export const CONTEST_HEADER_ROUTES: ReadonlySet<string> = new Set([
  'contest',
  'contest-announcements',
  'contest-submissions',
  'contest-stats',
  'contest-ranking',
  'contest-replay',
]);
