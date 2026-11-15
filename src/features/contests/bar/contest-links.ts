/** The contest's four pages the bar and the top bar chip link to, with the `contests.tabs.*` key of each label. */
export const CONTEST_LINK_ROUTES = [
  { name: 'contest', tab: 'problems' },
  { name: 'contest-submissions', tab: 'submissions' },
  { name: 'contest-ranking', tab: 'ranking' },
  { name: 'contest-announcements', tab: 'announcements' },
] as const;
